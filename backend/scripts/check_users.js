const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

async function checkUsers() {
  const session = driver.session();
  try {
    console.log("--- USER AUTH PROBE ---");
    const res = await session.run(`
      MATCH (u) 
      WHERE u:Candidate OR u:Employer
      RETURN labels(u) AS labels, u.email AS email, u.role AS role, u.name AS name, u.password IS NOT NULL AS hasPassword
      LIMIT 20
    `);

    res.records.forEach(r => {
      console.log(`Type: ${r.get('labels')} | Email: "${r.get('email')}" | Role: ${r.get('role')} | Name: ${r.get('name')} | HasPass: ${r.get('hasPassword')}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkUsers();
