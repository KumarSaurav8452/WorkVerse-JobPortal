/**
 * WorkVerse — Candidates Routes
 */
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { getSession } = require('../config/neo4j');
const { auth } = require('../middleware/auth');

const recalculateCandidateScore = async (session, candidateId) => {
  const result = await session.run(
    `MATCH (c:Candidate { candidateId: $id })
     OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
     WITH c, count(DISTINCT s) AS skillCount
     OPTIONAL MATCH (c)-[:HAS_EXPERIENCE]->(e:Experience)
     WITH c, skillCount, count(DISTINCT e) AS experienceCount
     OPTIONAL MATCH (c)-[:HAS_EDUCATION]->(ed:Education)
     WITH c, skillCount, experienceCount, count(DISTINCT ed) AS educationCount
     WITH c,
          (CASE WHEN trim(coalesce(c.name, '')) <> '' THEN 10 ELSE 0 END) +
          (CASE WHEN trim(coalesce(c.title, '')) <> '' THEN 15 ELSE 0 END) +
          (CASE WHEN trim(coalesce(c.bio, '')) <> '' THEN 15 ELSE 0 END) +
          (CASE WHEN trim(coalesce(c.location, '')) <> '' THEN 10 ELSE 0 END) +
          (CASE WHEN trim(coalesce(c.phone, '')) <> '' THEN 5 ELSE 0 END) +
          (CASE WHEN trim(coalesce(c.photoUrl, '')) <> '' THEN 8 ELSE 0 END) +
          (CASE WHEN trim(coalesce(c.resumeUrl, '')) <> '' THEN 12 ELSE 0 END) +
          (CASE WHEN trim(coalesce(c.githubUrl, '')) <> '' THEN 5 ELSE 0 END) +
          (CASE WHEN trim(coalesce(c.linkedInUrl, '')) <> '' THEN 5 ELSE 0 END) +
          (CASE WHEN c.isLooking = true THEN 5 ELSE 0 END) +
          (CASE
            WHEN skillCount >= 5 THEN 10
            WHEN skillCount > 0 THEN skillCount * 2
            ELSE 0
          END) +
          (CASE
            WHEN experienceCount >= 2 THEN 10
            WHEN experienceCount = 1 THEN 6
            ELSE 0
          END) +
          (CASE WHEN educationCount > 0 THEN 5 ELSE 0 END) AS rawScore
     SET c.profileScore = CASE WHEN rawScore > 100 THEN 100 ELSE rawScore END
     RETURN c.profileScore AS profileScore`,
    { id: candidateId }
  );
  return result.records[0]?.get('profileScore') || 0;
};

