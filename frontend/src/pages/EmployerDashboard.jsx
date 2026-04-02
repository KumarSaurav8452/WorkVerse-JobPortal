import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const STATUS_BADGE = {
  applied: 'badge-blue',
  screening: 'badge-orange',
  interview: 'badge-purple',
  offer: 'badge-green',
  hired: 'badge-green',
  rejected: 'badge-red',
};

const STAGE_ORDER = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

export default function EmployerDashboard() {
  const [company, setCompany] = useState(null);
  const [companyLoaded, setCompanyLoaded] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [applicantSearch, setApplicantSearch] = useState('');
  const [applicantStageFilter, setApplicantStageFilter] = useState('all');
  const [draggedApplicationId, setDraggedApplicationId] = useState(null);
  const [updatingAppId, setUpdatingAppId] = useState(null);
  const [profileCache, setProfileCache] = useState({});
  const [openProfiles, setOpenProfiles] = useState({});
  const [loadingProfileId, setLoadingProfileId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState([{ name: '', minProficiency: 5, mandatory: true }]);
  const user = JSON.parse(localStorage.getItem('gh_user') || 'null');

  useEffect(() => {
    if (!user?.id) return;
    
    // 1. Fetch Company Info (for branding/stats)
    const cid = user.companyId || 'default-company-uuid';
    api.get(`/companies/${cid}`).then(res => {
      setCompany(res.data.company);
    }).catch(err => {
      console.error("Company Load Error:", err);
      setCompany({ name: 'Your Company', industry: 'Tech' });
    }).finally(() => setCompanyLoaded(true));

    // 2. Fetch YOUR Jobs (Directly from yours, not company-wide)
    api.get('/jobs/my-jobs').then(res => {
      setJobs(res.data.jobs || []);
    }).catch(err => {
      console.error("Jobs Load Error:", err);
    }).finally(() => setLoading(false));
  }, [user]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.target);
    const jobData = {
      title: formData.get('title'),
      description: formData.get('description'),
      location: formData.get('location'),
      salaryMin: parseInt(formData.get('salaryMin')),
      salaryMax: parseInt(formData.get('salaryMax')),
      remote: formData.get('remote') === 'on',
      companyId: user?.companyId,
      benefits: [],
      skills: skills.filter(s => s.name.trim() !== '')
    };
    
    try {
      await api.post('/jobs', jobData);
      
      // Refresh ONLY your jobs list directly
      const res = await api.get('/jobs/my-jobs');
      setJobs(res.data.jobs || []);
      setShowModal(false);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      const details = err.response?.data?.details || '';
      alert(`Error creating job: ${msg}\n${details}`);
    } finally {
      setSaving(false);
    }
  };

  const openApplicantsModal = async (job) => {
    setSelectedJob(job);
    setShowApplicantsModal(true);
    setLoadingApplicants(true);
    try {
      const res = await api.get(`/applications/jobs/${job.jobId}`);
      setApplicants(res.data || []);
    } catch (err) {
      console.error('Applicants Load Error:', err);
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const closeApplicantsModal = () => {
    setShowApplicantsModal(false);
    setSelectedJob(null);
    setApplicants([]);
    setApplicantSearch('');
    setApplicantStageFilter('all');
    setDraggedApplicationId(null);
  };

  const updateApplicantStatus = async (appId, status) => {
    setUpdatingAppId(appId);
    try {
      await api.put(`/applications/${appId}/status`, { status });
      setApplicants((current) =>
        current.map((entry) =>
          entry.application?.appId === appId
            ? { ...entry, application: { ...entry.application, status } }
            : entry
        )
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update applicant status');
    } finally {
      setUpdatingAppId(null);
    }
  };

  const toggleApplicantProfile = async (candidateId) => {
    if (!candidateId) return;
    if (profileCache[candidateId]) {
      setOpenProfiles((current) => ({ ...current, [candidateId]: !current[candidateId] }));
      return;
    }

    setLoadingProfileId(candidateId);
    try {
      const res = await api.get(`/candidates/${candidateId}`);
      setProfileCache((current) => ({ ...current, [candidateId]: res.data }));
      setOpenProfiles((current) => ({ ...current, [candidateId]: true }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to load candidate profile');
    } finally {
      setLoadingProfileId(null);
    }
  };

  const filteredApplicants = applicants.filter((entry) => {
    const query = applicantSearch.trim().toLowerCase();
    const matchesSearch = !query || [
      entry.candidate?.name,
      entry.candidate?.title,
      entry.candidate?.location,
      ...(entry.skills || []).map((skill) => skill?.name),
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));

    const matchesStage = applicantStageFilter === 'all' || (entry.application?.status || 'applied') === applicantStageFilter;
    return matchesSearch && matchesStage;
  });

  const applicantsByStage = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = filteredApplicants.filter((entry) => (entry.application?.status || 'applied') === stage);
    return acc;
  }, {});

  if (loading) return <div style={{ paddingTop: 120 }}><div className="spinner" /></div>;

  return (
    <div style={{ paddingTop: 90, paddingBottom: 80, minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container">
        <div className="flex-between" style={{ marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>Employer Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Managing talent pipeline for <strong style={{ color: 'var(--text-primary)' }}>{companyLoaded ? (company?.name || 'Your Company') : '...'}</strong>
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Post New Job</button>
        </div>

        <div className="grid-3" style={{ marginBottom: 32 }}>
          <div className="card">
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Active Postings</div>
            <div className="gradient-text" style={{ fontSize: 36, fontWeight: 700 }}>{jobs.length}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Total Applicants</div>
            <div style={{ fontSize: 36, fontWeight: 700 }}>
              {jobs.reduce((acc, job) => acc + (job.applicantCount || 0), 0)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 4 }}>↑ New candidates</div>
          </div>
          <div className="card">
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Graph Reach</div>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{company?.alumni || 0}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>connected alumni in network</div>
          </div>
        </div>

        <h2 style={{ fontSize: 20, marginBottom: 20 }}>Your Job Postings</h2>
        {jobs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {jobs.map(job => (
              <div key={job.jobId} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 16, marginBottom: 4 }}>
                    <Link to={`/jobs/${job.jobId}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{job.title}</Link>
                  </h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    <button
                      type="button"
                      onClick={() => openApplicantsModal(job)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        font: 'inherit',
                        fontWeight: 700,
                      }}
                    >
                      {job.applicantCount || 0} applicants
                    </button>
                    {' '}· Posted {new Date(job.postedAt).toLocaleDateString()} · {job.location || 'Remote'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="badge badge-green">Active</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => openApplicantsModal(job)}>View Pipeline</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
            <h3 style={{ marginBottom: 8 }}>No Active Jobs</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>You haven't posted any jobs yet.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Post Your First Job</button>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card modal-card" style={{ padding: 32 }}>
            <h2 style={{ marginBottom: 20 }}>Post a New Job</h2>
            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Job Title</label>
                <input required name="title" className="form-input" placeholder="e.g. Data Analyst" />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea required name="description" className="form-input" placeholder="Job responsibilities and requirements..." rows={4} />
              </div>
              <div>
                <label className="form-label">Location</label>
                <input required name="location" className="form-input" placeholder="e.g. New York, NY" />
              </div>
              <div className="modal-row">
                <div style={{ flex: 1 }}>
                  <label className="form-label">Min Salary ($)</label>
                  <input required name="salaryMin" type="number" className="form-input" placeholder="60000" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Max Salary ($)</label>
                  <input required name="salaryMax" type="number" className="form-input" placeholder="90000" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="remote" id="remote" defaultChecked />
                <label htmlFor="remote" style={{ color: 'var(--text-secondary)' }}>This is a remote position</label>
              </div>

              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Required Skills</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSkills([...skills, { name: '', minProficiency: 5, mandatory: true }])}>+ Add Skill</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {skills.map((s, i) => (
                  <div key={i} className="modal-row-tight">
                    <div style={{ flex: 1 }}>
                      <input 
                        className="form-input" 
                        placeholder="Skill (e.g. React)" 
                        value={s.name} 
                        onChange={e => {
                          const newSkills = [...skills];
                          newSkills[i].name = e.target.value;
                          setSkills(newSkills);
                        }}
                      />
                    </div>
                    <div style={{ width: 80, flex: '0 0 80px' }}>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Min Prof.</label>
                      <input 
                        type="number" min="1" max="10" className="form-input" 
                        value={s.minProficiency} 
                        onChange={e => {
                          const newSkills = [...skills];
                          newSkills[i].minProficiency = parseInt(e.target.value);
                          setSkills(newSkills);
                        }}
                      />
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}>🗑️</button>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Creating...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApplicantsModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.82)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div className="card modal-card" style={{ padding: 28, width: 'min(100%, 760px)' }}>
            <div className="flex-between" style={{ marginBottom: 18, gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 26, marginBottom: 6 }}>Applicants</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {selectedJob?.title} · {selectedJob?.applicantCount || 0} total
                </p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={closeApplicantsModal}>Close</button>
            </div>

            {loadingApplicants ? (
              <div className="spinner" />
            ) : applicants.length === 0 ? (
              <div className="metric-card" style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: 8 }}>No applicants yet</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Candidate details will appear here as soon as people apply.</p>
              </div>
            ) : (
              <>
                <div className="modal-row" style={{ marginBottom: 18 }}>
                  <input
                    className="form-input"
                    placeholder="Search by name, title, location, or skill"
                    value={applicantSearch}
                    onChange={(e) => setApplicantSearch(e.target.value)}
                  />
                  <select
                    className="form-input"
                    value={applicantStageFilter}
                    onChange={(e) => setApplicantStageFilter(e.target.value)}
                    style={{ maxWidth: 220 }}
                  >
                    <option value="all">All stages</option>
                    {STAGE_ORDER.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 14,
                    alignItems: 'start',
                  }}
                >
                  {STAGE_ORDER.map((stage) => (
                    <div
                      key={stage}
                      className="metric-card"
                      style={{ padding: 14, minHeight: 220 }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedApplicationId) updateApplicantStatus(draggedApplicationId, stage);
                        setDraggedApplicationId(null);
                      }}
                    >
                      <div className="flex-between" style={{ marginBottom: 12, gap: 10 }}>
                        <strong style={{ textTransform: 'capitalize' }}>{stage}</strong>
                        <span className={`badge ${STATUS_BADGE[stage] || 'badge-blue'}`}>{applicantsByStage[stage]?.length || 0}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(applicantsByStage[stage] || []).length > 0 ? applicantsByStage[stage].map((entry) => (
                          <div
                            key={entry.application?.appId}
                            className="metric-card"
                            style={{ padding: 14, cursor: 'grab' }}
                            draggable
                            onDragStart={() => setDraggedApplicationId(entry.application?.appId)}
                            onDragEnd={() => setDraggedApplicationId(null)}
                          >
                    <div className="flex-between" style={{ alignItems: 'start', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                      <div>
                        <h3 style={{ fontSize: 16, marginBottom: 4 }}>{entry.candidate?.name || 'Unnamed Candidate'}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                          {entry.candidate?.title || 'Candidate'} · {entry.candidate?.location || 'Location not set'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span className="badge badge-blue">Score {entry.candidate?.profileScore ?? 'N/A'}</span>
                        <span className={`badge ${STATUS_BADGE[entry.application?.status] || 'badge-blue'}`} style={{ textTransform: 'capitalize' }}>
                          {entry.application?.status || 'applied'}
                        </span>
                      </div>
                    </div>

                    <div className="modal-row" style={{ marginBottom: 12, alignItems: 'end' }}>
                      <div>
                        <div className="form-label" style={{ marginBottom: 6 }}>Pipeline Status</div>
                        <select
                          className="form-input"
                          value={entry.application?.status || 'applied'}
                          disabled={updatingAppId === entry.application?.appId}
                          onChange={(e) => updateApplicantStatus(entry.application?.appId, e.target.value)}
                        >
                          <option value="applied">Applied</option>
                          <option value="screening">Screening</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div style={{ flex: '0 0 auto' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => toggleApplicantProfile(entry.candidate?.candidateId)}
                          disabled={loadingProfileId === entry.candidate?.candidateId}
                        >
                          {loadingProfileId === entry.candidate?.candidateId
                            ? 'Loading Profile...'
                            : openProfiles[entry.candidate?.candidateId]
                              ? 'Hide Profile'
                              : 'View Full Profile'}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                      Applied {entry.application?.appliedAt ? new Date(entry.application.appliedAt).toLocaleString() : 'recently'}
                    </div>

                    {entry.application?.coverLetter && (
                      <div style={{ marginBottom: 12 }}>
                        <div className="form-label" style={{ marginBottom: 6 }}>Cover Letter</div>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                          {entry.application.coverLetter}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="form-label" style={{ marginBottom: 8 }}>Skills</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {(entry.skills || []).filter((skill) => skill?.name).length > 0 ? (
                          entry.skills
                            .filter((skill) => skill?.name)
                            .map((skill, index) => (
                              <span key={`${entry.application?.appId}-${skill.name}-${index}`} className="tag">
                                {skill.name}
                                {skill.proficiency ? ` · ${skill.proficiency}/10` : ''}
                              </span>
                            ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>No skills listed</span>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <Link to={`/candidates/${entry.candidate?.candidateId}/view`} className="btn btn-secondary btn-sm">
                        Open Candidate Page
                      </Link>
                    </div>

                    {openProfiles[entry.candidate?.candidateId] && profileCache[entry.candidate?.candidateId] && (
                      <div className="metric-card" style={{ marginTop: 14, padding: 16 }}>
                        <div style={{ marginBottom: 12 }}>
                          <div className="form-label" style={{ marginBottom: 6 }}>Bio</div>
                          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            {profileCache[entry.candidate.candidateId]?.profile?.bio || 'No bio added'}
                          </div>
                        </div>

                        <div className="modal-row" style={{ marginBottom: 12 }}>
                          <div>
                            <div className="form-label" style={{ marginBottom: 6 }}>Resume</div>
                            {profileCache[entry.candidate.candidateId]?.profile?.resumeUrl ? (
                              <a href={profileCache[entry.candidate.candidateId].profile.resumeUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                                Open Resume
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Not provided</span>
                            )}
                          </div>
                          <div>
                            <div className="form-label" style={{ marginBottom: 6 }}>Links</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                              {profileCache[entry.candidate.candidateId]?.profile?.githubUrl && (
                                <a href={profileCache[entry.candidate.candidateId].profile.githubUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                                  GitHub
                                </a>
                              )}
                              {profileCache[entry.candidate.candidateId]?.profile?.linkedInUrl && (
                                <a href={profileCache[entry.candidate.candidateId].profile.linkedInUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                                  LinkedIn
                                </a>
                              )}
                              {!profileCache[entry.candidate.candidateId]?.profile?.githubUrl && !profileCache[entry.candidate.candidateId]?.profile?.linkedInUrl && (
                                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>No links provided</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {(profileCache[entry.candidate.candidateId]?.experience || []).filter((exp) => exp?.title || exp?.company).length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div className="form-label" style={{ marginBottom: 8 }}>Experience</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {profileCache[entry.candidate.candidateId].experience
                                .filter((exp) => exp?.title || exp?.company)
                                .slice(0, 3)
                                .map((exp, expIndex) => (
                                  <div key={`${entry.candidate.candidateId}-exp-${expIndex}`} style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>{exp.title || 'Role'}</strong>
                                    {' '}at {exp.company || 'Company'}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                          </div>
                        )) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No applicants in this stage</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
