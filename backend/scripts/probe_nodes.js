const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

async function probeNodes() {
  const session = driver.session();
  try {
    console.log("--- NODE PROBE ---");
    
    const res = await session.run(`
      MATCH (n) 
      WHERE n:Job OR n:Employer OR n:Company
      RETURN labels(n) AS labels, n {.*} AS props
      LIMIT 10
    `);

    res.records.forEach(r => {
      console.log(`Labels: ${JSON.stringify(r.get('labels'))} | Props: ${JSON.stringify(r.get('props'))}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await session.close();
    await driver.close();
  }
}

probeNodes();
