import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const API_BASE = 'http://localhost:5000/api/v1';

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
 * AuthPage
 * Handles Sign Up and Sign In flows for:
 *  - Email / Password  (sign up via OTP → /auth/send-email-otp + /auth/verify-email-otp)
 *                      (sign in via /auth/login/email)
 *  - Google OAuth      (/auth/signup/google  or  /auth/login/google)
 *  - MetaMask          (/auth/signup/metamask or /auth/login/metamask)
 */
const AuthPage = () => {
  const { login, setAuthError, error } = useAuth();
  const [activeTab, setActiveTab] = useState('email');
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // ─── OTP Step (Sign Up flow) ──────────────────────────────────────────────

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to send OTP');
      setOtpSent(true);
      setAuthError(null);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          otp: form.otp,
          password: form.password,
          name: form.name,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'OTP verification failed');
      // walletAddress comes back top-level from the backend
      login(data.user, data.token, data.walletAddress || data.user?.walletAddress);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Email Sign In ────────────────────────────────────────────────────────

  const handleEmailLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Login failed');
      login(data.user, data.token, data.walletAddress || data.user?.walletAddress);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Auth ──────────────────────────────────────────────────────────

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const endpoint = isSignup ? '/auth/signup/google' : '/auth/login/google';
      // Mock Google token (replace with actual Firebase Auth in production)
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleToken: 'mock_google_token_' + Date.now() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Google auth failed');
      login(data.user, data.token, data.walletAddress || data.user?.walletAddress);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── MetaMask Auth ────────────────────────────────────────────────────────

  const handleMetaMaskAuth = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask to continue.');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('No MetaMask accounts found');

      const address = accounts[0];
      const endpoint = isSignup ? '/auth/signup/metamask' : '/auth/login/metamask';

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature: 'mock_sig', message: 'BlockMyShow Login' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'MetaMask auth failed');
      login(data.user, data.token, data.walletAddress || address);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Reset state when switching modes ────────────────────────────────────

  const switchMode = (signup) => {
    setIsSignup(signup);
    setOtpSent(false);
    setForm({ email: '', password: '', name: '', otp: '' });
    setAuthError(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      minHeight: '100vh',
      background: '#fafafa'
    }}>
      {/* Full-screen loader overlay */}
      {loading && <Loader fullScreen text={otpSent ? 'Verifying OTP...' : 'Authenticating...'} />}

      {/* Left Panel – Branding */}
      <div style={{
        background: '#000',
        color: '#fff',
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '3px solid #000'
      }}>
        <div>
          <h1 style={{ fontSize: '3rem', fontFamily: 'Syne, sans-serif', lineHeight: 1, marginBottom: '2rem' }}>
            NFT <span style={{ color: '#31bbaf' }}>Tickets</span><br/>
            Web3 <span style={{ color: '#31bbaf' }}>Events</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '2rem' }}>
            Secure, identity-bound event tickets powered by blockchain technology
          </p>
          <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>
            <div>✓ Non-transferable NFT tickets</div>
            <div>✓ Aadhaar-based identity verification</div>
            <div>✓ Fraud-proof entry system</div>
            <div>✓ Automatic wallet creation</div>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>BlockMyShow © 2026</div>
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
                flex: 1, padding: '10px', border: !isSignup ? '2px solid #000' : '2px solid #ccc',
                background: !isSignup ? '#000' : '#fff', color: !isSignup ? '#fff' : '#000',
                cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold',
                borderRadius: '4px', transition: 'all 0.2s'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode(true)}
              style={{
                flex: 1, padding: '10px', border: isSignup ? '2px solid #000' : '2px solid #ccc',
                background: isSignup ? '#000' : '#fff', color: isSignup ? '#fff' : '#000',
                cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold',
                borderRadius: '4px', transition: 'all 0.2s'
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: '#fee2e2', color: '#dc2626', padding: '12px',
              marginBottom: '1rem', fontSize: '12px', border: '2px solid #dc2626',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          {/* Auth Method Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
            {['email', 'google', 'metamask'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setOtpSent(false); setAuthError(null); }}
                style={{
                  flex: 1, padding: '10px 8px',
                  border: activeTab === tab ? '2px solid #31bbaf' : '2px solid #ccc',
                  background: activeTab === tab ? '#31bbaf' : '#fff',
                  color: activeTab === tab ? '#fff' : '#000',
                  cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px',
                  fontWeight: 'bold', borderRadius: '4px', transition: 'all 0.2s'
                }}
              >
                {tab === 'email' ? '📧' : tab === 'google' ? '🔵' : '🦊'} {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* ── EMAIL TAB ── */}
          {activeTab === 'email' && (
            <div>
              {/* Sign Up via OTP */}
              {isSignup ? (
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
                      style={{ ...btnStyle(false), background: '#fff', color: '#000', border: '2px solid #ccc', marginTop: '8px' }}
                    >
                      ← Back
                    </button>
                  </>
                ) : (
                  /* Step 1: Enter details + Send OTP */
                  <>
                    <input type="text" placeholder="Full name (optional)" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                    <input type="email" placeholder="Email address" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                    <input type="password" placeholder="Password" value={form.password}
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
                  <input type="email" placeholder="Email address" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                  <input type="password" placeholder="Password" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} />
                  <button
                    onClick={handleEmailLogin}
                    disabled={loading || !form.email || !form.password}
                    style={btnStyle(loading || !form.email || !form.password)}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </>
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

          {/* ── METAMASK TAB ── */}
          {activeTab === 'metamask' && (
            <div>
              <button
                onClick={handleMetaMaskAuth}
                disabled={loading}
                style={{
                  ...btnStyle(loading),
                  background: '#fff8f0', color: '#000', border: '2px solid #e2761b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  marginBottom: '12px'
                }}
              >
                🦊 {loading ? 'Connecting...' : isSignup ? 'Sign Up with MetaMask' : 'Sign In with MetaMask'}
              </button>
              <p style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
                Your wallet address will be used for NFT ticket delivery
              </p>
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
  border: '2px solid #ddd',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const btnStyle = (disabled) => ({
  width: '100%',
  padding: '12px',
  background: disabled ? '#ccc' : '#000',
  color: '#fff',
  border: '2px solid #000',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'monospace',
  marginBottom: '8px',
  borderRadius: '4px',
  fontSize: '14px',
  opacity: disabled ? 0.6 : 1,
  transition: 'all 0.2s',
});

export default AuthPage;