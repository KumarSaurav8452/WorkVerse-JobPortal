/**
 * GraphHire — Companies Routes
 */
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getSession } = require('../config/neo4j');

// GET /api/companies
router.get('/', async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (co:Company)
       OPTIONAL MATCH (j:Job)-[:POSTED_BY]->(co) WHERE j.status = 'active'
       WITH co, count(j) AS activeJobs
       RETURN co { .companyId, .name, .industry, .size, .website } AS company, activeJobs
       ORDER BY activeJobs DESC LIMIT 50`
    );
    res.json(result.records.map(r => ({ ...r.get('company'), activeJobs: r.get('activeJobs') })));
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// GET /api/companies/:id
router.get('/:id', async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (co:Company) WHERE co.companyId = $id
       OPTIONAL MATCH (j:Job { status: 'active' })-[:POSTED_BY]->(co)
       // Also include jobs created by employers who WORK_FOR this company
       OPTIONAL MATCH (e:Employer { companyId: $id })-[:WORKS_FOR]->(co)
       OPTIONAL MATCH (j2:Job)-[:CREATED_BY_EMPLOYER]->(e)
       OPTIONAL MATCH (c:Candidate)-[:WORKED_AT]->(co)
       WITH co, 
            collect(DISTINCT j { .jobId, .title, .remote, .location, .postedAt }) + 
            collect(DISTINCT j2 { .jobId, .title, .remote, .location, .postedAt }) AS allJobs,
            count(DISTINCT c) AS alumni
       RETURN co { .companyId, .name, .industry, .size, .website, .verifiedAt } AS company, 
              [jb IN allJobs WHERE jb.jobId IS NOT NULL] AS jobs, 
              alumni`,
      { id: req.params.id }
    );
    if (!result.records.length) return res.status(404).json({ error: 'Company not found' });
    const r = result.records[0];
    res.json({ company: r.get('company'), jobs: r.get('jobs'), alumni: r.get('alumni') });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

module.exports = router;
