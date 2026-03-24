const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

async function finalProbe() {
  const session = driver.session();
  try {
    console.log("--- 1. Candidate ID properties ---");
    const candidates = await session.run(`
      MATCH (c:Candidate)
      RETURN c.candidateId, c.id, c.email
      LIMIT 10
    `);
    candidates.records.forEach(r => {
      console.log(`Email: ${r.get('c.email')} | candidateId: ${r.get('c.candidateId')} | id: ${r.get('c.id')}`);
    });

    console.log("--- 2. Job ID properties ---");
    const jobs = await session.run(`
      MATCH (j:Job)
      RETURN j.jobId, j.id, j.title
      LIMIT 10
    `);
    jobs.records.forEach(r => {
      console.log(`Title: ${r.get('j.title')} | jobId: ${r.get('j.jobId')} | id: ${r.get('j.id')}`);
    });

    console.log("--- 3. Application properties ---");
    const apps = await session.run(`
      MATCH (a:Application)
      RETURN a.applicationId, a.appId, a.status
      LIMIT 10
    `);
    apps.records.forEach(r => {
      console.log(`Status: ${r.get('a.status')} | applicationId: ${r.get('a.applicationId')} | appId: ${r.get('a.appId')}`);
    });

    console.log("--- 4. Direct relationship check ---");
    const relationships = await session.run(`
      MATCH (c:Candidate)-[r1:APPLIED_TO]->(a:Application)-[r2:FOR_JOB]->(j:Job)
      RETURN c.candidateId, a.applicationId, j.jobId
      LIMIT 5
    `);
    console.log("Valid relationship chains found:", relationships.records.length);

  } catch (err) {
    console.error(err);
  } finally {
    await session.close();
    await driver.close();
  }
}

finalProbe();
