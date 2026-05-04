import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const TRENDING_SKILLS = ['Neo4j', 'React', 'Python', 'Node.js', 'TypeScript', 'Docker', 'Machine Learning', 'GraphQL'];

const STATS = [
  { value: '50+', label: 'Active candidates' },
  { value: '20+', label: 'Open jobs' },
  { value: '10+', label: 'Hiring teams' },
  { value: '30+', label: 'Skills mapped' },
];

const FEATURES = [
  {
    title: 'Relationship-aware matching',
    desc: 'Move beyond keyword search and discover candidates, roles, and paths that are adjacent to what you already know.',
  },
  {
    title: 'Skill graph intelligence',
    desc: 'See mandatory skills, nearby capabilities, and the exact gap between current experience and target roles.',
  },
  {
    title: 'Momentum for employers and job seekers',
    desc: 'Track openings, spotlight your brand, and turn every job post into a richer, more discoverable talent node.',
  },
];

export default function LandingPage() {
  const [jobs, setJobs] = useState([]);
  const [trending, setTrending] = useState(TRENDING_SKILLS);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/jobs?limit=6').then((r) => setJobs(r.data.jobs || [])).catch(() => { });
    api.get('/skills/trending').then((r) => {
      if (r.data?.length) setTrending(r.data.map((s) => s.skill));
    }).catch(() => { });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/jobs?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="page-shell" style={{ paddingTop: 96 }}>
      <section style={{ position: 'relative', padding: '34px 0 64px' }}>
        <div className="container">
          <div className="hero-panel" style={{ padding: '68px clamp(22px, 4vw, 54px)' }}>
            <div
              className="floating-orb"
              style={{ width: 180, height: 180, background: 'rgba(73, 199, 255, 0.28)', top: 40, right: 80 }}
            />
            <div
              className="floating-orb"
              style={{ width: 120, height: 120, background: 'rgba(122, 242, 198, 0.24)', bottom: 70, left: 50, animationDelay: '1s' }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.15fr) minmax(280px, 0.85fr)',
                gap: 28,
                alignItems: 'center',
              }}
            >
              <div className="section-stack" style={{ position: 'relative', zIndex: 1 }}>
                <div className="eyebrow">Dynamic graph-powered hiring</div>
                <div>
                  <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5.4rem)', lineHeight: 0.98, marginBottom: 18 }}>
                    Build a career universe,
                    <br />
                    <span className="gradient-text">not just a resume.</span>
                  </h1>
                  <p style={{ maxWidth: 630, fontSize: 18, color: 'var(--text-secondary)' }}>
                    WorkVerse turns jobs, people, skills, and referrals into one connected graph so every search feels more human,
                    more precise, and far more actionable.
                  </p>
                </div>

                <form onSubmit={handleSearch} className="search-shell" style={{ maxWidth: 700 }}>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search roles, skills, or companies"
                  />
                  <button type="submit" className="btn btn-primary">Explore Matches</button>
                </form>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Link to="/register" className="btn btn-primary btn-lg">Create Your Graph</Link>
                  <Link to="/register?role=employer" className="btn btn-secondary btn-lg">Launch Hiring Workspace</Link>
                </div>

                <div className="metric-grid">
                  {STATS.map((stat) => (
                    <div key={stat.label} className="metric-card">
                      <span className="metric-value gradient-text">{stat.value}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: 22, minHeight: 420 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                      Live graph pulse
                    </div>
                    <h3 style={{ fontSize: 24 }}>Career signal dashboard</h3>
                  </div>
                  <span className="badge badge-green">Live</span>
                </div>

                <div className="section-stack">
                  {FEATURES.map((feature, index) => (
                    <div
                      key={feature.title}
                      style={{
                        padding: 18,
                        borderRadius: 22,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                        <strong style={{ fontSize: 16 }}>{feature.title}</strong>
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>0{index + 1}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{feature.desc}</p>
                    </div>
                  ))}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="metric-card">
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>Referral depth</div>
                      <div style={{ fontSize: 28, fontFamily: 'Space Grotesk', fontWeight: 700 }}>3 hops</div>
                    </div>
                    <div className="metric-card">
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>Skill adjacency</div>
                      <div style={{ fontSize: 28, fontFamily: 'Space Grotesk', fontWeight: 700 }}>92%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-strip" style={{ padding: '28px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {trending.map((skill) => (
              <Link key={skill} to={`/jobs?skill=${encodeURIComponent(skill)}`} style={{ textDecoration: 'none' }}>
                <div className="tag" style={{ padding: '10px 18px', borderRadius: 999 }}>{skill}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '84px 0 48px' }}>
        <div className="container">
          <div className="flex-between" style={{ marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h2 className="section-title">Newest opportunities</h2>
              <p className="section-subtitle">Fresh roles surfacing from your hiring graph in real time.</p>
            </div>
            <Link to="/jobs" className="btn btn-secondary">Browse all jobs</Link>
          </div>

          <div className="grid-3">
            {jobs.length > 0 ? jobs.slice(0, 6).map((job) => (
              <Link key={job.jobId} to={`/jobs/${job.jobId}`} style={{ textDecoration: 'none' }}>
                <div className="card card-hover list-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="flex-between" style={{ gap: 12 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 18,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 20,
                      }}
                    >
                      {job.company?.name?.charAt(0) || 'W'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {job.remote && <span className="badge badge-green">Remote</span>}
                      <span className="badge badge-blue">{job.employmentType || 'Full-time'}</span>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: 20, marginBottom: 6 }}>{job.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                      {job.company?.name} · {job.location || 'Flexible'}
                    </p>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    {job.description?.slice(0, 120)}{job.description?.length > 120 ? '...' : ''}
                  </p>

                  <div style={{ marginTop: 'auto' }}>
                    {job.salaryMin > 0 && (
                      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Space Grotesk', marginBottom: 12 }}>
                        ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(job.skills || []).slice(0, 3).map((skill, index) => (
                        <span key={index} className="tag">{skill.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            )) : [...Array(3)].map((_, index) => (
              <div key={index} className="card" style={{ height: 280, opacity: 0.55 }} />
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0 96px' }}>
        <div className="container">
          <div className="card" style={{ padding: '34px clamp(22px, 4vw, 40px)' }}>
            <div className="flex-between" style={{ alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 14 }}>Why it feels different</div>
                <h2 className="section-title">Designed for momentum, not menu clicking</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 520 }}>
                Every surface is built to make discovery faster: clearer hierarchy, richer data density, and polished interactions that
                feel more like a product and less like a prototype.
              </p>
            </div>

            <div className="grid-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="metric-card" style={{ height: '100%' }}>
                  <h3 style={{ fontSize: 18, marginBottom: 10 }}>{feature.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
