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
 * AuthPage — uses feature-anubhab backend:
 *  - Email/Password → POST /api/user/auth
 *  - Admin → POST /api/admin/login
 *  - MetaMask → local wallet connection only
 */
const AuthPage = () => {
  const { login, setAuthError, error } = useAuth();
  const [activeTab, setActiveTab] = useState('email');
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', otp: '', newPassword: '', adminUser: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // ─── Email Auth (feature-anubhab: POST /api/user/auth) ───────────────────

  // Send OTP for signup
  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/user/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, name: form.name, mode: 'signup_otp' }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to send OTP');
      setOtpSent(true);
      toast.success('OTP sent to ' + form.email);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP + create account
  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/user/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, name: form.name, otp: form.otp }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'OTP verification failed');
      login(data.user, data.token, data.user?.wallet_address || null, 'user');
      toast.success('Account created successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Email Sign In ────────────────────────────────────────────────────────

  const handleEmailLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/user/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Login failed');
      login(data.user, data.token, data.user?.wallet_address || null, 'user');
      toast.success('Signed in successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Auth (mock — calls feature-anubhab /user/auth with Google flag) ─

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      if (isMockFirebase || !auth || !googleProvider || import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
        const mockEmail = prompt("Enter a mock email for development login:", "testuser@example.com");
        if (!mockEmail) { setLoading(false); return; }
        const response = await fetch(`${API_BASE}/user/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: mockEmail, password: 'google_oauth', provider: 'google' }),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Mock Google auth failed');
        login(data.user, data.token, data.user?.wallet_address || null, 'user');
        toast.success('Logged in (Dev Mode)');
        return;
      }
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const response = await fetch(`${API_BASE}/user/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, provider: 'google' }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Google auth failed');
      login(data.user, data.token, data.user?.wallet_address || null, 'user');
      toast.success('Google authentication successful!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── MetaMask Auth ────────────────────────────────────────────────────────

  const handleMetaMaskAuth = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) throw new Error('MetaMask not installed.');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts?.length) throw new Error('No MetaMask accounts found');
      const address = accounts[0];
      // Use wallet address as identity — store locally
      const mockUser = { id: `metamask_${Date.now()}`, wallet_address: address, auth_method: 'metamask' };
      login(mockUser, `metamask_${Date.now()}`, address, 'user');
      toast.success('Wallet connected!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Forgot Password ──────────────────────────────────────────────────────

  const handleForgotPasswordOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to send reset code');
      setForgotStep(1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          otp: form.otp,
          newPassword: form.newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Reset failed');
      toast.success('Password updated! Please sign in.');
      setIsForgotPassword(false);
      setForgotStep(0);
      setForm({ ...form, password: '', otp: '', newPassword: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Reset state when switching modes ────────────────────────────────────

  const switchMode = (signup) => {
    setIsSignup(signup);
    setIsForgotPassword(false);
    setForgotStep(0);
    setOtpSent(false);
    setForm({ email: '', password: '', name: '', otp: '', newPassword: '' });
    setAuthError(null);
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

          {/* Sign Up / Sign In toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
            <button
              onClick={() => switchMode(false)}
              style={{
                flex: 1, padding: '10px', 
                border: !isSignup ? '2px solid var(--border)' : '2px solid var(--border)',
                background: !isSignup ? 'var(--text)' : 'var(--bg)', 
                color: !isSignup ? 'var(--bg)' : 'var(--text)',
                cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold',
                borderRadius: '4px', transition: 'all 0.2s',
                opacity: !isSignup ? 1 : 0.6
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode(true)}
              style={{
                flex: 1, padding: '10px', 
                border: isSignup ? '2px solid var(--border)' : '2px solid var(--border)',
                background: isSignup ? 'var(--text)' : 'var(--bg)', 
                color: isSignup ? 'var(--bg)' : 'var(--text)',
                cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold',
                borderRadius: '4px', transition: 'all 0.2s',
                opacity: isSignup ? 1 : 0.6
              }}
            >
              Sign Up
            </button>
          </div>



          {/* Sign Up / Sign In toggle */}

          {/* Auth Method Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {['email', 'google', 'metamask', 'admin'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setOtpSent(false); toast.dismiss(); }}
                style={{
                  flex: 1, padding: '10px 8px',
                  border: activeTab === tab ? '2px solid var(--primary)' : '2px solid var(--border)',
                  background: activeTab === tab ? 'var(--primary)' : 'var(--surface)',
                  color: activeTab === tab ? '#000' : 'var(--text)',
                  boxShadow: activeTab === tab ? '0 0 15px var(--primary)' : 'none',
                  cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px',
                  fontWeight: 'bold', borderRadius: '4px', transition: 'all 0.2s'
                }}
              >
                {tab === 'email' ? '📧' : tab === 'google' ? '🔵' : tab === 'metamask' ? '🦊' : '⚙️'} {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* ── EMAIL TAB ── */}
          {activeTab === 'email' && (
            <div>
              {/* Forgot Password Flow */}
              {isForgotPassword ? (
                forgotStep === 0 ? (
                  <>
                    <h3 style={{ fontSize: '14px', marginBottom: '12px', textTransform: 'uppercase' }}>Reset Password</h3>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>Enter your email to receive a password reset code.</p>
                    <input type="email" placeholder="e.g., user@example.com" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                    <button onClick={handleForgotPasswordOTP} disabled={loading || !form.email} style={btnStyle(loading || !form.email)}>
                      {loading ? 'Sending Code...' : 'Send Reset Code'}
                    </button>
                    <button onClick={() => setIsForgotPassword(false)} style={{ ...btnStyle(false), background: 'var(--bg)', color: 'var(--text)', border: '2px solid var(--border)', marginTop: '8px' }}>
                      Back to Login
                    </button>
                  </>
                ) : (
                  <>
                    <h3 style={{ fontSize: '14px', marginBottom: '12px', textTransform: 'uppercase' }}>Verify & Reset</h3>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>Reset code sent to {form.email}</p>
                    <input type="text" placeholder="Enter 6-digit code" maxLength={6} value={form.otp}
                      onChange={e => setForm({ ...form, otp: e.target.value })} style={inputStyle} />
                    <input type="password" placeholder="Min. 8 characters" value={form.newPassword}
                      onChange={e => setForm({ ...form, newPassword: e.target.value })} style={inputStyle} />
                    <button onClick={handleResetPassword} disabled={loading || !form.otp || !form.newPassword} style={btnStyle(loading || !form.otp || !form.newPassword)}>
                      {loading ? 'Resetting...' : 'Update Password'}
                    </button>
                    <button onClick={() => setForgotStep(0)} style={{ ...btnStyle(false), background: 'var(--bg)', color: 'var(--text)', border: '2px solid var(--border)', marginTop: '8px' }}>
                      Change Email
                    </button>
                  </>
                )
              ) : (
                /* Sign In / Sign Up Flow */
                isSignup ? (
                  otpSent ? (
                    /* Step 2: Enter OTP */
                    <>
                      <p style={{ fontSize: '12px', color: '#555', marginBottom: '12px' }}>
                        OTP sent to <strong>{form.email}</strong>. Check your inbox.
                      </p>
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
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
                        {loading ? 'Verifying...' : 'Verify OTP & Create Account'}
                      </button>
                      <button
                        onClick={() => setOtpSent(false)}
                        style={{ ...btnStyle(false), background: 'var(--bg)', color: 'var(--text)', border: '2px solid var(--border)', marginTop: '8px' }}
                      >
                        ← Back
                      </button>
                    </>
                  ) : (
                    /* Step 1: Enter details + Send OTP */
                    <>
                      <input type="text" placeholder="Your Full Name" value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                      <input type="email" placeholder="name@example.com" value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                      <input type="password" placeholder="Choose a strong password" value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} />
                      <button
                        onClick={handleSendOTP}
                        disabled={loading || !form.email || !form.password}
                        style={btnStyle(loading || !form.email || !form.password)}
                      >
                        {loading ? 'Sending OTP...' : 'Send OTP to Email'}
                      </button>
                    </>
                  )
                ) : (
                  /* Sign In with email + password */
                  <>
                    <input type="email" placeholder="Enter your email" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                    <input type="password" placeholder="Enter your password" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} />
                    <div style={{ textAlign: 'right', marginBottom: '12px' }}>
                      <button onClick={() => setIsForgotPassword(true)} style={{ background: 'none', border: 'none', color: '#31bbaf', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}>
                        Forgot Password?
                      </button>
                    </div>
                    <button
                      onClick={handleEmailLogin}
                      disabled={loading || !form.email || !form.password}
                      style={btnStyle(loading || !form.email || !form.password)}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                  </>
                )
              )}
            </div>
          )}

          {/* ── GOOGLE TAB ── */}
          {activeTab === 'google' && (
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              style={{
                ...btnStyle(loading),
                background: '#fff', color: '#000', border: '2px solid #4285F4',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <Icon.Google />
              {loading ? 'Connecting...' : isSignup ? 'Sign Up with Google' : 'Sign In with Google'}
            </button>
          )}

          {/* ── ADMIN TAB ── */}
          {activeTab === 'admin' && (
            <div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Access Only</p>
              <input type="text" placeholder="Admin username" value={form.adminUser}
                onChange={e => setForm({ ...form, adminUser: e.target.value })} style={inputStyle} />
              <input type="password" placeholder="Password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} />
              <button
                onClick={async () => {
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
                }}
                disabled={loading || !form.adminUser || !form.password}
                style={btnStyle(loading || !form.adminUser || !form.password)}
              >
                {loading ? 'Logging in...' : '⚙️ Admin Login'}
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