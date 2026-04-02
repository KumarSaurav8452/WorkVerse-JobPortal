import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remote, setRemote] = useState(false);
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  useEffect(() => {
    setLoading(true);
    api.get(`/jobs?limit=30${remote ? '&remote=true' : ''}`)
      .then((r) => setJobs(r.data.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [remote]);

  const filtered = q
    ? jobs.filter((j) =>
        j.title?.toLowerCase().includes(q.toLowerCase()) ||
        j.company?.name?.toLowerCase().includes(q.toLowerCase()) ||
        j.skills?.some((s) => s.name?.toLowerCase().includes(q.toLowerCase())))
    : jobs;

  return (
    <div className="page-shell" style={{ paddingTop: 98, minHeight: '100vh' }}>
      <div className="container" style={{ paddingBottom: 72 }}>
        <section className="hero-panel" style={{ padding: '34px clamp(22px, 4vw, 40px)', marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 18, alignItems: 'end' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Discover opportunities</div>
              <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', marginBottom: 10 }}>Browse jobs with stronger signal</h1>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 720 }}>
                Explore roles through the lens of skills, employer context, and graph-native matching instead of flat listing noise.
              </p>
            </div>

            <div className="metric-card" style={{ minWidth: 180 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Results</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 36, fontWeight: 700 }}>{filtered.length}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
            <button className={`btn btn-sm ${remote ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRemote(!remote)}>
              {remote ? 'Remote enabled' : 'Remote only'}
            </button>
            {q && <div className="tag" style={{ padding: '10px 14px' }}>Searching for: {q}</div>}
          </div>
        </section>

        {loading ? (
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '72px 28px' }}>
            <h3 style={{ marginBottom: 8 }}>No jobs found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Try another query or toggle your filters to widen the graph.</p>
          </div>
        ) : (
          <div className="section-stack">
            {filtered.map((job) => <JobCard key={job.jobId} job={job} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job }) {
  return (
    <Link to={`/jobs/${job.jobId}`} style={{ textDecoration: 'none' }}>
      <div className="card card-hover list-card" style={{ display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr) auto', gap: 18, alignItems: 'start' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 22,
            background: `linear-gradient(135deg, hsl(${job.jobId?.charCodeAt(0) * 7 % 360}, 78%, 48%), hsl(${job.jobId?.charCodeAt(1) * 11 % 360}, 72%, 30%))`,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontSize: 22,
            fontWeight: 800,
            boxShadow: '0 18px 30px rgba(0,0,0,0.26)',
          }}
        >
          {job.company?.name?.charAt(0) || '?'}
        </div>

        <div style={{ minWidth: 0 }}>
          <div className="flex-between" style={{ gap: 16, alignItems: 'start', flexWrap: 'wrap', marginBottom: 10 }}>
            <div>
              <h3 style={{ fontSize: 22, marginBottom: 6 }}>{job.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {job.company?.name} · {job.location || 'Flexible location'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {job.applied && <span className="badge badge-blue">Applied</span>}
              {job.remote && <span className="badge badge-green">Remote</span>}
              <span className="badge badge-purple">{job.employmentType || 'Full-time'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14, fontSize: 14, color: 'var(--text-secondary)' }}>
            {job.salaryMin > 0 && (
              <span style={{ color: 'var(--accent2)', fontWeight: 700 }}>
                ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k
              </span>
            )}
            <span>{job.skills?.length || 0} linked skills</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(job.skills || []).slice(0, 5).map((skill, index) => (
              <span key={index} className="tag">{skill.name}</span>
            ))}
            {(job.skills?.length || 0) > 5 && <span className="tag">+{job.skills.length - 5} more</span>}
          </div>
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
          {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'Recently'}
        </div>
      </div>
    </Link>
  );
}
