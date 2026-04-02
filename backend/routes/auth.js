/**
 * GraphHire — Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 */
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getSession } = require('../config/neo4j');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

// --- NEO-TECH ADMIN SUITE ---
const serializeNeo4jValue = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val.toNumber === 'function') return val.toNumber();
  if (Array.isArray(val)) return val.map(serializeNeo4jValue);
  if (typeof val === 'object') {
    if (val.properties) return { ...serializeNeo4jValue(val.properties), _labels: val.labels, _type: val.type };
    const obj = {};
    for (const [k, v] of Object.entries(val)) { obj[k] = serializeNeo4jValue(v); }
    return obj;
  }
  return val;
};

const { auth } = require('../middleware/auth');

router.get('/admin-stats', auth, async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`
      CALL { MATCH (c:Candidate) RETURN count(c) as candidates }
      CALL { MATCH (j:Job) RETURN count(j) as jobs }
      CALL { MATCH (s:Skill) RETURN count(s) as skills }
      CALL { MATCH ()-[r]->() RETURN count(r) as relationships }
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
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

router.get('/admin-schema', auth, async (req, res) => {
  const session = getSession();
  try {
    const labelsRes = await session.run('CALL db.labels()');
    const relsRes = await session.run('CALL db.relationshipTypes()');
    res.json({ labels: labelsRes.records.map(r => r.get(0)), relationshipTypes: relsRes.records.map(r => r.get(0)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

router.get('/admin-query', auth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'No query provided' });
  const forbidden = ['CREATE', 'DELETE', 'MERGE', 'SET', 'REMOVE', 'DROP', 'CALL'];
  if (forbidden.some(word => q.toUpperCase().includes(word))) return res.status(403).json({ error: 'Read-only allowed' });

  const session = getSession();
  try {
    const result = await session.run(q);
    const records = result.records.map(r => {
      const obj = {};
      r.keys.forEach(k => { obj[k] = serializeNeo4jValue(r.get(k)); });
      return obj;
    });
    res.json({ keys: result.records[0]?.keys || [], data: records });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});
// --- END ADMIN SUITE ---

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role = 'candidate', company } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, password required' });
  }

  const session = getSession();
  try {
    const hashed = await bcrypt.hash(password, 12);
    const id = uuidv4();
    const cleanEmail = email.toLowerCase().trim();

    if (role === 'employer') {
      const companyId = uuidv4();
      const query = `
        MERGE (co:Company { name: $company })
          ON CREATE SET co.companyId = $companyId, co.createdAt = datetime()
        CREATE (u:Employer {
          employerId: $id,
          name: $name,
          email: $cleanEmail,
          password: $hashed,
          role: 'employer',
          companyId: co.companyId,
          createdAt: datetime()
        })-[:WORKS_FOR]->(co)
        RETURN u, co
      `;
      await session.run(query, { id, name, cleanEmail, hashed, company: company || 'Unknown Company', companyId });
      const token = signToken({ id, email: cleanEmail, role, companyId });
      return res.status(201).json({ token, user: { id, name, email: cleanEmail, role, companyId } });
    } else {
      const query = `
        CREATE (c:Candidate {
          candidateId: $id,
          name: $name,
          email: $cleanEmail,
          password: $hashed,
          role: 'candidate',
          isLooking: true,
          profileScore: 15,
          consentGiven: true,
          consentDate: datetime(),
          createdAt: datetime()
        })
        RETURN c
      `;
      await session.run(query, { id, name, cleanEmail, hashed });
      const token = signToken({ id, email: cleanEmail, role });
      return res.status(201).json({ token, user: { id, name, email: cleanEmail, role } });
    }
  } catch (err) {
    if (err.message.includes('already exists') || err.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  const session = getSession();
  try {
    const cleanEmail = email.toLowerCase().trim();
    // Try candidate first, then employer - using toLower for robustness
    let result = await session.run(
      `MATCH (c:Candidate) WHERE toLower(c.email) = $cleanEmail 
       RETURN c.candidateId AS id, c.name AS name, c.password AS pass, c.role AS role`,
      { cleanEmail }
    );
    let record = result.records[0];

    if (!record) {
      result = await session.run(
        `MATCH (e:Employer) WHERE toLower(e.email) = $cleanEmail
         RETURN e.employerId AS id, e.name AS name, e.password AS pass, e.role AS role, e.companyId AS companyId`,
        { cleanEmail }
      );
      record = result.records[0];
    }

    if (!record) return res.status(401).json({ error: 'Invalid credentials' });

    const pass = record.get('pass');
    const valid = await bcrypt.compare(password, pass);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const id = record.get('id');
    const name = record.get('name');
    const role = record.get('role');
    const companyId = role === 'employer' ? record.get('companyId') : undefined;
    const token = signToken(companyId ? { id, email: cleanEmail, role, companyId } : { id, email: cleanEmail, role });
    res.json({ token, user: companyId ? { id, name, email: cleanEmail, role, companyId } : { id, name, email: cleanEmail, role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
