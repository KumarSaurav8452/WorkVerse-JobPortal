/**
 * WorkVerse — Matching Engine Routes (Phase 3)
 * All powered by Cypher graph traversal on Neo4j AuraDB dd7f574a
 */
const router = require('express').Router();
const { getSession } = require('../config/neo4j');
const { auth } = require('../middleware/auth');

// GET /api/matching/jobs/:jobId/candidates — top matching candidates (PRD core query)
router.get('/jobs/:jobId/candidates', async (req, res) => {
  const { limit = 20 } = req.query;
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (j:Job { jobId: $jobId })-[:REQUIRES_SKILL]->(s:Skill)
       WITH j, collect(s) AS required, size(collect(s)) AS total
       MATCH (c:Candidate)-[r:HAS_SKILL]->(s)
       WHERE s IN required AND c.isLooking = true
       WITH c, count(s) AS matched, total, sum(r.proficiency) AS totalProf
       RETURN c { .candidateId, .name, .title, .location, .profileScore } AS candidate,
              round((matched * 1.0 / total) * 100) AS matchScore,
              totalProf,
              matched,
              total
       ORDER BY matchScore DESC, totalProf DESC
       LIMIT $limit`,
      { jobId: req.params.jobId, limit: parseInt(limit) }
    );
    res.json(result.records.map(r => ({
      candidate: r.get('candidate'),
      matchScore: r.get('matchScore'),
      matchedSkills: r.get('matched').toNumber(),
      totalRequired: r.get('total').toNumber()
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// GET /api/matching/candidates/:id/jobs — recommended jobs for candidate
router.get('/candidates/:id/jobs', auth, async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (c:Candidate { candidateId: $id })-[:HAS_SKILL]->(s:Skill)
       WITH c, collect(s) AS candidateSkills
       MATCH (j:Job { status: 'active' })-[rs:REQUIRES_SKILL]->(s)
       WHERE s IN candidateSkills AND j.deletedAt IS NULL
       WITH j, count(s) AS matchCount
       MATCH (j)-[:POSTED_BY]->(co:Company)
       RETURN j { .jobId, .title, .remote, .location, .salaryMin, .salaryMax } AS job,
              co.name AS company,
              matchCount
       ORDER BY matchCount DESC LIMIT 10`,
      { id: req.params.id }
    );
    let records = result.records;
    if (records.length === 0) {
      const fallback = await session.run(
         `MATCH (j:Job { status: 'active' })-[:POSTED_BY]->(co:Company)
          WHERE j.deletedAt IS NULL
          RETURN j { .jobId, .title, .remote, .location, .salaryMin, .salaryMax } AS job,
                 co.name AS company, 0 AS matchCount
          ORDER BY j.postedAt DESC LIMIT 10`
      );
      records = fallback.records;
    }
    res.json(records.map(r => ({ ...r.get('job'), company: r.get('company'), matchCount: r.get('matchCount').toNumber() })));
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// GET /api/matching/candidates/:id/skill-gap/:jobId — skill gap analysis (PRD query)
router.get('/candidates/:id/skill-gap/:jobId', auth, async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (j:Job { jobId: $jobId })-[:REQUIRES_SKILL]->(s:Skill)
       WHERE NOT (:Candidate { candidateId: $candidateId })-[:HAS_SKILL]->(s)
       OPTIONAL MATCH (s2:Skill)-[:RELATED_TO]->(s)
       WHERE (:Candidate { candidateId: $candidateId })-[:HAS_SKILL]->(s2)
       RETURN s.name AS missingSkill,
              s.category AS category,
              s2.name AS adjacentSkillYouHave`,
      { candidateId: req.params.id, jobId: req.params.jobId }
    );
    res.json(result.records.map(r => ({
      missingSkill: r.get('missingSkill'),
      category: r.get('category'),
      adjacentSkillYouHave: r.get('adjacentSkillYouHave')
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// GET /api/matching/candidates/:id/referral/:companyId — referral path discovery (PRD query)
router.get('/candidates/:id/referral/:companyId', auth, async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH path = shortestPath(
         (me:Candidate { candidateId: $myId })-[:CONNECTED_TO*1..3]-
         (insider:Candidate)-[:WORKED_AT]->(c:Company { companyId: $companyId })
       )
       RETURN [n IN nodes(path) | n.name] AS connectionPath,
              length(path) AS degrees
       ORDER BY degrees LIMIT 5`,
      { myId: req.params.id, companyId: req.params.companyId }
    );
    res.json(result.records.map(r => ({
      path: r.get('connectionPath'),
      degrees: r.get('degrees').toNumber()
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

module.exports = router;
