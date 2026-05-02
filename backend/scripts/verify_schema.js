/**
 * WorkVerse — Schema Verification & Fulltext Index Setup
 * Run: node scripts/verify_schema.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER || process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

const toNum = (v) => (v && typeof v.toNumber === 'function') ? v.toNumber() : v;

(async () => {
  const s = driver.session({ database: 'neo4j' });
  try {
    // Fulltext indexes
    const ftQueries = [
      'CREATE FULLTEXT INDEX skill_search IF NOT EXISTS FOR (n:Skill) ON EACH [n.name, n.category]',
      'CREATE FULLTEXT INDEX job_search IF NOT EXISTS FOR (n:Job) ON EACH [n.title, n.description]',
      'CREATE FULLTEXT INDEX candidate_search IF NOT EXISTS FOR (n:Candidate) ON EACH [n.name, n.title, n.bio]',
    ];
    for (const q of ftQueries) {
      try { await s.run(q); console.log('✅ ' + q.substring(0, 70) + '...'); }
      catch (e) { console.error('⚠️ SKIP:', e.message.substring(0, 80)); }
    }

    // Show constraints
    console.log('\n--- CONSTRAINTS ---');
    const c = await s.run('SHOW CONSTRAINTS');
    c.records.forEach(r => console.log('  ', r.get('name'), '|', r.get('type')));

    // Show indexes
    console.log('\n--- INDEXES ---');
    const ix = await s.run('SHOW INDEXES');
    ix.records.forEach(r => console.log('  ', r.get('name'), '|', r.get('type'), '|', r.get('state')));

    // Node counts per label
    console.log('\n--- NODE COUNTS ---');
    const nc = await s.run('MATCH (n) RETURN labels(n)[0] AS label, count(n) AS cnt ORDER BY cnt DESC');
    nc.records.forEach(r => console.log('  ', r.get('label'), ':', toNum(r.get('cnt'))));

    // Relationship types
    console.log('\n--- RELATIONSHIP TYPES ---');
    const rt = await s.run('MATCH ()-[r]->() RETURN type(r) AS relType, count(r) AS cnt ORDER BY cnt DESC');
    rt.records.forEach(r => console.log('  ', r.get('relType'), ':', toNum(r.get('cnt'))));

    console.log('\n🎉 Schema verification complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await s.close();
    await driver.close();
  }
})();
