/**
 * WorkVerse — Skills Routes
 */
const router = require('express').Router();
const { getSession } = require('../config/neo4j');

// GET /api/skills — list/search skills
router.get('/', async (req, res) => {
  const { q, category, limit = 50 } = req.query;
  const session = getSession();
  try {
    let result;
    if (q) {
      result = await session.run(
        `CALL db.index.fulltext.queryNodes("skill_search", $q) YIELD node AS s, score
         RETURN s { .skillId, .name, .category } AS skill, score
         ORDER BY score DESC LIMIT $limit`,
        { q, limit: parseInt(limit) }
      );
    } else {
      const where = category ? `WHERE s.category = $category` : '';
      result = await session.run(
        `MATCH (s:Skill) ${where}
         OPTIONAL MATCH ()-[r:HAS_SKILL]->(s)
         WITH s, count(r) AS usageCount
         RETURN s { .skillId, .name, .category } AS skill, usageCount
         ORDER BY usageCount DESC LIMIT $limit`,
        { category, limit: parseInt(limit) }
      );
    }
    const skills = result.records.map(r => r.get('skill'));
    res.json({ skills });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// GET /api/skills/trending — trending in last 30 days (from PRD Cypher)
router.get('/trending', async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (j:Job)-[r:REQUIRES_SKILL]->(s:Skill)
       WHERE j.postedAt > datetime() - duration('P30D')
         AND j.status = 'active'
       RETURN s.name AS skill, s.category AS category, count(*) AS demand
       ORDER BY demand DESC
       LIMIT 20`
    );
    res.json(result.records.map(r => ({
      skill: r.get('skill'),
      category: r.get('category'),
      demand: r.get('demand').toNumber()
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

module.exports = router;
