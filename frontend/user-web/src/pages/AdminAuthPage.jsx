import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:5000/api';

/**
 * AdminAuthPage — dedicated admin authentication
 *  - POST /api/admin/login → admin authentication
 */
const AdminAuthPage = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ adminUser: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!form.adminUser || !form.password) {
      toast.error('Username and password required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.adminUser, password: form.password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Admin login failed');
      login(data.admin || { role: 'admin', username: form.adminUser }, data.token, null, 'admin');
      toast.success('Admin logged in!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)'
    }}>
      {/* Full-screen loader overlay */}
      {loading && <Loader fullScreen text="Authenticating Admin..." />}

      {/* Left Panel – Branding (Reuse styling from AuthPage) */}
      <div className="neon-bg-container" style={{
        color: '#fff',
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '3px solid var(--border)',
        position: 'relative'
      }}>
        {/* Animated Background Elements */}
        <div className="neon-grid"></div>
        <div className="blockchain-orb" style={{ top: '10%', left: '10%' }}></div>
        <div className="blockchain-orb" style={{ bottom: '10%', right: '10%', background: 'radial-gradient(circle, rgba(49, 187, 175, 0.15) 0%, transparent 70%)' }}></div>
        
        <div className="floating-block"></div>
        <div className="floating-block"></div>
        <div className="floating-block"></div>
        <div className="floating-block"></div>
        <div className="floating-block"></div>

        <div style={{ position: 'relative', zIndex: 10 }}>
          <h1 className="neon-glow-text" style={{ fontSize: '3.5rem', fontFamily: 'Syne, sans-serif', lineHeight: 1, marginBottom: '2rem', fontWeight: 800 }}>
            ADMIN <span style={{ color: 'var(--primary)', textShadow: '0 0 20px rgba(49, 187, 175, 0.6)' }}>PORTAL</span><br/>
            <span className="neon-glow-purple">BLOCKMYSHOW</span>
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2.5rem', maxWidth: '400px', lineHeight: 1.5, fontWeight: 500 }}>
            Manage events, tickets, and marketplace operations from the secure administrative dashboard.
          </p>
          
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {[
              { label: 'Event Management', icon: '📅' },
              { label: 'Transaction Monitoring', icon: '📊' },
              { label: 'System Configuration', icon: '⚙️' },
              { label: 'Secure Admin Access', icon: '🔒' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '12px 20px', borderLeft: '4px solid var(--primary)', backdropFilter: 'blur(5px)' }}>
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.5px' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 'bold', letterSpacing: '1px' }}>BLOCKMYSHOW ADMIN © 2026</div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 10px #a855f7' }}></div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }}></div>
          </div>
        </div>
      </div>

      {/* Right Panel – Authentication */}
      <div style={{
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '400px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Admin Login
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
            ⚙️ Authorized Access Only
          </p>

          <input
            type="text"
            placeholder="Admin username"
            value={form.adminUser}
            onChange={e => setForm({ ...form, adminUser: e.target.value })}
            style={inputStyle}
            onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
          />
          <input
            type="password"
            placeholder="Admin password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
            onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
          />
          <button
            onClick={handleAdminLogin}
            disabled={loading || !form.adminUser || !form.password}
            style={btnStyle(loading || !form.adminUser || !form.password)}
          >
            {loading ? 'Logging in...' : 'Access Dashboard'}
          </button>
          
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <a href="/" style={{ fontSize: '12px', color: 'var(--muted)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}>
              ← Return to User Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginBottom: '12px',
  border: '2px solid var(--border)',
  background: 'var(--input-bg)',
  color: 'var(--text)',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
};

const btnStyle = (disabled) => ({
  width: '100%',
  padding: '12px',
  background: disabled ? 'var(--muted)' : 'var(--primary)',
  color: '#000',
  border: '2px solid var(--border)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'monospace',
  marginBottom: '8px',
  borderRadius: '4px',
  fontSize: '14px',
  opacity: disabled ? 0.6 : 1,
  transition: 'all 0.2s',
});

export default AdminAuthPage;
