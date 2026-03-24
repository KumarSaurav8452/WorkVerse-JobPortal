import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function CandidateProfile() {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showEdit, setShowEdit] = useState(false);
  const [showSkill, setShowSkill] = useState(false);
  const [showExp, setShowExp] = useState(false);

  const user = JSON.parse(localStorage.getItem('gh_user') || 'null');

  const loadProfile = () => {
    api.get(`/candidates/${user.id}`).then(res => {
      setProfile(res.data.profile);
      setSkills(res.data.skills || []);
      setExperience(res.data.experience || []);
      setEducation(res.data.education || []);
    }).catch(console.error).finally(() => setLoading(false));

    api.get(`/matching/candidates/${user.id}/jobs`).then(res => {
      setRecommendedJobs(res.data || []);
    }).catch(console.error);
  };

  useEffect(() => {
    if (!user?.id) return;
    loadProfile();
  }, [user?.id]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Defensive defaults for Neo4j parameters
    data.name = data.name || profile.name || "";
    data.title = data.title || profile.title || "";
    data.bio = data.bio || profile.bio || "";
    data.location = data.location || profile.location || "";
    data.phone = data.phone || profile.phone || "";
    data.resumeUrl = data.resumeUrl || profile.resumeUrl || "";
    data.githubUrl = data.githubUrl || profile.githubUrl || "";
    data.linkedInUrl = data.linkedInUrl || profile.linkedInUrl || "";
    data.isLooking = data.isLooking === 'true';
    
    // Explicitly remove File object if present
    delete data.photoFile;

    const photoFile = e.target.photoFile?.files[0];
    if (photoFile) {
      if (photoFile.size > 5 * 1024 * 1024) {
        alert("Photo is too large. Please select an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        data.photoUrl = reader.result;
        try {
          await api.put(`/candidates/${user.id}`, data);
          setShowEdit(false);
          loadProfile();
        } catch(err) { 
          const msg = err.response?.data?.error || err.message;
          const details = err.response?.data?.details || '';
          alert(`Update Failed: ${msg}\n${details}`); 
        }
      };
      reader.readAsDataURL(photoFile);
    } else {
      try {
        await api.put(`/candidates/${user.id}`, data);
        setShowEdit(false);
        loadProfile();
      } catch(err) { 
        const msg = err.response?.data?.error || err.message;
        const details = err.response?.data?.details || '';
        alert(`Update Failed: ${msg}\n${details}`); 
      }
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.proficiency = parseInt(data.proficiency);
    data.yearsExp = parseInt(data.yearsExp);
    try {
      await api.post(`/candidates/${user.id}/skills`, data);
      setShowSkill(false);
      loadProfile();
    } catch(err) { alert(err.message); }
  };

  const handleAddExp = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.isCurrent = data.isCurrent === 'on';
    try {
      await api.post(`/candidates/${user.id}/experience`, data);
      setShowExp(false);
      loadProfile();
    } catch(err) { alert(err.message); }
  };

  if (loading) return <div style={{ paddingTop: 120 }}><div className="spinner" /></div>;
  if (!profile) return <div style={{ paddingTop: 120, textAlign: 'center' }}>Profile not found</div>;

  return (
    <div style={{ paddingTop: 90, paddingBottom: 80, minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      <div className="container" style={{ maxWidth: 1000, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* LEFT COLUMN: Profile info */}
        <div>
          {/* Header */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }} />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, fontWeight: 700, color: '#fff',
                }}>{profile.name?.charAt(0)}</div>
              )}

              <div style={{ flex: 1 }}>
                <div className="flex-between">
                  <h1 style={{ fontSize: 28, marginBottom: 4 }}>{profile.name}</h1>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>✏️ Edit</button>
                </div>
                <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {profile.title || 'Candidate'} · {profile.location || 'Location Not Set'}
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span className={`badge ${profile.isLooking ? 'badge-green' : 'badge-orange'}`}>
                    {profile.isLooking ? '🟢 Actively Looking' : 'Not Looking'}
                  </span>
                  <span className="badge badge-purple">DB Score: {profile.profileScore}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio and Links */}
          {(profile.bio || profile.resumeUrl || profile.githubUrl || profile.linkedInUrl) && (
            <div className="card" style={{ marginBottom: 24 }}>
              {profile.bio && (
                <>
                  <h2 style={{ fontSize: 18, marginBottom: 12 }}>About</h2>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 15 }}>{profile.bio}</p>
                </>
              )}
              
              {(profile.resumeUrl || profile.githubUrl || profile.linkedInUrl) && (
                <div style={{ display: 'flex', gap: 12, marginTop: profile.bio ? 20 : 0, flexWrap: 'wrap' }}>
                  {profile.resumeUrl && <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>📄 View Resume</a>}
                  {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>💻 GitHub</a>}
                  {profile.linkedInUrl && <a href={profile.linkedInUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>👔 LinkedIn</a>}
                </div>
              )}
            </div>
          )}

          {/* Experience */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18 }}>Experience</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowExp(true)}>➕ Add Exp</button>
            </div>
            {experience.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {experience.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-card)' }} />
                      {i < experience.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', margin: '4px 0' }} />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, marginBottom: 2 }}>{e.title}</h3>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500 }}>{e.company}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.startDate} - {e.isCurrent ? 'Present' : e.endDate}</div>
                      {e.description && <p style={{ marginTop: 8, fontSize: 14 }}>{e.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No experience listed.</p>
            )}
          </div>

          {/* Skills Graph View */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18 }}>Knowledge Graph (Skills)</h2>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{skills.length} nodes connected in Neo4j</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowSkill(true)}>➕ Add Skill</button>
            </div>
            {skills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {skills.map((s, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                      <span>{s.category}</span>
                      <span>·</span>
                      <span style={{ color: 'var(--accent)' }}>Level: {s.proficiency}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No skills added. Add skills to get job matches!</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Recommended Jobs */}
        <div>
          <div className="card">
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>Graph Matched Jobs</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Recommended precisely for your skills</p>
            
            {recommendedJobs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {recommendedJobs.map(job => (
                  <Link key={job.jobId} to={`/jobs/${job.jobId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, transition: '0.2s', background: 'var(--bg-elevated)' }} className="hover-card">
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <h4 style={{ fontWeight: 600, fontSize: 15 }}>{job.title}</h4>
                        <span className="badge badge-purple">{job.matchCount} matched skills</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🏢 {job.company}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>📍 {job.location || 'Remote'}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <p style={{ color: 'var(--text-muted)' }}>{skills.length === 0 ? "Add your skills to see recommended jobs!" : "No jobs matching your skills at this time."}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODALS */}
      {showEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: 20 }}>Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <input name="name" defaultValue={profile.name} className="form-input" placeholder="Full Name" required style={{ flex: 1 }} />
                <input name="title" defaultValue={profile.title} className="form-input" placeholder="Job Title" style={{ flex: 1 }} />
              </div>
              <input name="location" defaultValue={profile.location} className="form-input" placeholder="Location (e.g., San Francisco, CA)" />
              <input type="hidden" name="phone" defaultValue={profile.phone || ''} />
              <textarea name="bio" defaultValue={profile.bio} className="form-input" placeholder="Quick bio spanning your career..." rows={3}></textarea>
              
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
                <label className="form-label">Profile Media & Links</label>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ fontSize: 12, opacity: 0.8 }}>Update Profile Photo</label>
                  <input name="photoFile" type="file" accept="image/*" className="form-input" style={{ padding: '8px' }} />
                </div>
                <input name="resumeUrl" defaultValue={profile.resumeUrl} className="form-input" placeholder="Resume Link (Google Drive, Dropbox, etc.)" style={{ marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  <input name="githubUrl" defaultValue={profile.githubUrl} className="form-input" placeholder="GitHub URL" style={{ flex: 1 }} />
                  <input name="linkedInUrl" defaultValue={profile.linkedInUrl} className="form-input" placeholder="LinkedIn URL" style={{ flex: 1 }} />
                </div>
              </div>

              <select name="isLooking" defaultValue={profile.isLooking} className="form-input">
                <option value="true">🟢 Actively Looking for Jobs</option>
                <option value="false">⚪ Not Looking</option>
              </select>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setShowEdit(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSkill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 20 }}>Add Skill Node</h2>
            <form onSubmit={handleAddSkill} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input name="skillName" className="form-input" placeholder="Skill Name (e.g. React)" required />
              <select name="category" className="form-input" required>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Database">Database</option>
                <option value="DevOps">DevOps</option>
                <option value="Design">Design</option>
                <option value="Other">Other</option>
              </select>
              <div style={{ display: 'flex', gap: 16 }}>
                <input name="proficiency" type="number" min="1" max="10" className="form-input" placeholder="Proficiency (1-10)" required style={{ flex: 1 }} />
                <input name="yearsExp" type="number" min="0" className="form-input" placeholder="Years Exp" required style={{ flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setShowSkill(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Skill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 500 }}>
            <h2 style={{ marginBottom: 20 }}>Add Experience</h2>
            <form onSubmit={handleAddExp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input name="title" className="form-input" placeholder="Job Title" required />
              <input name="company" className="form-input" placeholder="Company Name" required />
              <div style={{ display: 'flex', gap: 16, minWidth: 0 }}>
                <input name="startDate" className="form-input" placeholder="Start Date (e.g. 2021-05)" required style={{ flex: 1, minWidth: 0 }} />
                <input name="endDate" className="form-input" placeholder="End Date (Optional)" style={{ flex: 1, minWidth: 0 }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="isCurrent" /> Current Job
              </label>
              <textarea name="description" className="form-input" placeholder="What did you do?" rows={3}></textarea>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setShowExp(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Experience</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
