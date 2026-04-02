import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/jobs', label: 'Jobs' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('gh_user') || 'null'));
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
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
    <nav
      style={{
        position: 'fixed',
        inset: '0 0 auto 0',
        zIndex: 100,
        padding: scrolled ? '14px 0' : '22px 0',
        transition: 'var(--transition)',
        background: scrolled ? 'rgba(7, 17, 31, 0.78)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        backdropFilter: scrolled ? 'var(--glass)' : 'none',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                background: 'var(--gradient-strong)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontSize: 20,
                fontWeight: 800,
                boxShadow: '0 14px 30px rgba(33, 127, 219, 0.32)',
              }}
            >
              W
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>
                Work<span className="gradient-text">Verse</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                Graph-native careers
              </div>
            </div>
          </div>
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: 6,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {navItems.map(({ to, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                style={{
                  textDecoration: 'none',
                  padding: '9px 16px',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 700,
                  color: active ? '#08111d' : 'var(--text-secondary)',
                  background: active ? 'var(--gradient)' : 'transparent',
                  transition: 'var(--transition)',
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              <Link to={user.role === 'employer' ? '/dashboard' : '/profile'} className="btn btn-secondary btn-sm">
                {user.name?.split(' ')[0] || 'Profile'}
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Start Free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
