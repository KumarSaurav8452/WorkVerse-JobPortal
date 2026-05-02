import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((response) => {
        setStats(response.data);
      })
      .catch((error) => console.error('Admin metrics failed:', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 120 }}>
        <div className="spinner" />
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Candidates',
      value: stats?.candidates,
      tag: 'Candidates',
      color: 'var(--accent)',
      route: '/admin/explorer?label=Candidate&view=nodes',
      hint: 'Open candidate records and inspect profiles.',
    },
    {
      label: 'Live Jobs',
      value: stats?.jobs,
      tag: 'Jobs',
      color: 'var(--accent2)',
      route: '/admin/explorer?label=Job&view=nodes',
      hint: 'Review currently active job nodes.',
    },
    {
      label: 'Total Skills',
      value: stats?.skills,
      tag: 'Skills',
      color: 'var(--success)',
      route: '/admin/explorer?label=Skill&view=nodes',
      hint: 'Browse the skill graph and taxonomy.',
    },
    {
      label: 'Relationships',
      value: stats?.relationships,
      tag: 'Links',
      color: 'var(--warning)',
      route: '/admin/explorer?view=relationships',
      hint: 'See how the graph is connected overall.',
    },
  ];

  return (
    <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
      <div className="flex-between" style={{ marginBottom: 40, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>
            NeoTech <span className="gradient-text">Command Center</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`status-dot ${stats?.dbStatus === 'online' ? 'status-active' : 'status-inactive'}`} />
            <span
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Database: {stats?.dbStatus || 'OFFLINE'} - AuraDB dd7f574a
            </span>
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>
          Refresh Hub
        </button>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 40 }}>
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.route}
            className="card card-hover"
            style={{ textDecoration: 'none', padding: '28px 24px', display: 'block' }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 16,
              }}
            >
              {card.tag}
            </div>

            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'Space Grotesk', color: card.color }}>
              {(Number(card.value) || 0).toLocaleString()}
            </div>

            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, fontWeight: 700 }}>
              {card.label}
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
              {card.hint}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Node Explorer</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Browse graph entities, inspect node properties, and jump into relationship context from one place.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/admin/explorer" className="btn btn-primary btn-sm">Launch Explorer</Link>
            <Link to="/admin/explorer?view=relationships" className="btn btn-ghost btn-sm">Open Relationship View</Link>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Cypher Console</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Execute safe read-only Cypher queries, use curated suggestions, and inspect live graph results.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/admin/console" className="btn btn-primary btn-sm">Enter Console</Link>
            <Link to="/admin/console" className="btn btn-ghost btn-sm">View Suggestions</Link>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 40 }}>
        <h3 style={{ marginBottom: 20 }}>Infrastructure Environment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <div>
            <div className="form-label">Aura Instance</div>
            <div className="mono" style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 13, border: '1px solid var(--border)' }}>
              neo-auradb-dd7f574a
            </div>
          </div>

          <div>
            <div className="form-label">Global Access</div>
            <div className="mono" style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 13, border: '1px solid var(--border)' }}>
              Read and Write via REST
            </div>
          </div>

          <div>
            <div className="form-label">Encryption</div>
            <div className="mono" style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 13, border: '1px solid var(--border)' }}>
              TLS 1.3 Secure
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
