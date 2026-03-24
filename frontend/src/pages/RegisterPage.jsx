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
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/register', form);
      localStorage.setItem('gh_token', res.data.token);
      localStorage.setItem('gh_user', JSON.stringify(res.data.user));
      navigate(res.data.user.role === 'employer' ? '/dashboard' : '/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', paddingTop: 60, paddingBottom: 60,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Join GraphHire</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Create your Neo4j-powered talent profile</p>
        </div>

        {/* Role Toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {['candidate', 'employer'].map(role => (
            <button key={role}
              type="button"
              onClick={() => setForm(f => ({ ...f, role }))}
              style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: form.role === role ? 'var(--bg-card)' : 'transparent',
                color: form.role === role ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: form.role === role ? 600 : 400,
                boxShadow: form.role === role ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.2s', textTransform: 'capitalize',
              }}>
              I'm a {role}
            </button>
          ))}
        </div>

        {error && <div style={{ background: 'rgba(255,94,122,0.1)', color: 'var(--danger)', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 20, textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input required className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Alex Developer" />
          </div>
          <div className="form-group">
            <label className="form-label">Work Email</label>
            <input type="email" required className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="alex@example.com" />
          </div>
          {form.role === 'employer' && (
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input required className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Acme Inc." />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" required className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" minLength={6} />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ justifyContent: 'center', marginTop: 10 }}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          By joining, your profile is stored in Neo4j AuraDB instance dd7f574a.
          <br /><br />
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
