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
  Wallet: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
      <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/>
    </svg>
  ),
};

/**
 * AuthPage — simplified auth with two endpoints:
 *  - POST /api/user/auth  → handles email login/signup
 *  - POST /api/admin/login → admin authentication
 */
const AuthPage = () => {
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // ─── Email/Password Auth ──────────────────────────────────────────────────

  const handleEmailAuth = async () => {
    if (!form.email || !form.password) {
      toast.error('Email and password required');
      return;
    }
    setLoading(true);
    try {
      const endpoint = '/user/auth'; 
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      
      if (res.status === 200 && data.success) {
        if (isSignUp) {
          toast.error('Account already exists. Please Sign In.');
          setIsSignUp(false);
        } else {
          login(data.user, data.token, data.user?.wallet_address || null, 'user');
          toast.success('Logged in successfully!');
        }
        return;
      }
      
      if (res.status === 202 && data.success) {
        if (isSignUp) {
          setOtpSent(true);
          toast.success('OTP sent to ' + form.email);
        } else {
          toast.error('Account not found. Please Sign Up.');
          setIsSignUp(true);
        }
        return;
      }
      
      throw new Error(data.message || 'Authentication failed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      toast.success('Account created successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Social Auth ─────────────────────────────────────────────────────────

  const handleGoogleAuth = async () => {
    console.log("Initiating Google Auth... Mock Mode:", isMockFirebase);
    setLoading(true);
    try {
      let googleUser;
      
      if (isMockFirebase) {
        console.log("Using Mock Firebase Bypass");
        // Mock Google login bypass
        googleUser = {
          email: 'mock.user@gmail.com',
          displayName: 'Mock Google User',
          uid: 'mock_google_uid_' + Date.now()
        };
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
      } else {
        console.log("Using Real Firebase signInWithPopup");
        const result = await signInWithPopup(auth, googleProvider);
        googleUser = result.user;
      }
      
      console.log("Google User obtained:", googleUser.email);

      const res = await fetch(`${API_BASE}/user/auth-google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: googleUser.email, 
          name: googleUser.displayName, 
          uid: googleUser.uid 
        }),
      });
      
      console.log("Backend response status:", res.status);
      const data = await res.json();
      
      if (!data.success) {
        console.error("Backend Auth Error:", data.message);
        throw new Error(data.message || 'Google auth failed');
      }
      
      console.log("Auth successful, logging in user:", data.user?.email);
      login(data.user, data.token, data.user?.wallet_address || null, 'user');
      toast.success(isMockFirebase ? 'Logged in via Mock Google' : 'Google authentication successful!');
    } catch (err) {
      console.error("Critical Google Auth Error:", err);
      toast.error(err.message || "Failed to authenticate with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleMetaMaskAuth = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not detected! Please install the extension.');
      return;
    }
    setLoading(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];
      
      const res = await fetch(`${API_BASE}/user/auth-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      const data = await res.json();
      
      if (!data.success) throw new Error(data.message || 'Wallet auth failed');
      
      login(data.user, data.token, walletAddress, 'user');
      toast.success('MetaMask connected!');
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
      {loading && <Loader fullScreen text={otpSent ? 'Verifying...' : 'Authenticating...'} />}

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
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
            {isSignUp ? 'Initialize Node' : 'Access Network'}
          </h2>

          {/* Sign In / Sign Up Tabs */}
          <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '2px solid var(--border)' }}>
            <button
              onClick={() => { setIsSignUp(false); setOtpSent(false); }}
              style={{
                flex: 1,
                padding: '12px',
                background: 'transparent',
                color: !isSignUp ? 'var(--primary)' : 'var(--muted)',
                border: 'none',
                borderBottom: !isSignUp ? '3px solid var(--primary)' : 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              SIGN IN
            </button>
            <button
              onClick={() => { setIsSignUp(true); setOtpSent(false); }}
              style={{
                flex: 1,
                padding: '12px',
                background: 'transparent',
                color: isSignUp ? 'var(--primary)' : 'var(--muted)',
                border: 'none',
                borderBottom: isSignUp ? '3px solid var(--primary)' : 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              SIGN UP
            </button>
          </div>

          <div>
            {otpSent ? (
              <>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                  6-digit security string sent to <strong style={{ color: 'var(--primary)' }}>{form.email}</strong>
                </p>
                <input
                  type="text"
                  placeholder="ENTER OTP"
                  maxLength={6}
                  value={form.otp}
                  onChange={e => setForm({ ...form, otp: e.target.value })}
                  style={inputStyle}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                />
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || form.otp.length !== 6}
                  style={btnStyle(loading || form.otp.length !== 6)}
                >
                  {loading ? 'VERIFYING...' : 'FINALIZE SIGNUP'}
                </button>
                <button
                  onClick={() => setOtpSent(false)}
                  style={{ ...btnStyle(false), background: 'var(--surface)', color: 'var(--text)', border: '2px solid var(--border)' }}
                >
                  ← BACK
                </button>
              </>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                />
                <input
                  type="password"
                  placeholder="PASSWORD"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={inputStyle}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                />
                <button
                  onClick={handleEmailAuth}
                  disabled={loading || !form.email || !form.password}
                  style={btnStyle(loading || !form.email || !form.password)}
                >
                  {loading ? 'PROCESSING...' : isSignUp ? 'REQUEST OTP' : 'LOGIN'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', gap: '10px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                  <span style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '2px' }}>OR CONNECT WITH</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    onClick={handleGoogleAuth}
                    className="brutal-btn"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    <Icon.Google /> GOOGLE
                  </button>
                  <button
                    onClick={handleMetaMaskAuth}
                    className="brutal-btn"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    <Icon.Wallet /> METAMASK
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Admin Login Link */}
          <div style={{ marginTop: '3rem', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <a href="/admin" style={{ fontSize: '11px', color: 'var(--muted)', textDecoration: 'none', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 'bold' }}>
              ⚙️ Organization Access
            </a>
          </div>
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