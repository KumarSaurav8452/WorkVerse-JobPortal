/**
 * GraphHire — Applications Routes
 */
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getSession } = require('../config/neo4j');
const { auth } = require('../middleware/auth');

// POST /api/applications/jobs/:jobId/apply
router.post('/jobs/:jobId/apply', auth, async (req, res) => {
  const { coverLetter = '', source = 'direct' } = req.body;
  const candidateId = req.user.id;
  const appId = uuidv4();
  const session = getSession();
  try {
    // Check already applied (Standardized 2-property check)
    const check = await session.run(
      `MATCH (c:Candidate)-[:APPLIED_TO]->(a:Application)-[:FOR_JOB]->(j:Job)
       WHERE (c.candidateId = $candidateId OR c.id = $candidateId)
       AND (j.jobId = $jobId OR j.id = $jobId)
       RETURN a.appId`,
      { candidateId, jobId: req.params.jobId }
    );
    console.log("📝 [APPS] ALREADY APPLIED CHECK:", { count: check.records.length });
    if (check.records.length) return res.status(409).json({ error: 'Already applied to this job' });

    const createResult = await session.run(
      `MATCH (c:Candidate) WHERE (c.candidateId = $candidateId OR c.id = $candidateId)
       MATCH (j:Job) WHERE (j.jobId = $jobId OR j.id = $jobId)
       CREATE (a:Application {
         appId: $appId, appliedAt: $now,
         status: 'applied', coverLetter: $coverLetter, source: $source
       })
       CREATE (c)-[:APPLIED_TO]->(a)
       CREATE (a)-[:FOR_JOB]->(j)
       RETURN a.appId`,
      { candidateId, jobId: req.params.jobId, appId, coverLetter, source, now: new Date().toISOString() }
    );
    
    if (createResult.records.length === 0) {
      return res.status(404).json({ error: 'Candidate or Job record not located in graph' });
    }
    
    res.status(201).json({ appId, message: 'Application submitted — stored in Neo4j AuraDB' });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// GET /api/applications/jobs/:jobId — list applicants (employer)
router.get('/jobs/:jobId', auth, async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (c:Candidate)-[:APPLIED_TO]->(a:Application)-[:FOR_JOB]->(j:Job { jobId: $jobId })
       OPTIONAL MATCH (c)-[hs:HAS_SKILL]->(s:Skill)
       WITH c, a, collect({ name: s.name, proficiency: hs.proficiency }) AS skills
       RETURN c { .candidateId, .name, .title, .location, .profileScore } AS candidate,
              a { .appId, .status, .appliedAt, .coverLetter } AS application,
              skills
       ORDER BY a.appliedAt DESC`,
      { jobId: req.params.jobId }
    );
    res.json(result.records.map(r => ({ candidate: r.get('candidate'), application: r.get('application'), skills: r.get('skills') })));
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// PUT /api/applications/:appId/status — update status (employer)
router.put('/:appId/status', auth, async (req, res) => {
  const { status } = req.body;
  const VALID = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
  if (!VALID.includes(status)) return res.status(400).json({ error: `status must be one of: ${VALID.join(', ')}` });
  const session = getSession();
  try {
    await session.run(
      `MATCH (a:Application { appId: $appId })
       SET a.status = $status, a.updatedAt = $now`,
      { appId: req.params.appId, status, now: new Date().toISOString() }
    );
    res.json({ message: `Application status updated to "${status}"` });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

module.exports = router;