// GET /api/candidates — list with pagination
router.get('/', async (req, res) => {
  const { skip = 0, limit = 20, isLooking } = req.query;
  const session = getSession();
  try {
    const filter = isLooking !== undefined ? `WHERE c.isLooking = ${isLooking === 'true'}` : '';
    const result = await session.run(
      `MATCH (c:Candidate) ${filter}
       OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
       WITH c, collect({ name: s.name, category: s.category }) AS skills
       RETURN c { .candidateId, .name, .title, .location, .isLooking, .profileScore } AS candidate, skills
       ORDER BY c.profileScore DESC
       SKIP toInteger($skip) LIMIT toInteger($limit)`,
      { skip: parseInt(skip), limit: parseInt(limit) }
    );
    const candidates = result.records.map(r => ({ ...r.get('candidate'), skills: r.get('skills') }));
    res.json({ candidates, count: candidates.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// GET /api/candidates/:id — full profile
router.get('/:id', async (req, res) => {
  const session = getSession();
  try {
    await recalculateCandidateScore(session, req.params.id);
    const result = await session.run(
      `MATCH (c:Candidate { candidateId: $id })
       OPTIONAL MATCH (c)-[hs:HAS_SKILL]->(s:Skill)
       OPTIONAL MATCH (c)-[:HAS_EXPERIENCE]->(e:Experience)-[:AT_COMPANY]->(co:Company)
       OPTIONAL MATCH (c)-[:HAS_EDUCATION]->(ed:Education)-[:AT_UNIVERSITY]->(u:University)
       WITH c,
         collect(DISTINCT { skillId: s.skillId, name: s.name, category: s.category, proficiency: hs.proficiency, yearsExp: hs.yearsExp, lastUsed: hs.lastUsed }) AS skills,
         collect(DISTINCT { title: e.title, company: co.name, industry: co.industry, startDate: e.startDate, endDate: e.endDate, isCurrent: e.isCurrent, description: e.description }) AS experience,
         collect(DISTINCT { degree: ed.degree, field: ed.field, university: u.name, startYear: ed.startYear, endYear: ed.endYear }) AS education
       RETURN c { .candidateId, .name, .email, .title, .bio, .location, .phone, .isLooking, .profileScore, .createdAt, .photoUrl, .resumeUrl, .githubUrl, .linkedInUrl } AS profile,
              skills, experience, education`,
      { id: req.params.id }
    );
    if (!result.records.length) return res.status(404).json({ error: 'Candidate not found' });
    const r = result.records[0];
    res.json({ profile: r.get('profile'), skills: r.get('skills'), experience: r.get('experience'), education: r.get('education') });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// PUT /api/candidates/:id — update profile
router.put('/:id', auth, async (req, res) => {
  const { name, title, bio, location, phone, isLooking, photoUrl, resumeUrl, githubUrl, linkedInUrl } = req.body;
  console.log("🛠️ PUT CANDIDATE:", req.params.id);
  console.log("📦 BODY:", JSON.stringify(req.body).substring(0, 500)); // Log first 500 chars

  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (c:Candidate { candidateId: $id })
       SET c.name = coalesce($name, c.name),
           c.title = coalesce($title, c.title),
           c.bio = coalesce($bio, c.bio),
           c.location = coalesce($location, c.location),
           c.phone = coalesce($phone, c.phone),
           c.isLooking = coalesce($isLooking, c.isLooking),
           c.photoUrl = coalesce($photoUrl, c.photoUrl),
           c.resumeUrl = coalesce($resumeUrl, c.resumeUrl),
           c.githubUrl = coalesce($githubUrl, c.githubUrl),
           c.linkedInUrl = coalesce($linkedInUrl, c.linkedInUrl),
           c.updatedAt = $now
       RETURN c { .candidateId, .name, .title, .bio, .location, .isLooking, .photoUrl } AS candidate`,
      { 
        id: req.params.id, 
        name: name || null, 
        title: title || null, 
        bio: bio || null, 
        location: location || null, 
        phone: phone || null, 
        isLooking: typeof isLooking === 'boolean' ? isLooking : (isLooking === 'true' ? true : (isLooking === 'false' ? false : null)), 
        photoUrl: photoUrl || null, 
        resumeUrl: resumeUrl || null, 
        githubUrl: githubUrl || null, 
        linkedInUrl: linkedInUrl || null,
        now: new Date().toISOString()
      }
    );
    if (!result.records.length) {
      console.warn("⚠️ CANDIDATE NOT FOUND:", req.params.id);
      return res.status(404).json({ error: 'Not found' });
    }
    await recalculateCandidateScore(session, req.params.id);
    console.log("✅ UPDATE SUCCESS");
    res.json(result.records[0].get('candidate'));
  } catch (err) { 
    console.error("🔥 NEO4J ERROR:", err.message);
    res.status(500).json({ error: err.message }); 
  }
  finally { await session.close(); }
});

// POST /api/candidates/:id/skills — add skill
router.post('/:id/skills', auth, async (req, res) => {
  const { skillName, proficiency = 5, yearsExp = 1, category = 'General' } = req.body;
  if (!skillName) return res.status(400).json({ error: 'skillName required' });
  const session = getSession();
  try {
    await session.run(
      `MATCH (c:Candidate { candidateId: $id })
       OPTIONAL MATCH (existing:Skill) WHERE toLower(existing.name) = toLower($skillName)
       WITH c, coalesce(existing.name, $skillName) AS finalName, existing
       MERGE (s:Skill { name: finalName })
         ON CREATE SET s.skillId = $skillId, s.category = coalesce(existing.category, $category), s.createdAt = datetime()
       MERGE (c)-[r:HAS_SKILL]->(s)
         ON CREATE SET r.proficiency = $proficiency, r.yearsExp = $yearsExp, r.lastUsed = date()
         ON MATCH  SET r.proficiency = $proficiency, r.yearsExp = $yearsExp, r.lastUsed = date()
       RETURN s.name AS skill, r.proficiency AS proficiency`,
      { id: req.params.id, skillName, skillId: uuidv4(), category, proficiency, yearsExp }
    );
    await recalculateCandidateScore(session, req.params.id);
    res.status(201).json({ message: `Skill "${skillName}" added` });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// DELETE /api/candidates/:id/skills/:skillId — remove skill
router.delete('/:id/skills/:skillId', auth, async (req, res) => {
  const session = getSession();
  try {
    await session.run(
      `MATCH (c:Candidate { candidateId: $candidateId })-[r:HAS_SKILL]->(s:Skill { skillId: $skillId })
       DELETE r`,
      { candidateId: req.params.id, skillId: req.params.skillId }
    );
    res.json({ message: 'Skill removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// POST /api/candidates/:id/experience — add experience
router.post('/:id/experience', auth, async (req, res) => {
  const { title, company, industry, startDate, endDate, isCurrent, description } = req.body;
  if (!title || !company) return res.status(400).json({ error: 'Title and company required' });
  
  const session = getSession();
  try {
    await session.run(
      `MATCH (c:Candidate { candidateId: $id })
       MERGE (co:Company { name: $company })
         ON CREATE SET co.companyId = randomUUID(), co.industry = $industry, co.size = 'Unknown'
       CREATE (e:Experience {
         title: $title, startDate: $startDate, endDate: $endDate, 
         isCurrent: $isCurrent, description: $description
       })
       CREATE (c)-[:HAS_EXPERIENCE]->(e)-[:AT_COMPANY]->(co)
       RETURN e`,
      { id: req.params.id, company, title, industry: industry || 'Tech', startDate: startDate || '', endDate: endDate || '', isCurrent: !!isCurrent, description: description || '' }
    );
    await recalculateCandidateScore(session, req.params.id);
    res.status(201).json({ message: 'Experience added' });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

// GET /api/candidates/:id/applications
router.get('/:id/applications', auth, async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (c:Candidate { candidateId: $id })-[:APPLIED_TO]->(a:Application)-[:FOR_JOB]->(j:Job)-[:POSTED_BY]->(co:Company)
       RETURN a { .appId, .status, .appliedAt, .coverLetter } AS application,
              j { .jobId, .title, .remote, .salaryMin, .salaryMax } AS job,
              co.name AS company
       ORDER BY a.appliedAt DESC`,
      { id: req.params.id }
    );
    res.json(result.records.map(r => ({ ...r.get('application'), job: r.get('job'), company: r.get('company') })));
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

module.exports = router;
