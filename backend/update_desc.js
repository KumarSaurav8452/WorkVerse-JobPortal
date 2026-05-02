const neo4j = require('neo4j-driver');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));
const session = driver.session({ database: 'neo4j' });
async function run() {
  try {
    await session.run('MATCH (j:Job) SET j.description = "We are looking for a talented professional to join our growing team. You will be responsible for developing high-quality solutions, collaborating with cross-functional teams, and driving innovation. The ideal candidate has strong problem-solving skills and a passion for technology. Join us to make a real impact!"');
    await session.run('MATCH (c:Candidate) SET c.bio = "Passionate professional with years of experience building scalable systems and working with modern technologies. Always eager to learn and tackle new challenges in a fast-paced environment."');
    console.log("Updated all previously seeded database nodes to use English!");
  } finally {
    await session.close();
    await driver.close();
  }
}
run();
