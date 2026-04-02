import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('gh_token', res.data.token);
      localStorage.setItem('gh_user', JSON.stringify(res.data.user));
      navigate(res.data.user.role === 'employer' ? '/dashboard' : '/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <div className="auth-showcase">
          <div className="section-stack">
            <div className="eyebrow">Return to your universe</div>
            <div>
              <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 4.2rem)', lineHeight: 1.02, marginBottom: 18 }}>
                Sign in and continue
                <br />
                <span className="gradient-text">your WorkVerse flow.</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 520 }}>
                Track job matches, manage applications, and keep your career graph fresh with a workspace built for motion.
              </p>
            </div>
          </div>

          <div className="section-stack">
            {[
              'Graph-aware job discovery',
              'Employer and candidate dashboards',
              'Cleaner, faster hiring workflows',
            ].map((item) => (
              <div key={item} className="auth-feature">
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-card">
          <div style={{ marginBottom: 30 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                background: 'var(--gradient-strong)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 24,
                fontWeight: 800,
                color: '#fff',
                marginBottom: 18,
              }}
            >
              W
            </div>
            <h2 style={{ fontSize: 32, marginBottom: 8 }}>Welcome back</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Sign in to WorkVerse and pick up where your graph left off.</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,104,136,0.12)', color: 'var(--danger)', padding: 14, borderRadius: 16, marginBottom: 18 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input type="email" required className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" required className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ justifyContent: 'center', marginTop: 8 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: 22, color: 'var(--text-secondary)', fontSize: 14 }}>
            New here? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Create your account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
