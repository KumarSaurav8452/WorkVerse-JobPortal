import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const STATUS_COLORS = {
  applied: 'badge-blue', screening: 'badge-orange',
  interview: 'badge-purple', offer: 'badge-green', hired: 'badge-green', rejected: 'badge-red',
};

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [skills, setSkills] = useState([]);
  const [matches, setMatches] = useState([]);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('gh_user') || 'null');

  useEffect(() => {
    Promise.all([
      api.get(`/jobs/${id}`),
      api.get(`/matching/jobs/${id}/candidates?limit=5`).catch(() => ({ data: [] })),
    ]).then(([jobRes, matchRes]) => {
      console.log("📍 [DEBUG] JOB DETAIL API RESPONSE:", jobRes.data);
      setJob(jobRes.data.job);
      const isApplied = !!jobRes.data.job.applied;
      console.log("📍 [DEBUG] SETTING APPLIED STATE:", isApplied);
      setApplied(isApplied);
      setCompany(jobRes.data.company);
      setSkills(jobRes.data.skills || []);
      setMatches(matchRes.data);
    }).catch(() => navigate('/jobs'))
      .finally(() => setLoading(false));
  }, [id]);

  const applyToJob = async () => {
    if (!user) return navigate('/login');
    setApplying(true);
    try {
      await api.post(`/applications/jobs/${id}/apply`, { coverLetter });
      setApplied(true);
    } catch (err) {
      if (err.response?.status === 409) setApplied(true);
      else alert(err.response?.data?.error || 'Failed to apply');
    } finally { setApplying(false); }
  };

  if (loading) return <div style={{ paddingTop: 120 }}><div className="spinner" /></div>;
  if (!job) return null;

  const mandatorySkills = skills.filter(s => s.mandatory !== false);
  const optionalSkills = skills.filter(s => s.mandatory === false);

  return (
    <div style={{ paddingTop: 90, paddingBottom: 80, minHeight: '100vh' }}>
      <div className="container">
        {/* Back */}
        <button onClick={() => navigate('/jobs')} className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
          ← Back to Jobs
        </button>

        <div className="grid-2" style={{ gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Job Header */}
            <div className="card">
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: `linear-gradient(135deg, hsl(${id?.charCodeAt(0) * 7 % 360}, 70%, 40%), hsl(${id?.charCodeAt(1) * 11 % 360}, 60%, 30%))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 30, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {company?.name?.charAt(0)}
                </div>
                <div>
                  <h1 style={{ fontSize: 24, marginBottom: 4 }}>{job.title}</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                    🏢 {company?.name} · {company?.industry}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                {job.remote && <span className="badge badge-green">🌐 Remote</span>}
                {job.location && <span className="badge badge-blue">📍 {job.location}</span>}
                {job.employmentType && <span className="badge badge-purple">⏰ {job.employmentType}</span>}
                {job.experienceYears > 0 && <span className="badge badge-orange">📅 {job.experienceYears}+ yrs exp</span>}
              </div>

              {job.salaryMin > 0 && (
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>SALARY RANGE</span>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent2)' }}>
                    ${(job.salaryMin / 1000).toFixed(0)}k – ${(job.salaryMax / 1000).toFixed(0)}k / year
                  </div>
                </div>
              )}

              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 15 }}>{job.description}</p>
            </div>

            {/* Required Skills */}
            <div className="card">
              <h2 style={{ fontSize: 18, marginBottom: 16 }}>🧠 Required Skills</h2>
              {mandatorySkills.length > 0 && (
                <>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Must Have</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {mandatorySkills.map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '8px 12px',
                      }}>
                        <span style={{ fontSize: 14 }}>{s.name}</span>
                        <div className="progress-bar" style={{ width: 50 }}>
                          <div className="progress-fill" style={{ width: `${(s.minProficiency || 5) * 10}%` }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.minProficiency || 5}/10</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {optionalSkills.length > 0 && (
                <>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Nice to Have</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {optionalSkills.map((s, i) => <span key={i} className="tag">{s.name}</span>)}
                  </div>
                </>
              )}
            </div>

            {/* Top Matches (employer view or public) */}
            {matches.length > 0 && (
              <div className="card">
                <h2 style={{ fontSize: 18, marginBottom: 16 }}>📊 Graph Match Results</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Cypher-powered match scores from Neo4j traversal
                </p>
                {matches.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0',
                    borderBottom: i < matches.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--gradient)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>{m.candidate?.name?.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.candidate?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {m.candidate?.title} · {m.matchedSkills}/{m.totalRequired} skills matched
                      </div>
                    </div>
                    <div style={{
                      background: m.matchScore >= 80 ? 'rgba(0,212,170,0.15)' : 'rgba(108,99,255,0.15)',
                      color: m.matchScore >= 80 ? 'var(--accent2)' : 'var(--accent)',
                      borderRadius: 8, padding: '4px 10px', fontWeight: 700, fontSize: 14,
                    }}>{m.matchScore}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar — Apply */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div className="card">
              <h3 style={{ fontSize: 18, marginBottom: 16 }}>Apply Now</h3>
              {applied ? (
                <div style={{
                  background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)',
                  borderRadius: 10, padding: 16, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <p style={{ color: 'var(--accent2)', fontWeight: 600 }}>Application Submitted!</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Stored as Application node in Neo4j AuraDB
                  </p>
                </div>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Cover Letter (Optional)</label>
                    <textarea
                      value={coverLetter}
                      onChange={e => setCoverLetter(e.target.value)}
                      placeholder="Tell us why you're a great fit..."
                      className="form-input"
                      rows={5}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={applyToJob}
                    disabled={applying}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {applying ? '⏳ Submitting...' : '🚀 Apply Now'}
                  </button>
                  {!user && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
                      <a href="/login" style={{ color: 'var(--accent)' }}>Sign in</a> to apply
                    </p>
                  )}
                </>
              )}

              <div className="divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Company</span>
                  <span style={{ fontWeight: 500 }}>{company?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Size</span>
                  <span style={{ fontWeight: 500 }}>{company?.size || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Industry</span>
                  <span style={{ fontWeight: 500 }}>{company?.industry || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>DB Node</span>
                  <span style={{ fontWeight: 500, color: 'var(--accent)', fontSize: 11 }}>:Job @b63e5150</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
