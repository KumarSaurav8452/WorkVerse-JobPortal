import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const TRENDING_SKILLS = ['Neo4j', 'React', 'Python', 'Node.js', 'TypeScript', 'Docker', 'Machine Learning', 'GraphQL'];

const STATS = [
  { value: '50+', label: 'Active Candidates' },
  { value: '20+', label: 'Live Jobs' },
  { value: '10', label: 'Companies' },
  { value: '30+', label: 'Skills Mapped' },
];

export default function LandingPage() {
  const [jobs, setJobs] = useState([]);
  const [trending, setTrending] = useState(TRENDING_SKILLS);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/jobs?limit=6').then(r => setJobs(r.data.jobs || [])).catch(() => {});
    api.get('/skills/trending').then(r => { if (r.data?.length) setTrending(r.data.map(s => s.skill)); }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/jobs?q=${encodeURIComponent(search)}`);
  };

  return (
    <div style={{ paddingTop: 80 }}>
      {/* Hero */}
      <section style={{
        minHeight: '92vh', display: 'flex', alignItems: 'center',
        background: `radial-gradient(circle at 0% 0%, rgba(74, 191, 158, 0.1) 0%, transparent 40%),
                     radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.1) 0%, transparent 40%),
                     var(--bg-primary)`,
        position: 'relative', overflow: 'hidden', padding: '120px 0 80px',
      }}>
        {/* Decorative graph nodes */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: Math.random() * 200 + 100 + 'px',
            height: Math.random() * 200 + 100 + 'px',
            borderRadius: '50%',
            border: `1px solid rgba(108,99,255,${0.05 + i * 0.02})`,
            top: Math.random() * 80 + '%',
            left: Math.random() * 80 + '%',
            animation: `float ${4 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }} />
        ))}

        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div className="fade-in">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'rgba(74, 191, 158, 0.08)', 
              border: '1px solid rgba(74, 191, 158, 0.2)',
              borderRadius: 30, padding: '8px 20px', marginBottom: 32,
              fontSize: 13, color: 'var(--accent)', fontWeight: 600,
              backdropFilter: 'blur(10px)',
            }}>
              <span style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent)' }} />
              Neo4j Graph-Powered Career Intelligence
            </div>

            <h1 style={{ fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: 1.1, marginBottom: 20 }}>
              Hiring Through
              <br />
              <span className="gradient-text">Relationships, Not Keywords</span>
            </h1>

            <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
              GraphHire maps the connections between you, your skills, and opportunities
              using graph intelligence — not simple filters.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ 
              display: 'flex', maxWidth: 640, margin: '0 auto 40px', gap: 12,
              background: 'var(--glass-bg)', padding: 8, borderRadius: 20,
              border: '1px solid var(--border)', backdropFilter: 'var(--glass)',
              boxShadow: 'var(--shadow-lg)',
            }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by role, skill, or company..."
                style={{
                  flex: 1, padding: '12px 20px', background: 'transparent',
                  border: 'none', color: 'var(--text-primary)', fontSize: 16,
                  outline: 'none',
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>
                Find Match
              </button>
            </form>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 60 }}>
              <Link to="/register" className="btn btn-primary btn-lg">Find Jobs →</Link>
              <Link to="/register?role=employer" className="btn btn-secondary btn-lg">Post a Job</Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
              {STATS.map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Space Grotesk' }} className="gradient-text">{s.value}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trending Skills */}
      <section style={{ padding: '60px 0', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontSize: 18, marginBottom: 24, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Trending in the Graph
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {trending.map((skill, i) => (
              <Link key={i} to={`/jobs?skill=${encodeURIComponent(skill)}`} style={{ textDecoration: 'none' }}>
                <div className="tag" style={{ padding: '10px 20px', fontSize: 14, borderRadius: 30, background: 'var(--bg-elevated)' }}>
                  {skill}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <div className="flex-between" style={{ marginBottom: 40 }}>
            <div>
              <h2 className="section-title">Newest Opportunities</h2>
              <p className="section-subtitle">Curated matches from your identity graph</p>
            </div>
            <Link to="/jobs" className="btn btn-secondary">Explore All</Link>
          </div>

          <div className="grid-3">
            {jobs.length > 0 ? jobs.slice(0, 6).map(job => (
              <Link key={job.jobId} to={`/jobs/${job.jobId}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="flex-between" style={{ marginBottom: 20 }}>
                    <div style={{
                      width: 48, height: 48,
                      background: 'var(--bg-elevated)',
                      borderRadius: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, border: '1px solid var(--border)',
                    }}>💼</div>
                    {job.remote && <span className="badge badge-green" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Remote</span>}
                  </div>
                  <h3 style={{ fontSize: 18, marginBottom: 8, fontWeight: 700 }}>{job.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                    {job.company?.name} · {job.location}
                  </p>
                  
                  <div style={{ marginTop: 'auto' }}>
                    {job.salaryMin > 0 && (
                      <p style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700, marginBottom: 16 }}>
                        ${(job.salaryMin / 1000).toFixed(0)}k – ${(job.salaryMax / 1000).toFixed(0)}k
                      </p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(job.skills || []).slice(0, 3).map((s, i) => (
                        <span key={i} className="tag" style={{ fontSize: 12 }}>{s.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            )) : [...Array(3)].map((_, i) => (
              <div key={i} className="card" style={{ height: 260, opacity: 0.5 }}>
                <div style={{ height: '100%', background: 'var(--bg-elevated)', borderRadius: 12, animation: 'pulse 2s infinite' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Graph Feature Section */}
      <section style={{ padding: '80px 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="section-title">Why Graph Intelligence?</h2>
            <p className="section-subtitle">Neo4j AuraDB powers every match, recommendation, and connection</p>
          </div>
          <div className="grid-3">
            {[
              { icon: '🔗', title: 'Skill Adjacency', desc: 'React developer? You\'re likely proficient in JavaScript too. Our graph knows it.' },
              { icon: '🛤️', title: 'Referral Paths', desc: 'Find who you know at any company. Up to 3 degrees of connection traversal.' },
              { icon: '📊', title: 'Skill Gap Analysis', desc: 'See exactly which skills you\'re missing for any job — and what you already have nearby.' },
              { icon: '🧠', title: 'Smart Matching', desc: 'Cypher-powered scoring weighs proficiency, years of experience, and adjacent skills.' },
              { icon: '🌐', title: 'Career DNA', desc: 'Your career trajectory is a graph. We pattern-match it against success stories.' },
              { icon: '📈', title: 'Trending Skills', desc: 'Real-time aggregation on REQUIRES_SKILL edges to surface market demand.' },
            ].map(f => (
              <div key={f.title} className="card">
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 0', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          © 2026 GraphHire — Built on Neo4j AuraDB (instance dd7f574a) · Graph-Native Hiring Platform
        </p>
      </footer>
    </div>
  );
}
