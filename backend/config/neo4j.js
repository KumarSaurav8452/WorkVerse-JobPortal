const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
  {
    maxConnectionPoolSize: 50,
    connectionTimeout: 30000,
    disableLosslessIntegers: true,
  }
);

const getSession = (database = process.env.NEO4J_DATABASE || 'neo4j') => {
  return driver.session({ database });
};

const verifyConnectivity = async () => {
  try {
    await driver.verifyConnectivity();
    console.log('✅ Neo4j AuraDB connected: dd7f574a.databases.neo4j.io');
    const session = getSession();
    const result = await session.run('RETURN "GraphHire DB Ready" AS msg');
    console.log('📊 DB message:', result.records[0].get('msg'));
    await session.close();
  } catch (err) {
    console.error('❌ Neo4j connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { driver, getSession, verifyConnectivity };
