import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

const CATEGORIES = ['All', 'Frontend', 'Backend', 'Database', 'AI/ML', 'DevOps', 'Cloud', 'Design'];

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remote, setRemote] = useState(false);
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  useEffect(() => {
    setLoading(true);
    api.get(`/jobs?limit=30${remote ? '&remote=true' : ''}`)
      .then(r => setJobs(r.data.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [remote]);

  const filtered = q
    ? jobs.filter(j => j.title?.toLowerCase().includes(q.toLowerCase()) ||
        j.company?.name?.toLowerCase().includes(q.toLowerCase()) ||
        j.skills?.some(s => s.name?.toLowerCase().includes(q.toLowerCase())))
    : jobs;

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '32px 0' }}>
        <div className="container">
          <h1 className="section-title">Browse Jobs</h1>
          <p className="section-subtitle">
            {filtered.length} graph-matched opportunities — stored in Neo4j AuraDB dd7f574a
          </p>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className={`btn btn-sm ${remote ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setRemote(!remote)}
            >
              {remote ? '✓' : ''} Remote Only
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {loading ? (
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3>No jobs found</h3>
            <p>Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(job => <JobCard key={job.jobId} job={job} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job }) {
  return (
    <Link to={`/jobs/${job.jobId}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Company Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, hsl(${job.jobId?.charCodeAt(0) * 7 % 360}, 70%, 40%), hsl(${job.jobId?.charCodeAt(1) * 11 % 360}, 60%, 30%))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, color: '#fff',
        }}>
          {job.company?.name?.charAt(0) || '?'}
        </div>

        <div style={{ flex: 1 }}>
          <div className="flex-between" style={{ marginBottom: 6 }}>
            <h3 style={{ fontSize: 17, fontWeight: 600 }}>{job.title}</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {job.applied && <span className="badge badge-blue">✓ Applied</span>}
              {job.remote && <span className="badge badge-green">Remote</span>}
              <span className="badge badge-blue">{job.employmentType || 'Full-time'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
            <span>🏢 {job.company?.name}</span>
            {job.location && <span>📍 {job.location}</span>}
            {job.salaryMin > 0 && <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>
              💰 ${(job.salaryMin / 1000).toFixed(0)}k–${(job.salaryMax / 1000).toFixed(0)}k
            </span>}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(job.skills || []).slice(0, 5).map((s, i) => (
              <span key={i} className="tag">{s.name}</span>
            ))}
            {(job.skills?.length || 0) > 5 && (
              <span className="tag">+{job.skills.length - 5} more</span>
            )}
          </div>
        </div>

        <div style={{ flexShrink: 0, color: 'var(--text-muted)', fontSize: 12 }}>
          {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'Recently'}
        </div>
      </div>
    </Link>
  );
}
