const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER || process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD));

async function exhaustiveHeal() {
  const session = driver.session();
  try {
    console.log("🛠️  EXHAUSTIVE GRAPH HEALING...");

    // 1. Link Employers to ANY Company matching their name or ID
    const res1 = await session.run(`
      MATCH (e:Employer), (co:Company)
      WHERE e.companyId = co.companyId OR toLower(e.company) = toLower(co.name)
      MERGE (e)-[r:WORKS_FOR]->(co)
      RETURN count(r) AS links
    `);
    console.log(`✅ Employer-Company Links: ${res1.records[0].get('links')}`);

    // 2. Link Jobs to ANY Company matching ID or the generic 'Your Company'
    const res2 = await session.run(`
      MATCH (j:Job), (co:Company)
      WHERE j.companyId = co.companyId OR co.name = 'Your Company' OR co.name = 'Unknown Company'
      MERGE (j)-[r:POSTED_BY]->(co)
      RETURN count(r) AS links
    `);
    console.log(`✅ Job-Company Links: ${res2.records[0].get('links')}`);

    // 3. Link ML Engineer jobs to Saurav specifically (Personal Link)
    const res3 = await session.run(`
      MATCH (j:Job), (e:Employer)
      WHERE (j.title CONTAINS 'ML' OR j.title CONTAINS 'Engineer') AND e.name = 'Saurav'
      MERGE (j)-[r:CREATED_BY_EMPLOYER]->(e)
      RETURN count(r) AS links
    `);
    console.log(`✅ Personal Saurav-Job Links: ${res3.records[0].get('links')}`);

    // 4. Final Cleanup: Ensure every Job has a Company (Link to FIRST found company if orphan)
    const res4 = await session.run(`
      MATCH (j:Job) WHERE NOT (j)-[:POSTED_BY]->()
      MATCH (co:Company) WITH j, co LIMIT 1
      MERGE (j)-[r:POSTED_BY]->(co)
      RETURN count(r) AS links
    `);
    console.log(`✅ Orphan Cleanup: ${res4.records[0].get('links')} jobs linked to default company.`);

  } catch (err) {
    console.error("❌ Link Error:", err);
  } finally {
    await session.close();
    await driver.close();
  }
}

exhaustiveHeal();
