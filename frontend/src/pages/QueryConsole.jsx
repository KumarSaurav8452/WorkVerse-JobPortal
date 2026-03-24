import { useState } from 'react';
import api from '../api';

export default function QueryConsole() {
  const [query, setQuery] = useState('MATCH (n) RETURN n LIMIT 10');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runQuery = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await api.get(`/admin/query?q=${encodeURIComponent(query)}`);
      setResults(r.data);
    } catch (err) {
      console.error('Query Console Detailed Error:', err);
      setError(err.response?.data?.error || err.message || 'Unknown network or runtime error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Cypher <span className="gradient-text">Console</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Execute read-only patterns against your live graph (AuraDB instance dd7f574a)</p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
        {/* Editor */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>
            Query Editor
          </div>
          <form onSubmit={runQuery}>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="mono"
              style={{
                width: '100%', minHeight: 180, padding: 20,
                background: 'var(--code-bg)', color: 'var(--code-text)',
                border: 'none', outline: 'none', resize: 'vertical',
                fontSize: 14, lineHeight: 1.6
              }}
            />
            <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Executing...' : 'Run Query ⚡'}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="card" style={{ minHeight: 280, display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16 }}>Query Results</h3>
            {results && <span className="badge badge-purple">{results.data.length} records</span>}
          </div>

          {error && (
            <div style={{ padding: 16, background: 'rgba(255, 75, 102, 0.1)', border: '1px solid var(--danger)', borderRadius: 8, color: 'var(--danger)', fontSize: 14 }}>
              ⚠️ {error}
            </div>
          )}

          {!results && !loading && !error && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p>Run a query to view live graph data</p>
              </div>
            </div>
          )}

          {loading && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}

          {results && results.data.length > 0 && (
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                    {results.keys.map(k => (
                      <th key={k} style={{ padding: '12px 8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.data.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }} className="hover-row">
                      {results.keys.map(k => (
                        <td key={k} style={{ padding: '12px 8px' }}>
                          {typeof row[k] === 'object' ? (
                            <pre className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{JSON.stringify(row[k], null, 2)}</pre>
                          ) : String(row[k])}
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

      {/* Safety Note */}
      <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--warning)' }}>⚠️</span>
        Query Console is currently set to READ-ONLY mode. Modification queries (CREATE, DELETE, etc.) are restricted for safety.
      </div>
    </div>
  );
}
