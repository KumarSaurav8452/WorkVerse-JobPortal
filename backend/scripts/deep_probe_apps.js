const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

async function deepProbe() {
  const session = driver.session();
  try {
    console.log("--- 1. Orphaned Applications ---");
    const orphans = await session.run(`
      MATCH (a:Application)
      WHERE NOT (a)<-[:APPLIED_TO]-(:Candidate) OR NOT (a)-[:FOR_JOB]->(:Job)
      RETURN a.applicationId, a.status, count(a)
    `);
    console.log("Orphaned apps:", orphans.records.length);

    console.log("--- 2. All Applications and their links ---");
    const all = await session.run(`
      MATCH (c:Candidate)-[r1:APPLIED_TO]->(a:Application)-[r2:FOR_JOB]->(j:Job)
      RETURN c.candidateId AS cid, c.email AS email, j.jobId AS jid, j.title AS title, a.applicationId AS aid
      LIMIT 20
    `);
    all.records.forEach(r => {
      console.log(`C: ${r.get('cid')} (${r.get('email')}) -> J: ${r.get('jid')} (${r.get('title')})`);
    });

    console.log("--- 3. Job Creator Check ---");
    const jobCreators = await session.run(`
      MATCH (j:Job)-[:CREATED_BY_EMPLOYER]->(e:Employer)
      RETURN j.title, e.employerId, e.email
      LIMIT 10
    `);
    jobCreators.records.forEach(r => {
      console.log(`Job: ${r.get('j.title')} | Employer: ${r.get('e.email')} (${r.get('e.employerId')})`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await session.close();
    await driver.close();
  }
}

deepProbe();
