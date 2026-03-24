import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hits the direct registration in server.js
    api.get('/admin/stats')
      .then(r => {
        console.log('Admin Stats Received:', r.data);
        setStats(r.data);
      })
      .catch(e => console.error('Admin metrics failed:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container" style={{ paddingTop: 120 }}><div className="spinner" /></div>;

  const cards = [
    { label: 'Total Candidates', value: stats?.candidates, icon: '👤', color: 'var(--accent)', route: '/admin/explorer?label=Candidate' },
    { label: 'Live Jobs', value: stats?.jobs, icon: '💼', color: 'var(--accent2)', route: '/jobs' },
    { label: 'Total Skills', value: stats?.skills, icon: '🧠', color: 'var(--success)', route: '/admin/explorer?label=Skill' },
    { label: 'Relationships', value: stats?.relationships, icon: '⛓️', color: 'var(--warning)', route: '/admin/explorer' },
  ];

  return (
    <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>NeoTech <span className="gradient-text">Command Center</span></h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`status-dot ${stats?.dbStatus === 'online' ? 'status-active' : 'status-inactive'}`} />
            <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Database: {stats?.dbStatus || 'OFFLINE'} — AuraDB dd7f574a
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>🔄 Refresh Hub</button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 40 }}>
        {cards.map(c => (
          <Link 
            key={c.label} 
            to={c.route} 
            className="card card-hover" 
            style={{ textAlign: 'center', padding: '32px 24px', textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
          >
            <div style={{ fontSize: 36, marginBottom: 16 }}>{c.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Space Grotesk', color: c.color }}>
              {loading ? '...' : (Number(c.value) || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
              {c.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Tools */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>📡 Node Explorer</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Browse your graph data, inspect properties, and traverse relationships in real-time.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/admin/explorer" className="btn btn-primary btn-sm">Launch Explorer →</Link>
            <button className="btn btn-ghost btn-sm">Scan Labels</button>
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>⌨️ Cypher Console</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Execute read-only queries against your live production database with syntax safety.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/admin/console" className="btn btn-primary btn-sm">Enter Console →</Link>
            <button className="btn btn-ghost btn-sm">Recent Queries</button>
          </div>
        </div>
      </div>

      {/* Connection Info (Simplified) */}
      <div className="card" style={{ marginTop: 40 }}>
        <h3 style={{ marginBottom: 20 }}>⚙️ Infrastructure Environment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <div>
            <div className="form-label">Aura Instance</div>
            <div className="mono" style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 13, border: '1px solid var(--border)' }}>neo-auradb-dd7f574a</div>
          </div>
          <div>
            <div className="form-label">Global Access</div>
            <div className="mono" style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 13, border: '1px solid var(--border)' }}>Read/Write (REST)</div>
          </div>
          <div>
            <div className="form-label">Encryption</div>
            <div className="mono" style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 13, border: '1px solid var(--border)' }}>TSL 1.3 Secure</div>
          </div>
        </div>
      </div>
    </div>
  );
}
