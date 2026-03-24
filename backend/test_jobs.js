const neo4j = require('neo4j-driver');
require('dotenv').config();
const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));
const session = driver.session({ database: 'neo4j' });
async function run() {
  try {
    let r = await session.run('MATCH (j:Job) RETURN count(j) AS c');
    console.log('Total Jobs:', r.records[0].get('c').toNumber());
    r = await session.run('MATCH (j:Job) WHERE j.status = \\'active\\' AND j.deletedAt IS NULL RETURN count(j) AS c');
    console.log('Active Jobs without deletedAt:', r.records[0].get('c').toNumber());
    r = await session.run('MATCH (j:Job)-[:POSTED_BY]->(co:Company) RETURN count(j) AS c');
    console.log('Jobs with COMPANY:', r.records[0].get('c').toNumber());
    r = await session.run('MATCH (j:Job) RETURN j LIMIT 1');
    console.dir(r.records[0].get('j').properties, { depth: null });
  } catch (err) {
    console.error(err);
  } finally {
    await session.close();
    await driver.close();
  }
}
run();
