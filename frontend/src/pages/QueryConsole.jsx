import { useEffect, useMemo, useState } from 'react';
import api from '../api';

const FAVORITES_KEY = 'wv_query_favorites';

const SUGGESTED_QUERIES = [
  {
    id: 'graph-overview',
    category: 'Graph',
    title: 'Full Graph Overview',
    description: 'A broad graph exploration query that helps visualize how nodes and relationships are connected.',
    note: 'Useful for visual graph exploration. The added LIMIT keeps it safer as your data grows.',
    query: `MATCH (n)-[r]-(m)
RETURN n, r, m
LIMIT 150`,
  },
  {
    id: 'entity-inventory',
    category: 'Graph',
    title: 'Jobs, Employers, and Companies',
    description: 'A quick way to inspect the main hiring-side entities in the graph.',
    note: 'Helpful when you want to confirm the main hiring nodes exist and are labeled correctly.',
    query: `MATCH (n)
WHERE n:Job OR n:Employer OR n:Company
RETURN n`,
  },
  {
    id: 'recent-jobs',
    category: 'Hiring',
    title: 'Recent Jobs',
    description: 'A recruiter-friendly query for reviewing the newest active roles in the system.',
    note: 'This is a practical recruiter-facing version of the same query.',
    query: `MATCH (j:Job)
WHERE j.status = 'active'
RETURN j.title AS title, j.postedAt AS postedAt, j.location AS location
ORDER BY j.postedAt DESC
LIMIT 20`,
  },
  {
    id: 'candidate-skill-matrix',
    category: 'Candidates',
    title: 'Candidate Skill Matrix',
    description: 'A structured view of candidate-to-skill relationships using the current schema.',
    note: 'This repo uses hs.proficiency on HAS_SKILL, not r.level, so this version is more accurate.',
    query: `MATCH (c:Candidate)-[hs:HAS_SKILL]->(s:Skill)
RETURN c.name AS candidate, s.name AS skill, hs.proficiency AS proficiency
ORDER BY candidate, proficiency DESC
LIMIT 25`,
  },
  {
    id: 'top-skills-demand',
    category: 'Hiring',
    title: 'Top Skills In Demand',
    description: 'Find the most frequently requested skills across active jobs.',
    query: `MATCH (j:Job { status: 'active' })-[:REQUIRES_SKILL]->(s:Skill)
RETURN s.name AS skill, count(*) AS demand
ORDER BY demand DESC
LIMIT 15`,
  },
  {
    id: 'ready-candidates',
    category: 'Candidates',
    title: 'Candidates Ready To Hire',
    description: 'List candidates who are actively looking, ordered by profile score.',
    query: `MATCH (c:Candidate)
WHERE c.isLooking = true
RETURN c.name AS candidate, c.title AS title, c.location AS location, c.profileScore AS score
ORDER BY score DESC
LIMIT 15`,
  },
  {
    id: 'applications-stage',
    category: 'Analytics',
    title: 'Applications By Stage',
    description: 'Understand how applications are distributed through the pipeline.',
    query: `MATCH (:Candidate)-[:APPLIED_TO]->(a:Application)
RETURN a.status AS stage, count(*) AS total
ORDER BY total DESC`,
  },
  {
    id: 'application-timeline',
    category: 'Analytics',
    title: 'Application Timeline',
    description: 'Review the newest applications flowing into the system.',
    query: `MATCH (c:Candidate)-[:APPLIED_TO]->(a:Application)-[:FOR_JOB]->(j:Job)-[:POSTED_BY]->(co:Company)
RETURN c.name AS candidate, j.title AS job, co.name AS company, a.status AS stage, a.appliedAt AS appliedAt
ORDER BY a.appliedAt DESC
LIMIT 20`,
  },
  {
    id: 'remote-snapshot',
    category: 'Hiring',
    title: 'Remote Hiring Snapshot',
    description: 'Compare remote roles against total active openings.',
    query: `MATCH (j:Job)
WHERE j.status = 'active'
RETURN
  count(j) AS totalJobs,
  count(CASE WHEN j.remote = true THEN 1 END) AS remoteJobs,
  count(CASE WHEN j.remote <> true THEN 1 END) AS onSiteOrHybridJobs`,
  },
  {
    id: 'companies-open-jobs',
    category: 'Hiring',
    title: 'Companies With Most Open Jobs',
    description: 'Spot the employers hiring most aggressively right now.',
    query: `MATCH (j:Job { status: 'active' })-[:POSTED_BY]->(co:Company)
RETURN co.name AS company, count(j) AS openRoles
ORDER BY openRoles DESC
LIMIT 10`,
  },
  {
    id: 'jobs-without-applicants',
    category: 'Analytics',
    title: 'Jobs Without Applicants',
    description: 'Identify active jobs that may need more visibility.',
    query: `MATCH (j:Job)-[:POSTED_BY]->(co:Company)
WHERE j.status = 'active'
OPTIONAL MATCH (j)<-[:FOR_JOB]-(:Application)
WITH j, co, count(*) AS applications
WHERE applications = 0
RETURN j.title AS job, co.name AS company, j.location AS location
ORDER BY j.postedAt DESC
LIMIT 15`,
  },
  {
    id: 'most-connected-candidates',
    category: 'Candidates',
    title: 'Most Connected Candidates',
    description: 'Candidates with the richest skill graph connections.',
    query: `MATCH (c:Candidate)-[:HAS_SKILL]->(s:Skill)
RETURN c.name AS candidate, count(s) AS skillConnections, c.profileScore AS score
ORDER BY skillConnections DESC, score DESC
LIMIT 15`,
  },
];

