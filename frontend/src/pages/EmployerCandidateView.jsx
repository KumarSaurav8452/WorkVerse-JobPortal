import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';

const STATUS_BADGE = {
  applied: 'badge-blue',
  screening: 'badge-orange',
  interview: 'badge-purple',
  offer: 'badge-green',
  hired: 'badge-green',
  rejected: 'badge-red',
};

export default function EmployerCandidateView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/candidates/${id}`),
      api.get(`/candidates/${id}/applications`).catch(() => ({ data: [] })),
    ]).then(([profileRes, appsRes]) => {
      setProfile(profileRes.data.profile);
      setSkills(profileRes.data.skills || []);
      setExperience(profileRes.data.experience || []);
      setEducation(profileRes.data.education || []);
      setApplications(appsRes.data || []);
    }).catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div style={{ paddingTop: 120 }}><div className="spinner" /></div>;
  if (!profile) return null;

  return (
    <div className="page-shell" style={{ paddingTop: 98, paddingBottom: 72 }}>
      <div className="container" style={{ maxWidth: 1120 }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }}>
          Back to employer dashboard
        </button>

        <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) 360px', alignItems: 'start', gap: 24 }}>
          <div className="section-stack">
            <div className="hero-panel" style={{ padding: '34px clamp(22px, 4vw, 36px)' }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt={profile.name} style={{ width: 92, height: 92, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                ) : (
                  <div style={{
                    width: 92, height: 92, borderRadius: '50%',
                    background: 'var(--gradient-strong)', display: 'grid', placeItems: 'center',
                    fontSize: 34, fontWeight: 800, color: '#fff',
                  }}>
                    {profile.name?.charAt(0) || 'C'}
                  </div>
                )}

                <div>
                  <div className="eyebrow" style={{ marginBottom: 12 }}>Candidate profile</div>
                  <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 8 }}>{profile.name}</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                    {profile.title || 'Candidate'} · {profile.location || 'Location not set'}
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                    <span className={`badge ${profile.isLooking ? 'badge-green' : 'badge-orange'}`}>
                      {profile.isLooking ? 'Actively looking' : 'Not looking'}
                    </span>
                    <span className="badge badge-blue">Score {profile.profileScore ?? 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 22, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {profile.bio || 'No bio has been added yet.'}
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, marginBottom: 16 }}>Skills</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {skills.length > 0 ? skills.map((skill, index) => (
                  <span key={`${skill.name}-${index}`} className="tag">
                    {skill.name}
                    {skill.proficiency ? ` · ${skill.proficiency}/10` : ''}
                  </span>
                )) : <span style={{ color: 'var(--text-muted)' }}>No skills listed</span>}
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 22, marginBottom: 16 }}>Experience</h2>
              {experience.length > 0 ? (
                <div className="section-stack" style={{ gap: 14 }}>
                  {experience.map((item, index) => (
                    <div key={`exp-${index}`} className="metric-card" style={{ padding: 16 }}>
                      <strong style={{ display: 'block', marginBottom: 4 }}>{item.title || 'Role'}</strong>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 6 }}>
                        {item.company || 'Company'} · {item.startDate || 'Start'} - {item.isCurrent ? 'Present' : item.endDate || 'End'}
                      </div>
                      {item.description && <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{item.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No experience listed</span>
              )}
            </div>

            {education.length > 0 && (
              <div className="card">
                <h2 style={{ fontSize: 22, marginBottom: 16 }}>Education</h2>
                <div className="section-stack" style={{ gap: 12 }}>
                  {education.map((item, index) => (
                    <div key={`edu-${index}`} className="metric-card" style={{ padding: 16 }}>
                      <strong style={{ display: 'block', marginBottom: 4 }}>{item.degree || 'Degree'}</strong>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        {item.field || 'Field'} · {item.university || 'University'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="section-stack" style={{ position: 'sticky', top: 96 }}>
            <div className="card">
              <h3 style={{ fontSize: 22, marginBottom: 16 }}>Links</h3>
              <div className="section-stack" style={{ gap: 10 }}>
                {profile.resumeUrl && <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">Resume</a>}
                {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">GitHub</a>}
                {profile.linkedInUrl && <a href={profile.linkedInUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">LinkedIn</a>}
                {!profile.resumeUrl && !profile.githubUrl && !profile.linkedInUrl && (
                  <span style={{ color: 'var(--text-muted)' }}>No external links provided</span>
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 22, marginBottom: 16 }}>Application timeline</h3>
              {applications.length > 0 ? (
                <div className="section-stack" style={{ gap: 12 }}>
                  {applications.map((application) => (
                    <div key={application.appId} className="metric-card" style={{ padding: 16 }}>
                      <div className="flex-between" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                        <strong>{application.job?.title || 'Job'}</strong>
                        <span className={`badge ${STATUS_BADGE[application.status] || 'badge-blue'}`} style={{ textTransform: 'capitalize' }}>
                          {application.status || 'applied'}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{application.company || 'Company'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No applications recorded yet</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
