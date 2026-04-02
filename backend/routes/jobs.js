/**
 * GraphHire — Jobs Routes
 */
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getSession } = require('../config/neo4j');
const { auth, maybeAuth, requireRole } = require('../middleware/auth');

// GET /api/jobs — list active jobs with optional filters
router.get('/', maybeAuth, async (req, res) => {
  const { skip = 0, limit = 20, remote, location, search } = req.query;
  const session = getSession();
  try {
    let filters = [`j.status = 'active'`, `j.deletedAt IS NULL`];
    if (remote === 'true') filters.push(`j.remote = true`);
    if (location) filters.push(`j.location CONTAINS $location`);
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const currentUserId = req.user?.id;
    const result = await session.run(
      `MATCH (j:Job)-[:POSTED_BY]->(co:Company)
       ${where}
       OPTIONAL MATCH (j)-[:REQUIRES_SKILL]->(s:Skill)
       OPTIONAL MATCH (c:Candidate { candidateId: $currentUserId })-[:APPLIED_TO]->(:Application)-[:FOR_JOB]->(j)
       WITH j, co, collect({ name: s.name, category: s.category, mandatory: s.mandatory }) AS skills, count(c) > 0 AS applied
       RETURN j { .jobId, .title, .description, .salaryMin, .salaryMax, .remote, .location, .status, .postedAt, .experienceYears, applied: applied } AS job,
              co { .companyId, .name, .industry, .size } AS company,
              skills
       ORDER BY j.postedAt DESC
       SKIP toInteger($skip) LIMIT toInteger($limit)`,
      { skip: parseInt(skip), limit: parseInt(limit), location: location || '', currentUserId: currentUserId || '' }
    );
    const jobs = result.records.map(r => ({ ...r.get('job'), company: r.get('company'), skills: r.get('skills') }));
    res.json({ jobs, count: jobs.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// GET /api/jobs/my-jobs — specifically for the employer dashboard
router.get('/my-jobs', auth, async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (e:Employer) WHERE (e.employerId = $id OR e.id = $id)
       OPTIONAL MATCH (j:Job)-[:CREATED_BY_EMPLOYER]->(e)
       WHERE j IS NOT NULL AND j.status <> 'deleted'
       OPTIONAL MATCH (j)-[:POSTED_BY]->(co:Company)
       OPTIONAL MATCH (j)<-[:FOR_JOB]-(a:Application)
       WITH j, co, count(a) AS applicantCount
       RETURN j { .jobId, .id, .title, .location, .remote, .postedAt, .status, applicantCount } AS job,
              co { .name } AS company
       ORDER BY j.postedAt DESC`,
      { id: req.user.id }
    );
    const jobs = result.records
      .filter(r => r.get('job'))
      .map(r => ({ ...r.get('job'), companyName: r.get('company')?.name }));
    res.json({ jobs });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// GET /api/jobs/:id — full job detail
router.get('/:id', maybeAuth, async (req, res) => {
  const session = getSession();
  try {
    const currentUserId = req.user?.id;
    console.log("🔍 [DEBUG] FETCHING JOB DETAIL:", { 
      jobId: req.params.id, 
      currentUserId,
      authHeader: req.headers.authorization ? "Present" : "Missing"
    });
    
    const result = await session.run(
      `MATCH (j:Job) WHERE (j.jobId = $id OR j.id = $id)
       OPTIONAL MATCH (j)-[:POSTED_BY]->(co:Company)
       OPTIONAL MATCH (j)-[rs:REQUIRES_SKILL]->(s:Skill)
       OPTIONAL MATCH (c:Candidate)-[:APPLIED_TO]->(a:Application)-[:FOR_JOB]->(j)
       WHERE (c.candidateId = $currentUserId OR c.id = $currentUserId)
       WITH j, co, collect({ skillId: s.skillId, name: s.name, category: s.category, mandatory: rs.mandatory, minProficiency: rs.minProficiency }) AS skills, count(a) > 0 AS applied
       RETURN j { .jobId, .id, .title, .description, .salaryMin, .salaryMax, .remote, .location, .status, .postedAt, .experienceYears, .benefits, .employmentType, applied: applied } AS job,
              co { .companyId, .name, .industry, .size, .website } AS company,
              skills`,
      { id: req.params.id, currentUserId: currentUserId || '' }
    );
    if (!result.records.length) return res.status(404).json({ error: 'Job not found' });
    const r = result.records[0];
    const jobData = r.get('job');
    console.log("📝 [DEBUG] JOB DATA FOUND:", { 
      title: jobData.title, 
      appliedField: jobData.applied,
      rawCountInQuery: r.get('job').applied 
    });
    res.json({ job: jobData, company: r.get('company'), skills: r.get('skills') });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// POST /api/jobs — create job (employer only)
router.post('/', auth, async (req, res) => {
  const { title, description, salaryMin, salaryMax, remote = false, location, experienceYears = 0, employmentType = 'full-time', benefits = [], skills = [], companyId } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'title and description required' });

  const session = getSession();
  const jobId = uuidv4();
  try {
    const targetCompanyId = companyId || req.user.companyId || null;
    console.log("📝 CREATING JOB FOR EMPLOYER:", { title, employerId: req.user.id, targetCompanyId });
    
    // Create job node and link to BOTH company and employer for visibility safety
    const result = await session.run(
      `MATCH (e:Employer)-[:WORKS_FOR]->(co:Company)
       WHERE (e.employerId = $employerId OR e.id = $employerId)
         AND ($companyId IS NULL OR co.companyId = $companyId)
       CREATE (j:Job {
         jobId: $jobId, title: $title, description: $description,
         salaryMin: $salaryMin, salaryMax: $salaryMax,
         remote: $remote, location: $location, experienceYears: $experienceYears,
         employmentType: $employmentType, benefits: $benefits,
         status: 'active', postedAt: $now
       })
       CREATE (j)-[:CREATED_BY_EMPLOYER]->(e)
       CREATE (j)-[:POSTED_BY]->(co)
       RETURN j.jobId`,
      { employerId: req.user.id, jobId, title, description, salaryMin, salaryMax, remote, location, experienceYears, employmentType, benefits, companyId: targetCompanyId, now: new Date().toISOString() }
    );

    if (!result.records.length) {
      return res.status(400).json({ error: 'Employer is not linked to a valid company' });
    }

    // Link required skills
    for (const skill of skills) {
      await session.run(
        `MATCH (j:Job { jobId: $jobId })
          MERGE (s:Skill { name: $name })
            ON CREATE SET s.skillId = $skillId, s.category = $category, s.createdAt = $now
          MERGE (j)-[r:REQUIRES_SKILL]->(s)
            ON CREATE SET r.mandatory = $mandatory, r.minProficiency = $minProficiency`,
        { 
          jobId, name: skill.name, skillId: uuidv4(), 
          category: skill.category || 'General', 
          mandatory: skill.mandatory !== false, 
          minProficiency: parseInt(skill.minProficiency) || 3,
          now: new Date().toISOString()
        }
      );
    }

    res.status(201).json({ jobId, message: 'Job created and stored in Neo4j AuraDB (dd7f574a)' });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// PUT /api/jobs/:id — update job
router.put('/:id', auth, async (req, res) => {
  const { title, description, salaryMin, salaryMax, remote, location, status } = req.body;
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (j:Job { jobId: $id })
       SET j.title = coalesce($title, j.title),
           j.description = coalesce($description, j.description),
           j.salaryMin = coalesce($salaryMin, j.salaryMin),
           j.salaryMax = coalesce($salaryMax, j.salaryMax),
           j.remote = coalesce($remote, j.remote),
           j.location = coalesce($location, j.location),
           j.status = coalesce($status, j.status),
           j.updatedAt = $now
       RETURN j.jobId`,
      { id: req.params.id, title, description, salaryMin, salaryMax, remote, location, status, now: new Date().toISOString() }
    );
    if (!result.records.length) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// DELETE /api/jobs/:id — soft delete
router.delete('/:id', auth, async (req, res) => {
  const session = getSession();
  try {
    await session.run(
      `MATCH (j:Job { jobId: $id })
       SET j.deletedAt = $now, j.status = 'deleted'`,
      { id: req.params.id, now: new Date().toISOString() }
    );
    res.json({ message: 'Job archived (soft deleted)' });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

module.exports = router;