const CATEGORIES = ['All', 'Graph', 'Hiring', 'Candidates', 'Analytics', 'Favorites'];

export default function QueryConsole() {
  const [query, setQuery] = useState(SUGGESTED_QUERIES[0].query);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      if (Array.isArray(saved)) setFavorites(saved);
    } catch {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const visibleQueries = useMemo(() => {
    if (activeCategory === 'Favorites') {
      return SUGGESTED_QUERIES.filter((item) => favorites.includes(item.id));
    }

    if (activeCategory === 'All') return SUGGESTED_QUERIES;

    return SUGGESTED_QUERIES.filter((item) => item.category === activeCategory);
  }, [activeCategory, favorites]);

  const runQuery = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/admin/query?q=${encodeURIComponent(query)}`);
      setResults(response.data);
    } catch (err) {
      console.error('Query Console Detailed Error:', err);
      setError(err.response?.data?.error || err.message || 'Unknown network or runtime error');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id) => {
    setFavorites((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  };

  const copyQuery = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>
          Cypher <span className="gradient-text">Console</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Execute read-only patterns against your live graph, start from curated suggestions, and save your most useful queries.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={`btn btn-sm ${activeCategory === category ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px minmax(0, 1fr) 1.2fr', gap: 20, alignItems: 'start' }}>
        <div className="card" style={{ maxHeight: 720, overflowY: 'auto' }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Suggested Queries</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Analyzed against your schema and grouped by use case.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleQueries.length > 0 ? visibleQueries.map((item) => (
              <div
                key={item.id}
                className="metric-card"
                style={{ border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex-between" style={{ alignItems: 'start', gap: 10, marginBottom: 6 }}>
                  <div>
                    <strong style={{ display: 'block', marginBottom: 2 }}>{item.title}</strong>
                    <span className="badge badge-blue">{item.category}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => toggleFavorite(item.id)}
                  >
                    {favorites.includes(item.id) ? 'Saved' : 'Save'}
                  </button>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>{item.description}</p>
                {item.note && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>{item.note}</p>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setQuery(item.query)}>
                    Load
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => copyQuery(item.query, item.id)}>
                    {copiedId === item.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No queries in this category yet.</div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="flex-between" style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>Query Editor</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => copyQuery(query, 'editor')}>
              {copiedId === 'editor' ? 'Copied' : 'Copy Query'}
            </button>
          </div>

          <form onSubmit={runQuery}>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mono"
              style={{
                width: '100%',
                minHeight: 560,
                padding: 20,
                background: 'var(--code-bg)',
                color: 'var(--code-text)',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            />
            <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Executing...' : 'Run Query'}
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ minHeight: 280, display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16 }}>Query Results</h3>
            {results && <span className="badge badge-purple">{results.data.length} records</span>}
          </div>

          {error && (
            <div style={{ padding: 16, background: 'rgba(255, 75, 102, 0.1)', border: '1px solid var(--danger)', borderRadius: 8, color: 'var(--danger)', fontSize: 14 }}>
              {error}
            </div>
          )}

          {!results && !loading && !error && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 40, marginBottom: 12 }}>Q</div>
                <p>Pick a suggested query or write your own read-only Cypher</p>
              </div>
            </div>
          )}

          {loading && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          )}

          {results && results.data.length > 0 && (
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                    {results.keys.map((key) => (
                      <th
                        key={key}
                        style={{ padding: '12px 8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.data.map((row, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                      {results.keys.map((key) => (
                        <td key={key} style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                          {typeof row[key] === 'object' ? (
                            <pre className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                              {JSON.stringify(row[key], null, 2)}
                            </pre>
                          ) : String(row[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--warning)' }}>!</span>
        Query Console is currently set to READ-ONLY mode. Modification queries are restricted for safety.
      </div>
    </div>
  );
}
