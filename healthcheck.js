/**
 * WorkVerse — Neo4j Healthcheck
 * Verifies connectivity to the Neo4j AuraDB instance
 * Run: node healthcheck.js
 */
const path = require('path');
const backendModules = path.join(__dirname, 'backend', 'node_modules');

require(path.join(backendModules, 'dotenv')).config({ path: path.join(__dirname, 'backend', '.env') });
const neo4j = require(path.join(backendModules, 'neo4j-driver'));

const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USER;
const PASS = process.env.NEO4J_PASSWORD;

console.log('🔍 Healthcheck — Neo4j AuraDB');
console.log(`   URI: ${URI}`);
console.log(`   User: ${USER}`);
console.log('');

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS));

(async () => {
  try {
    await driver.verifyConnectivity();
    console.log('✅ Connected successfully to Neo4j AuraDB');

    const session = driver.session({ database: 'neo4j' });
    const result = await session.run('MATCH (n) RETURN count(n) AS total');
    const total = result.records[0].get('total');
    console.log(`📊 Total nodes in database: ${typeof total.toNumber === 'function' ? total.toNumber() : total}`);
    await session.close();

    console.log('\n🎉 Healthcheck PASSED');
  } catch (err) {
    console.error('❌ Healthcheck FAILED:', err.message);
    process.exit(1);
  } finally {
    await driver.close();
  }
})();
