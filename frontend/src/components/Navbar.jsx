import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('gh_user') || 'null'));
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const logout = () => {
    localStorage.removeItem('gh_token');
    localStorage.removeItem('gh_user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'var(--glass-bg)' : 'transparent',
      backdropFilter: scrolled ? 'var(--glass)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : 'none',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      padding: scrolled ? '12px 0' : '20px 0',
    }}>
      <div className="container flex-between">
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38,
              background: 'var(--gradient)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: '#fff',
              boxShadow: '0 4px 12px var(--accent-glow)',
            }}>S</div>
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Stitch<span className="gradient-text">Hire</span>
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { to: '/jobs', label: '💼 Jobs' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 8,
              color: location.pathname === to ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 14,
              background: location.pathname === to ? 'var(--accent-glow)' : 'transparent',
              transition: 'var(--transition)',
            }}>{label}</Link>
          ))}
        </div>

        {/* Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              <Link to={user.role === 'employer' ? '/dashboard' : '/profile'} className="btn btn-secondary btn-sm">
                👤 {user.name?.split(' ')[0]}
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started →</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
