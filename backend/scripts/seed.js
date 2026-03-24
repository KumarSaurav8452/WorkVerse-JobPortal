/**
 * GraphHire — Seed Script
 * Seeds 50 candidates, 20 jobs, 30 skills, 10 companies into Neo4j AuraDB dd7f574a
 * Run: node scripts/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

// Realistic skill taxonomy
const SKILLS = [
  { name: 'JavaScript', category: 'Frontend' },
  { name: 'TypeScript', category: 'Frontend' },
  { name: 'React', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'Vue.js', category: 'Frontend' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Python', category: 'Backend' },
  { name: 'FastAPI', category: 'Backend' },
  { name: 'Express.js', category: 'Backend' },
  { name: 'GraphQL', category: 'Backend' },
  { name: 'Neo4j', category: 'Database' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'Redis', category: 'Database' },
  { name: 'AWS', category: 'Cloud' },
  { name: 'Docker', category: 'DevOps' },
  { name: 'Kubernetes', category: 'DevOps' },
  { name: 'CI/CD', category: 'DevOps' },
  { name: 'Machine Learning', category: 'AI/ML' },
  { name: 'TensorFlow', category: 'AI/ML' },
  { name: 'Data Science', category: 'AI/ML' },
  { name: 'Figma', category: 'Design' },
  { name: 'UI/UX Design', category: 'Design' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Java', category: 'Backend' },
  { name: 'Spring Boot', category: 'Backend' },
  { name: 'Go', category: 'Backend' },
  { name: 'Rust', category: 'Systems' },
  { name: 'Cypher', category: 'Database' },
  { name: 'Git', category: 'Tools' },
];

const COMPANIES = [
  { name: 'TechNova', industry: 'Software', size: '500-1000' },
  { name: 'DataSphere', industry: 'Analytics', size: '100-500' },
  { name: 'CloudEdge', industry: 'Cloud Services', size: '1000+' },
  { name: 'GraphLabs', industry: 'Graph Technology', size: '50-100' },
  { name: 'NeuralNet AI', industry: 'Artificial Intelligence', size: '100-500' },
  { name: 'PixelCraft', industry: 'Design Tech', size: '10-50' },
  { name: 'InfinityStack', industry: 'FullStack Solutions', size: '500-1000' },
  { name: 'ByteForge', industry: 'Software', size: '100-500' },
  { name: 'OpenSky', industry: 'Cloud Services', size: '1000+' },
  { name: 'Nexus Systems', industry: 'Enterprise Software', size: '1000+' },
];

const JOB_TITLES = [
  'Frontend Engineer', 'Backend Engineer', 'Full Stack Developer',
  'Data Scientist', 'ML Engineer', 'DevOps Engineer',
  'GraphQL Architect', 'Graph Database Engineer', 'Cloud Architect',
  'UI/UX Designer', 'Software Engineer', 'Lead Engineer',
  'Python Developer', 'Node.js Developer', 'React Developer',
  'Database Engineer', 'Site Reliability Engineer', 'Product Engineer',
  'AI Engineer', 'Platform Engineer',
];

const CANDIDATE_TITLES = [
  'Software Engineer', 'Senior Developer', 'Full Stack Engineer',
  'Data Engineer', 'ML Researcher', 'Frontend Lead',
  'Cloud Engineer', 'Solutions Architect', 'Product Manager',
  'Backend Developer', 'DevOps Specialist', 'Junior Developer',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function seed() {
  const session = driver.session({ database: 'neo4j' });
  console.log('🌱 Starting GraphHire seed — Neo4j AuraDB dd7f574a...\n');

  try {
    // 1. Create Skills
    console.log('📚 Seeding 30 skills...');
    for (const skill of SKILLS) {
      await session.run(
        `MERGE (s:Skill { name: $name })
         ON CREATE SET s.skillId = $skillId, s.category = $category, s.createdAt = datetime()`,
        { skillId: uuidv4(), name: skill.name, category: skill.category }
      );
    }

    // Add RELATED_TO relationships between adjacent skills
    const adjacency = [
      ['JavaScript', 'TypeScript'], ['React', 'JavaScript'], ['Next.js', 'React'],
      ['Node.js', 'JavaScript'], ['FastAPI', 'Python'], ['Spring Boot', 'Java'],
      ['TensorFlow', 'Machine Learning'], ['Data Science', 'Python'],
      ['Docker', 'Kubernetes'], ['Neo4j', 'Cypher'],
    ];
    for (const [a, b] of adjacency) {
      await session.run(
        `MATCH (a:Skill { name: $a }), (b:Skill { name: $b })
         MERGE (a)-[:RELATED_TO { weight: 0.9, type: 'adjacent' }]->(b)
         MERGE (b)-[:RELATED_TO { weight: 0.9, type: 'adjacent' }]->(a)`,
        { a, b }
      );
    }
    console.log('✅ Skills seeded with adjacency graph\n');

    // 2. Create Companies
    console.log('🏢 Seeding 10 companies...');
    const companyIds = {};
    for (const co of COMPANIES) {
      const companyId = uuidv4();
      companyIds[co.name] = companyId;
      await session.run(
        `MERGE (co:Company { name: $name })
         ON CREATE SET co.companyId = $companyId, co.industry = $industry,
                       co.size = $size, co.website = $website, co.createdAt = datetime()`,
        { companyId, name: co.name, industry: co.industry, size: co.size, website: `https://www.${co.name.toLowerCase().replace(/\s/g, '')}.com` }
      );
    }
    console.log('✅ Companies seeded\n');

    // 3. Create 50 Candidates
    console.log('👤 Seeding 50 candidates...');
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('password123', 10);
    const candidateIds = [];

    for (let i = 0; i < 50; i++) {
      const candidateId = uuidv4();
      candidateIds.push(candidateId);
      await session.run(
        `CREATE (c:Candidate {
          candidateId: $candidateId,
          name: $name,
          email: $email,
          password: $password,
          role: 'candidate',
          title: $title,
          bio: $bio,
          location: $location,
          phone: $phone,
          isLooking: $isLooking,
          profileScore: $profileScore,
          consentGiven: true,
          consentDate: datetime(),
          createdAt: datetime()
        })`,
        {
          candidateId,
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: hashed,
          title: faker.helpers.arrayElement(CANDIDATE_TITLES),
          bio: `Passionate professional with ${yoe} years of experience building scalable systems and working with modern technologies. Always eager to learn and tackle new challenges in a fast-paced environment.`,
          location: `${faker.location.city()}, ${faker.location.country()}`,
          phone: faker.phone.number(),
          isLooking: faker.datatype.boolean(0.7),
          profileScore: faker.number.int({ min: 40, max: 100 }),
        }
      );

      // Assign 3–6 random skills
      const cSkills = faker.helpers.arrayElements(SKILLS, faker.number.int({ min: 3, max: 6 }));
      for (const skill of cSkills) {
        await session.run(
          `MATCH (c:Candidate { candidateId: $candidateId }), (s:Skill { name: $skillName })
           MERGE (c)-[r:HAS_SKILL]->(s)
             ON CREATE SET r.proficiency = $proficiency, r.yearsExp = $yearsExp, r.lastUsed = date()`,
          {
            candidateId,
            skillName: skill.name,
            proficiency: faker.number.int({ min: 3, max: 10 }),
            yearsExp: faker.number.int({ min: 1, max: 8 }),
          }
        );
      }

      // Worked at a company
      const company = faker.helpers.arrayElement(COMPANIES);
      await session.run(
        `MATCH (c:Candidate { candidateId: $candidateId }), (co:Company { name: $companyName })
         MERGE (c)-[:WORKED_AT]->(co)`,
        { candidateId, companyName: company.name }
      );
    }

    // Add some CONNECTED_TO edges
    for (let i = 0; i < 30; i++) {
      const [a, b] = faker.helpers.arrayElements(candidateIds, 2);
      await session.run(
        `MATCH (a:Candidate { candidateId: $a }), (b:Candidate { candidateId: $b })
         MERGE (a)-[:CONNECTED_TO { connectedAt: datetime(), source: 'platform' }]->(b)`,
        { a, b }
      );
    }
    console.log('✅ 50 Candidates seeded with skills, experience, and connections\n');

    // 4. Create 20 Jobs
    console.log('💼 Seeding 20 jobs...');
    for (let i = 0; i < 20; i++) {
      const jobId = uuidv4();
      const company = faker.helpers.arrayElement(COMPANIES);
      const title = JOB_TITLES[i];
      await session.run(
        `MATCH (co:Company { name: $companyName })
         CREATE (j:Job {
           jobId: $jobId,
           title: $title,
           description: $description,
           salaryMin: $salaryMin,
           salaryMax: $salaryMax,
           remote: $remote,
           location: $location,
           experienceYears: $experienceYears,
           employmentType: 'full-time',
           status: 'active',
           postedAt: datetime() - duration({ days: $daysAgo }),
           deletedAt: null
         })-[:POSTED_BY]->(co)
         RETURN j.jobId`,
        {
          jobId,
          companyName: company.name,
          title,
          description: `We are looking for a talented ${title} to join our growing team. You will be responsible for developing high-quality solutions, collaborating with cross-functional teams, and driving innovation. The ideal candidate has strong problem-solving skills and a passion for technology. Join us to make a real impact!`,
          salaryMin: faker.number.int({ min: 60000, max: 100000 }),
          salaryMax: faker.number.int({ min: 100000, max: 200000 }),
          remote: faker.datatype.boolean(),
          location: `${faker.location.city()}, ${faker.location.country()}`,
          experienceYears: faker.number.int({ min: 1, max: 8 }),
          daysAgo: faker.number.int({ min: 0, max: 25 }),
        }
      );

      // Assign 2–4 required skills
      const jSkills = faker.helpers.arrayElements(SKILLS, faker.number.int({ min: 2, max: 4 }));
      for (const skill of jSkills) {
        await session.run(
          `MATCH (j:Job { jobId: $jobId }), (s:Skill { name: $skillName })
           MERGE (j)-[r:REQUIRES_SKILL]->(s)
             ON CREATE SET r.mandatory = $mandatory, r.minProficiency = $minProficiency`,
          {
            jobId,
            skillName: skill.name,
            mandatory: faker.datatype.boolean(0.8),
            minProficiency: faker.number.int({ min: 3, max: 7 }),
          }
        );
      }
    }
    console.log('✅ 20 Jobs seeded with required skills\n');
    console.log('🎉 GraphHire seed complete! Database: Neo4j AuraDB dd7f574a');
    console.log('   → 30 Skills | 10 Companies | 50 Candidates | 20 Jobs');
    console.log('   → All stored as graph nodes + relationships in Neo4j');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
