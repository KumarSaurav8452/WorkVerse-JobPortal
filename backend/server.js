const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { verifyConnectivity, getSession } = require('./config/neo4j');

// Route imports
const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');
const jobRoutes = require('./routes/jobs');
const skillRoutes = require('./routes/skills');
const companyRoutes = require('./routes/companies');
const applicationRoutes = require('./routes/applications');
const matchingRoutes = require('./routes/matching');
const adminRoutes = require('./routes/neo-admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const configuredOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  'http://localhost',
  'http://localhost:80',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...configuredOrigins,
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const { auth } = require('./middleware/auth');

// PROBE ROUTE
app.get('/api/admin-test', (req, res) => res.json({ status: 'server-js-is-live', timestamp: new Date().toISOString() }));

// --- NEO-TECH ADMIN SUITE ---
const serializeNeo4jValue = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val.toNumber === 'function') return val.toNumber();
  if (Array.isArray(val)) return val.map(serializeNeo4jValue);
  if (typeof val === 'object') {
    if (val.properties) return { ...serializeNeo4jValue(val.properties), _labels: val.labels, _type: val.type };
    const obj = {};
    for (const [k, v] of Object.entries(val)) { obj[k] = serializeNeo4jValue(v); }
    return obj;
  }
  return val;
};

app.get('/api/admin/stats', auth, async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`
      CALL { MATCH (c:Candidate) RETURN count(c) as candidates }
      CALL { MATCH (j:Job) RETURN count(j) as jobs }
      CALL { MATCH (s:Skill) RETURN count(s) as skills }
      CALL { MATCH ()-[r]->() RETURN count(r) as relationships }
      RETURN candidates, jobs, skills, relationships
    `);
    const stats = result.records[0];
    const toNum = (val) => (val && typeof val.toNumber === 'function') ? val.toNumber() : (val || 0);

    res.json({
      candidates: toNum(stats.get('candidates')),
      jobs: toNum(stats.get('jobs')),
      skills: toNum(stats.get('skills')),
      relationships: toNum(stats.get('relationships')),
      dbStatus: 'online'
    });
  } catch (err) { 
    console.error("❌ ADMIN STATS ERROR:", err.message);
    res.status(500).json({ error: err.message }); 
  }
  finally { await session.close(); }
});

app.get('/api/admin/schema', auth, async (req, res) => {
  const session = getSession();
  try {
    const labelsRes = await session.run('CALL db.labels()');
    const relsRes = await session.run('CALL db.relationshipTypes()');
    res.json({ labels: labelsRes.records.map(r => r.get(0)), relationshipTypes: relsRes.records.map(r => r.get(0)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});

app.get('/api/admin/query', auth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'No query provided' });
  const forbidden = ['CREATE', 'DELETE', 'MERGE', 'SET', 'REMOVE', 'DROP', 'CALL'];
  if (forbidden.some(word => q.toUpperCase().includes(word))) return res.status(403).json({ error: 'Read-only allowed' });

  const session = getSession();
  try {
    const result = await session.run(q);
    const records = result.records.map(r => {
      const obj = {};
      r.keys.forEach(k => { obj[k] = serializeNeo4jValue(r.get(k)); });
      return obj;
    });
    res.json({ keys: result.records[0]?.keys || [], data: records });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { await session.close(); }
});
// --- END ADMIN SUITE ---

// Regular Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/matching', matchingRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'neo4j-aura-dd7f574a', timestamp: new Date().toISOString() }));

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ API ERROR:", err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start
const start = async () => {
  await verifyConnectivity();
  app.listen(PORT, () => {
    console.log(`🚀 WorkVerse API running on http://localhost:${PORT}`);
  });
};

start();
