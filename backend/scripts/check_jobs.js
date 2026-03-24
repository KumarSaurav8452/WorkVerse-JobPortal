const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

async function checkJobs() {
  const session = driver.session();
  try {
    console.log("--- LATEST 5 JOBS ---");
    const res = await session.run(`
      MATCH (j:Job)
      OPTIONAL MATCH (j)-[:POSTED_BY]->(co:Company)
      RETURN j.title AS title, j.jobId AS jobId, j.status AS status, j.postedAt AS postedAt, co.name AS company, co.companyId AS companyId
      ORDER BY j.postedAt DESC LIMIT 5
    `);
    res.records.forEach(r => {
      console.log(`Job: ${r.get('title')} | ID: ${r.get('jobId')} | Status: ${r.get('status')} | Date: ${r.get('postedAt')} | Co: ${r.get('company')} (${r.get('companyId')})`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkJobs();
