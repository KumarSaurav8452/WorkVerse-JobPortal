import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

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
      setJob(jobRes.data.job);
      setApplied(!!jobRes.data.job.applied);
      setCompany(jobRes.data.company);
      setSkills(jobRes.data.skills || []);
      setMatches(matchRes.data || []);
    }).catch(() => navigate('/jobs'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const applyToJob = async () => {
    if (!user) return navigate('/login');
    setApplying(true);
    try {
      await api.post(`/applications/jobs/${id}/apply`, { coverLetter });
      setApplied(true);
    } catch (err) {
      if (err.response?.status === 409) setApplied(true);
      else alert(err.response?.data?.error || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div style={{ paddingTop: 120 }}><div className="spinner" /></div>;
  if (!job) return null;

  const mandatorySkills = skills.filter((s) => s.mandatory !== false);
  const optionalSkills = skills.filter((s) => s.mandatory === false);

  return (
    <div className="page-shell" style={{ paddingTop: 98, paddingBottom: 72 }}>
      <div className="container">
        <button onClick={() => navigate('/jobs')} className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }}>
          Back to jobs
        </button>

        <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px', alignItems: 'start', gap: 24 }}>
          <div className="section-stack">
            <div className="hero-panel" style={{ padding: '34px clamp(22px, 4vw, 36px)' }}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'start', marginBottom: 22 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 24,
                    background: `linear-gradient(135deg, hsl(${id?.charCodeAt(0) * 7 % 360}, 78%, 48%), hsl(${id?.charCodeAt(1) * 11 % 360}, 72%, 30%))`,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 26,
                    flexShrink: 0,
                  }}
                >
                  {company?.name?.charAt(0) || 'W'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="eyebrow" style={{ marginBottom: 12 }}>Opportunity spotlight</div>
                  <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', lineHeight: 1.03, marginBottom: 8 }}>{job.title}</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                    {company?.name} · {job.location || 'Flexible'} · {job.employmentType || 'Full-time'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                {job.remote && <span className="badge badge-green">Remote friendly</span>}
                {job.experienceYears > 0 && <span className="badge badge-orange">{job.experienceYears}+ years experience</span>}
                <span className="badge badge-blue">{skills.length} linked skills</span>
              </div>

              {job.salaryMin > 0 && (
                <div className="metric-card" style={{ marginBottom: 18 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                    Salary range
                  </div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: 34, fontWeight: 700 }}>
                    ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k
                  </div>
                </div>
              )}

              <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8 }}>{job.description}</p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, marginBottom: 16 }}>Required skills</h2>
              {mandatorySkills.length > 0 && (
                <div style={{ marginBottom: optionalSkills.length ? 22 : 0 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>
                    Core requirements
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {mandatorySkills.map((skill, index) => (
                      <div key={index} className="metric-card" style={{ padding: '12px 14px', minWidth: 190 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                          <strong>{skill.name}</strong>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{skill.minProficiency || 5}/10</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${(skill.minProficiency || 5) * 10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {optionalSkills.length > 0 && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>
                    Nice to have
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {optionalSkills.map((skill, index) => <span key={index} className="tag">{skill.name}</span>)}
                  </div>
                </div>
              )}
            </div>

            {matches.length > 0 && (
              <div className="card">
                <h2 style={{ fontSize: 22, marginBottom: 16 }}>Top graph matches</h2>
                <div className="section-stack" style={{ gap: 12 }}>
                  {matches.map((match, index) => (
                    <div key={index} className="metric-card" style={{ padding: '16px 18px' }}>
                      <div className="flex-between" style={{ gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <strong style={{ display: 'block', marginBottom: 4 }}>{match.candidate?.name}</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                            {match.candidate?.title} · {match.matchedSkills}/{match.totalRequired} skills matched
                          </span>
                        </div>
                        <span className={`badge ${match.matchScore >= 80 ? 'badge-green' : 'badge-blue'}`}>{match.matchScore}% fit</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'sticky', top: 96 }}>
            <div className="card">
              <h3 style={{ fontSize: 22, marginBottom: 16 }}>Apply now</h3>
              {applied ? (
                <div className="metric-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Application sent</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>This job is already in your pipeline.</p>
                </div>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Cover Letter</label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Share why this role fits your trajectory."
                      className="form-input"
                      rows={6}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={applyToJob} disabled={applying} style={{ width: '100%', justifyContent: 'center' }}>
                    {applying ? 'Submitting...' : 'Apply to this role'}
                  </button>
                </>
              )}

              <div className="divider" />

              <div className="section-stack" style={{ gap: 12 }}>
                <div className="flex-between" style={{ fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Company</span>
                  <span>{company?.name || 'Unknown'}</span>
                </div>
                <div className="flex-between" style={{ fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Industry</span>
                  <span>{company?.industry || 'N/A'}</span>
                </div>
                <div className="flex-between" style={{ fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Team size</span>
                  <span>{company?.size || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
