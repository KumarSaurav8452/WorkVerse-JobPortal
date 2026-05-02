const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

async function healGraph() {
  const session = driver.session();
  try {
    console.log("🛠️  HEALING GRAPH RELATIONSHIPS...");

    // 1. Link Employers to Companies
    const res1 = await session.run(`
      MATCH (e:Employer), (co:Company)
      WHERE e.companyId = co.companyId
      MERGE (e)-[r:WORKS_FOR]->(co)
      RETURN count(r) AS links
    `);
    console.log(`✅ Linked ${res1.records[0].get('links')} Employers to their Companies.`);

    // 2. Link Jobs to Companies
    const res2 = await session.run(`
      MATCH (j:Job), (co:Company)
      WHERE j.companyId = co.companyId OR co.name = 'Your Company'
      MERGE (j)-[r:POSTED_BY]->(co)
      RETURN count(r) AS links
    `);
    console.log(`✅ Linked ${res2.records[0].get('links')} Jobs to their Companies.`);

    // 3. Link Jobs to Employers (Fallback/Harden)
    const res3 = await session.run(`
      MATCH (j:Job), (e:Employer)
      WHERE j.title = 'ML Engineer' AND e.name = 'Saurav' 
      MERGE (j)-[r:CREATED_BY_EMPLOYER]->(e)
      RETURN count(r) AS links
    `);
    console.log(`✅ Linked ${res3.records[0].get('links')} Jobs specifically to Saurav (Employer).`);

  } catch (err) {
    console.error("❌ Link Error:", err);
  } finally {
    await session.close();
    await driver.close();
  }
}

healGraph();
