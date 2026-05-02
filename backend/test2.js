const neo4j = require('neo4j-driver');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD), { disableLosslessIntegers: true });
const session = driver.session({ database: 'neo4j' });
async function run() {
  try {
    const skip = 0; const limit = 20; const location = '';
    const result = await session.run(
      `MATCH (j:Job)-[:POSTED_BY]->(co:Company)
       WHERE j.status = 'active' AND j.deletedAt IS NULL
       OPTIONAL MATCH (j)-[:REQUIRES_SKILL]->(s:Skill)
       WITH j, co, collect({ name: s.name, category: s.category, mandatory: s.mandatory }) AS skills
       RETURN j { .jobId, .title, .location, .status, .postedAt } AS job,
              co { .companyId, .name } AS company,
              skills
       ORDER BY j.postedAt DESC
       SKIP toInteger($skip) LIMIT toInteger($limit)`,
      { skip: parseInt(skip), limit: parseInt(limit), location: location || '' }
    );
    console.log('Result length:', result.records.length);
  } catch(e) { console.error('ERROR:', e.message); }
  await session.close();
  await driver.close();
}
run();
