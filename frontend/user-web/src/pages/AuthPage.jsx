import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isMockFirebase } from '../utils/firebase';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:5000/api';

// Icons
const Icon = {
  Google: () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
};

/**
 * AuthPage — simplified auth with two endpoints:
 *  - POST /api/user/auth  → handles email login/signup
 *  - POST /api/admin/login → admin authentication
 */
const AuthPage = () => {
  const { login, setAuthError, error } = useAuth();
  const [authMode, setAuthMode] = useState('user'); // 'user' or 'admin'
  const [form, setForm] = useState({ email: '', password: '', otp: '', adminUser: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // ─── User Email Auth: Send email + password (handles both login & signup) ────────────────────────────────────────

  const handleSendOTP = async () => {
    if (!form.email || !form.password) {
      toast.error('Email and password required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      
      // Status 200: User exists and password is valid → Login successful
      if (res.status === 200 && data.success) {
        login(data.user, data.token, data.user?.wallet_address || null, 'user');
        toast.success('Logged in successfully!');
        return;
      }
      
      // Status 202: User doesn't exist → Need OTP for signup
      if (res.status === 202 && data.success) {
        setOtpSent(true);
        toast.success('OTP sent to ' + form.email);
        return;
      }
      
      // Any other response is an error
      throw new Error(data.message || 'Authentication failed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── User Email Auth: Verify OTP ──────────────────────────────────────

  const handleVerifyOTP = async () => {
    if (!form.otp || form.otp.length !== 6) {
      toast.error('Enter valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, otp: form.otp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'OTP verification failed');
      login(data.user, data.token, data.user?.wallet_address || null, 'user');
      toast.success('Logged in successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Admin Login ───────────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)'
    }}>
      {/* Full-screen loader overlay */}
      {loading && <Loader fullScreen text={otpSent ? 'Verifying OTP...' : 'Authenticating...'} />}

      {/* Left Panel – Branding */}
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
            NFT <span style={{ color: 'var(--primary)', textShadow: '0 0 20px rgba(49, 187, 175, 0.6)' }}>TICKETS</span><br/>
            <span className="neon-glow-purple">WEB3 EVENTS</span>
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2.5rem', maxWidth: '400px', lineHeight: 1.5, fontWeight: 500 }}>
            Secure, identity-bound event tickets powered by <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Blockchain</span> technology.
          </p>
          
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {[
              { label: 'Non-transferable NFT tickets', icon: '🔗' },
              { label: 'Aadhaar-linked verification', icon: '🆔' },
              { label: 'Fraud-proof entry system', icon: '🛡️' },
              { label: 'Automatic wallet creation', icon: '👛' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '12px 20px', borderLeft: '4px solid var(--primary)', backdropFilter: 'blur(5px)' }}>
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.5px' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 'bold', letterSpacing: '1px' }}>BLOCKMYSHOW © 2026</div>
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
            Welcome to BlockMyShow
          </h2>

          {/* Auth Mode Toggle: User or Admin */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
            <button
              onClick={() => {
                setAuthMode('user');
                setOtpSent(false);
                setForm({ email: '', password: '', otp: '', adminUser: '' });
              }}
              style={{
                flex: 1, 
                padding: '12px',
                border: authMode === 'user' ? '2px solid var(--primary)' : '2px solid var(--border)',
                background: authMode === 'user' ? 'var(--primary)' : 'var(--surface)',
                color: authMode === 'user' ? '#000' : 'var(--text)',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: 'bold',
                borderRadius: '4px',
                transition: 'all 0.2s',
                boxShadow: authMode === 'user' ? '0 0 15px var(--primary)' : 'none'
              }}
            >
              👤 User Login
            </button>
            <button
              onClick={() => {
                setAuthMode('admin');
                setOtpSent(false);
                setForm({ email: '', password: '', otp: '', adminUser: '' });
              }}
              style={{
                flex: 1,
                padding: '12px',
                border: authMode === 'admin' ? '2px solid var(--primary)' : '2px solid var(--border)',
                background: authMode === 'admin' ? 'var(--primary)' : 'var(--surface)',
                color: authMode === 'admin' ? '#000' : 'var(--text)',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: 'bold',
                borderRadius: '4px',
                transition: 'all 0.2s',
                boxShadow: authMode === 'admin' ? '0 0 15px var(--primary)' : 'none'
              }}
            >
              ⚙️ Admin Login
            </button>
          </div>

          {/* USER LOGIN FLOW */}
          {authMode === 'user' && (
            <div>
              {otpSent ? (
                // Step 2: Enter OTP (only for new accounts)
                <>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                    6-digit OTP sent to <strong style={{ color: 'var(--primary)' }}>{form.email}</strong>
                  </p>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    maxLength={6}
                    value={form.otp}
                    onChange={e => setForm({ ...form, otp: e.target.value })}
                    style={inputStyle}
                  />
                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading || form.otp.length !== 6}
                    style={btnStyle(loading || form.otp.length !== 6)}
                  >
                    {loading ? 'Creating Account...' : 'Verify OTP & Create Account'}
                  </button>
                  <button
                    onClick={() => setOtpSent(false)}
                    style={{ ...btnStyle(false), background: 'var(--surface)', color: 'var(--text)', border: '2px solid var(--border)' }}
                  >
                    ← Back
                  </button>
                </>
              ) : (
                // Step 1: Enter email & password
                <>
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    type="password"
                    placeholder="Your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    style={inputStyle}
                  />
                  <button
                    onClick={handleSendOTP}
                    disabled={loading || !form.email || !form.password}
                    style={btnStyle(loading || !form.email || !form.password)}
                  >
                    {loading ? 'Checking...' : 'Login / Signup'}
                  </button>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', marginTop: '16px', lineHeight: 1.5 }}>
                    🔐 Existing account? → Direct login<br/>
                    ✨ New account? → Creates after OTP verification
                  </p>
                </>
              )}
            </div>
          )}

          {/* ADMIN LOGIN FLOW */}
          {authMode === 'admin' && (
            <div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>⚙️ Admin Access Only</p>
              <input
                type="text"
                placeholder="Admin username"
                value={form.adminUser}
                onChange={e => setForm({ ...form, adminUser: e.target.value })}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Admin password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={inputStyle}
              />
              <button
                onClick={handleAdminLogin}
                disabled={loading || !form.adminUser || !form.password}
                style={btnStyle(loading || !form.adminUser || !form.password)}
              >
                {loading ? 'Logging in...' : 'Admin Login'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Shared input / button styles ─────────────────────────────────────────────

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

export default AuthPage;