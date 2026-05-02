const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER || process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD));

async function checkApps() {
  const session = driver.session();
  try {
    console.log("--- APPLICATION PROBE ---");
    const res = await session.run(`
      MATCH (c:Candidate)-[r1:APPLIED_TO]->(a:Application)-[r2:FOR_JOB]->(j:Job)
      RETURN c.name AS candidate, j.title AS job, a.status AS status, a.appliedAt AS date
      LIMIT 10
    `);

    if (res.records.length === 0) {
      console.log("No APPLIED_TO relationships found.");
    }

    res.records.forEach(r => {
      console.log(`Candidate: ${r.get('candidate')} | Job: ${r.get('job')} | Status: ${r.get('status')} | Date: ${r.get('date')}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkApps();
