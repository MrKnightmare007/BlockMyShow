import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api/v1';

const AuthPage = () => {
  const { login, setAuthError, error } = useAuth();
  const [activeTab, setActiveTab] = useState('email');
  const [authStep, setAuthStep] = useState('form'); // 'form' or 'otp'
  const [form, setForm] = useState({ email: '', password: '', name: '', otp: '' });
  const [loading, setLoading] = useState(false);

  // ============================================
  // EMAIL AUTHENTICATION (OTP-based signup)
  // ============================================
  
  const handleEmailSignup = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/signup/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          password: form.password, 
          name: form.name 
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to send OTP');
      
      setAuthStep('otp');
      setAuthError(null);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerifyOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/signup/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          otp: form.otp 
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to verify OTP');
      
      // Save private key info (user should note it down from email)
      if (data.privateKey) {
        console.log('Private Key (saved to email):', data.privateKey);
      }
      
      login(data.user, data.token, data.user.walletAddress);
      setAuthStep('form');
      setForm({ email: '', password: '', name: '', otp: '' });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EMAIL LOGIN (direct, no OTP)
  // ============================================
  
  const handleEmailLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          password: form.password 
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Login failed');
      
      login(data.user, data.token, data.user.walletAddress);
      setForm({ email: '', password: '', name: '', otp: '' });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // GOOGLE AUTHENTICATION (OTP-based signup)
  // ============================================
  
  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/signup/google/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          googleId: 'mock_google_id_' + Date.now(),
          name: form.name 
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to send OTP');
      
      setAuthStep('otp');
      setAuthError(null);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleVerifyOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/signup/google/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          otp: form.otp 
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to verify OTP');
      
      login(data.user, data.token, data.user.walletAddress);
      setAuthStep('form');
      setForm({ email: '', password: '', name: '', otp: '' });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // GOOGLE LOGIN (direct, no OTP)
  // ============================================
  
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email 
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Login failed');
      
      login(data.user, data.token, data.user.walletAddress);
      setForm({ email: '', password: '', name: '', otp: '' });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // METAMASK (connected from UI, no backend auth)
  // ============================================
  
  const handleMetaMaskAuth = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask to continue.');
      }
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No MetaMask accounts found');
      }
      
      const walletAddress = accounts[0];
      
      // Create mock user object for MetaMask
      const mockUser = {
        id: 'user_' + Date.now(),
        email: walletAddress,
        walletAddress: walletAddress,
        publicAddress: walletAddress,
        auth_method: 'metamask',
        role: 'user',
        profile: { name: 'MetaMask User' }
      };
      
      const mockToken = 'metamask_token_' + Date.now();
      login(mockUser, mockToken, walletAddress);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UI RENDERING
  // ============================================

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      minHeight: '100vh', 
      background: '#fafafa' 
    }}>
      {/* Left Panel - Branding */}
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
          <h1 style={{ 
            fontSize: '3rem', 
            fontFamily: 'Syne, sans-serif', 
            lineHeight: 1, 
            marginBottom: '2rem' 
          }}>
            NFT <span style={{ color: '#4a90e2' }}>Tickets</span><br/>
            Web3 <span style={{ color: '#4a90e2' }}>Events</span>
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
        <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>
          BlockMyShow © 2026
        </div>
      </div>

      {/* Right Panel - Authentication */}
      <div style={{ 
        padding: '3rem', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center' 
      }}>
        <div style={{ maxWidth: '400px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {authStep === 'otp' ? 'Verify OTP' : 'Welcome to BlockMyShow'}
          </h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2rem' }}>
            {authStep === 'otp' 
              ? 'Enter the 6-digit code sent to your email' 
              : 'Choose your preferred login method'}
          </p>

          {error && (
            <div style={{ 
              background: '#fee2e2', 
              color: '#dc2626', 
              padding: '12px', 
              marginBottom: '1rem', 
              fontSize: '12px', 
              border: '2px solid #dc2626',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          {/* Auth Method Tabs - Only show if not in OTP step */}
          {authStep === 'form' && (
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '1.5rem' 
            }}>
              {['email', 'google', 'metamask'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  disabled={loading}
                  style={{ 
                    flex: 1, 
                    padding: '10px 8px', 
                    border: activeTab === tab ? '2px solid #000' : '2px solid #ccc', 
                    background: activeTab === tab ? '#000' : '#fff', 
                    color: activeTab === tab ? '#fff' : '#000', 
                    cursor: loading ? 'not-allowed' : 'pointer', 
                    fontFamily: 'monospace', 
                    fontSize: '11px', 
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {tab === 'email' ? '📧' : tab === 'google' ? '🔵' : '🦊'} {tab.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {/* OTP Verification Step */}
          {authStep === 'otp' && (
            <div>
              <input 
                type="text" 
                placeholder="Enter 6-digit OTP" 
                value={form.otp} 
                onChange={e => setForm({ ...form, otp: e.target.value.slice(0, 6) })} 
                maxLength="6"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  marginBottom: '16px', 
                  border: '2px solid #ddd', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '20px',
                  letterSpacing: '4px',
                  textAlign: 'center'
                }} 
              />
              <button 
                onClick={() => {
                  if (activeTab === 'email') handleEmailVerifyOTP();
                  else if (activeTab === 'google') handleGoogleVerifyOTP();
                }} 
                disabled={loading || form.otp.length !== 6} 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: '#000', 
                  color: '#fff', 
                  border: '2px solid #000', 
                  cursor: loading || form.otp.length !== 6 ? 'not-allowed' : 'pointer', 
                  fontFamily: 'monospace', 
                  marginBottom: '8px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  opacity: loading || form.otp.length !== 6 ? 0.6 : 1
                }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button 
                onClick={() => {
                  setAuthStep('form');
                  setForm({ ...form, otp: '' });
                  setAuthError(null);
                }} 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: '#fff', 
                  color: '#000', 
                  border: '2px solid #ddd', 
                  cursor: 'pointer', 
                  fontFamily: 'monospace',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                Change Method
              </button>
            </div>
          )}

          {/* Email/Password Form */}
          {authStep === 'form' && activeTab === 'email' && (
            <div>
              <input 
                type="email" 
                placeholder="Email address" 
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  marginBottom: '12px', 
                  border: '2px solid #ddd', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1
                }} 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  marginBottom: '12px', 
                  border: '2px solid #ddd', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1
                }} 
              />
              <input 
                type="text" 
                placeholder="Full name (optional)" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  marginBottom: '16px', 
                  border: '2px solid #ddd', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1
                }} 
              />
              <button 
                onClick={handleEmailSignup} 
                disabled={loading || !form.email || !form.password} 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: '#000', 
                  color: '#fff', 
                  border: '2px solid #000', 
                  cursor: loading || !form.email || !form.password ? 'not-allowed' : 'pointer', 
                  fontFamily: 'monospace', 
                  marginBottom: '8px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  opacity: loading || !form.email || !form.password ? 0.6 : 1
                }}
              >
                {loading ? 'Sending OTP...' : 'Sign Up / Send OTP'}
              </button>
            </div>
          )}

          {/* Google Auth */}
          {authStep === 'form' && activeTab === 'google' && (
            <div>
              <input 
                type="email" 
                placeholder="Email address" 
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  marginBottom: '12px', 
                  border: '2px solid #ddd', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1
                }} 
              />
              <input 
                type="text" 
                placeholder="Full name (optional)" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  marginBottom: '16px', 
                  border: '2px solid #ddd', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1
                }} 
              />
              <button 
                onClick={handleGoogleSignup} 
                disabled={loading || !form.email} 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: '#4285F4', 
                  color: '#fff', 
                  border: '2px solid #4285F4', 
                  cursor: loading || !form.email ? 'not-allowed' : 'pointer', 
                  fontFamily: 'monospace', 
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  fontSize: '14px',
                  opacity: loading || !form.email ? 0.6 : 1
                }}
              >
                {loading ? 'Sending OTP...' : 'Sign Up / Send OTP'}
              </button>
            </div>
          )}

          {/* MetaMask Auth */}
          {authStep === 'form' && activeTab === 'metamask' && (
            <div>
              <button 
                onClick={handleMetaMaskAuth} 
                disabled={loading} 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: '#fff8f0', 
                  color: '#000', 
                  border: '2px solid #e2761b', 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  fontFamily: 'monospace', 
                  fontWeight: 'bold',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '12px',
                  opacity: loading ? 0.6 : 1
                }}
              >
                🦊 {loading ? 'Connecting...' : 'Connect MetaMask Wallet'}
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

export default AuthPage;