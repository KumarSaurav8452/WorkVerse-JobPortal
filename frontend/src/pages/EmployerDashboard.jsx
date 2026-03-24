import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function EmployerDashboard() {
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
    });

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

  if (loading) return <div style={{ paddingTop: 120 }}><div className="spinner" /></div>;

  return (
    <div style={{ paddingTop: 90, paddingBottom: 80, minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container">
        <div className="flex-between" style={{ marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>Employer Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Managing talent pipeline for <strong style={{ color: 'var(--text-primary)' }}>{company?.name || 'Your Company'}</strong>
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
                    {job.applicantCount || 0} applicants · Posted {new Date(job.postedAt).toLocaleDateString()} · {job.location || 'Remote'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="badge badge-green">Active</span>
                  <Link to={`/jobs/${job.jobId}`} className="btn btn-secondary btn-sm">View Pipeline →</Link>
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
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 32 }}>
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
              <div style={{ display: 'flex', gap: 16 }}>
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
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
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
                    <div style={{ width: 80 }}>
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

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                  {saving ? 'Creating...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
