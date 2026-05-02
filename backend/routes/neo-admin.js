const router = require('express').Router();
const { getSession } = require('../config/neo4j');
const { auth } = require('../middleware/auth');

// Connectivity check
router.get('/ping', (req, res) => res.json({ status: 'admin-alive', timestamp: new Date().toISOString() }));

// Get high-level graph metrics
router.get('/stats', async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`
      CALL {
        MATCH (c:Candidate) RETURN count(c) as candidates
      }
      CALL {
        MATCH (j:Job) RETURN count(j) as jobs
      }
      CALL {
        MATCH (s:Skill) RETURN count(s) as skills
      }
      CALL {
        MATCH ()-[r]->() RETURN count(r) as relationships
      }
      RETURN candidates, jobs, skills, relationships
    `);
    
    const stats = result.records[0];
    res.json({
      candidates: stats.get('candidates').toNumber(),
      jobs: stats.get('jobs').toNumber(),
      skills: stats.get('skills').toNumber(),
      relationships: stats.get('relationships').toNumber(),
      dbStatus: 'online'
    });
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// Get graph schema (Labels and Types)
router.get('/schema', async (req, res) => {
  const session = getSession();
  try {
    const labelsRes = await session.run('CALL db.labels()');
    const relsRes = await session.run('CALL db.relationshipTypes()');
    
    res.json({
      labels: labelsRes.records.map(r => r.get(0)),
      relationshipTypes: relsRes.records.map(r => r.get(0))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// Simplified read-only query console
router.get('/query', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'No query provided' });
  
  // Basic read-only safety check
  const forbidden = ['CREATE', 'DELETE', 'MERGE', 'SET', 'REMOVE', 'DROP', 'CALL'];
  if (forbidden.some(word => q.toUpperCase().includes(word))) {
    return res.status(403).json({ error: 'Only read-only MATCH queries are allowed in the console' });
  }

  const serializeNeo4jValue = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val.toNumber === 'function') return val.toNumber(); // Handle Neo4j Integers
    if (Array.isArray(val)) return val.map(serializeNeo4jValue);
    if (typeof val === 'object') {
      if (val.properties) return { ...serializeNeo4jValue(val.properties), _labels: val.labels, _type: val.type };
      const obj = {};
      for (const [k, v] of Object.entries(val)) {
        obj[k] = serializeNeo4jValue(v);
      }
      return obj;
    }
    return val;
  };

  const session = getSession();
  try {
    const result = await session.run(q);
    const records = result.records.map(r => {
      const obj = {};
      r.keys.forEach(k => {
        obj[k] = serializeNeo4jValue(r.get(k));
      });
      return obj;
    });
    res.json({ keys: result.records[0]?.keys || [], data: records });
  } catch (error) {
    console.error('❌ Cypher Console Error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
