import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initRole = searchParams.get('role') === 'employer' ? 'employer' : 'candidate';

  const [form, setForm] = useState({ name: '', email: '', password: '', role: initRole, company: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      localStorage.setItem('gh_token', res.data.token);
      localStorage.setItem('gh_user', JSON.stringify(res.data.user));
      navigate(res.data.user.role === 'employer' ? '/dashboard' : '/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <div className="auth-showcase">
          <div className="section-stack">
            <div className="eyebrow">Build your entry point</div>
            <div>
              <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 4.2rem)', lineHeight: 1.02, marginBottom: 18 }}>
                Join the network that
                <br />
                <span className="gradient-text">connects work to possibility.</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 520 }}>
                Create your WorkVerse account to map skills, discover opportunities, and power a sharper hiring experience.
              </p>
            </div>
          </div>

          <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div className="metric-card">
              <span className="metric-value gradient-text">1 graph</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Jobs, skills, and people in one place</span>
            </div>
            <div className="metric-card">
              <span className="metric-value gradient-text">2 roles</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Built for candidates and employers</span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 32, marginBottom: 8 }}>Create your WorkVerse account</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Set up your workspace and start building momentum.</p>
          </div>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 999, padding: 5, marginBottom: 20 }}>
            {['candidate', 'employer'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm((f) => ({ ...f, role }))}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: 999,
                  padding: '11px 14px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  color: form.role === role ? '#07111f' : 'var(--text-secondary)',
                  background: form.role === role ? 'var(--gradient)' : 'transparent',
                  transition: 'var(--transition)',
                }}
              >
                {role}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: 'rgba(255,104,136,0.12)', color: 'var(--danger)', padding: 14, borderRadius: 16, marginBottom: 18 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input required className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alex Developer" />
            </div>

            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input type="email" required className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alex@example.com" />
            </div>

            {form.role === 'employer' && (
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input required className="form-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Inc." />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" required className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Choose a secure password" minLength={6} />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ justifyContent: 'center', marginTop: 8 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ marginTop: 20, color: 'var(--text-secondary)', fontSize: 14 }}>
            Already a member? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
