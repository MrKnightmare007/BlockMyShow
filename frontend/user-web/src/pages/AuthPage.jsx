import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const emptyForm = {
  email: '',
  password: '',
  username: '',
  name: '',
  otp: ''
};

const AuthPage = () => {
  const { login, setAuthError, error } = useAuth();
  const [activeTab, setActiveTab] = useState('user');
  const [authStep, setAuthStep] = useState('form');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const resolveWalletAddress = (data) => {
    return data.wallet_address || data.user?.wallet_address || data.user?.walletAddress || null;
  };

  const completeUserLogin = (data) => {
    login(data.user, data.token, resolveWalletAddress(data), 'user');
    setAuthStep('form');
    setForm(emptyForm);
  };

  const handleUserAuth = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/user/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || data.error || 'Authentication failed');
      }

      if (data.otpRequired) {
        setAuthStep('otp');
        setAuthError(null);
        return;
      }

      completeUserLogin(data);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserOtpVerify = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/user/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          otp: form.otp
        })
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || data.error || 'Failed to verify OTP');
      }

      completeUserLogin(data);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password
        })
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || data.error || 'Admin login failed');
      }

      login(data.admin, data.token, null, 'admin');
      setForm(emptyForm);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      const mockUser = {
        id: `metamask_${Date.now()}`,
        email: walletAddress,
        wallet_address: walletAddress,
        auth_method: 'metamask'
      };

      login(mockUser, `metamask_token_${Date.now()}`, walletAddress, 'user');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('Google sign-in is kept in the UI for now and will be wired after backend support.');
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      minHeight: '100vh',
      background: '#fafafa'
    }}>
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

          {authStep === 'form' && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '1.5rem'
            }}>
              {['user', 'admin', 'google', 'metamask'].map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setAuthError(null);
                  }}
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
                  {tab === 'user' ? '📧' : tab === 'admin' ? '🛠' : tab === 'google' ? '🔵' : '🦊'} {tab.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {authStep === 'otp' && (
            <div>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={form.otp}
                onChange={e => setForm({ ...form, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
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
                onClick={handleUserOtpVerify}
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

          {authStep === 'form' && activeTab === 'user' && (
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
                  marginBottom: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1
                }}
              />
              <button
                onClick={handleUserAuth}
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
                {loading ? 'Checking...' : 'Login / Signup'}
              </button>
            </div>
          )}

          {authStep === 'form' && activeTab === 'admin' && (
            <div>
              <input
                type="text"
                placeholder="Admin username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
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
                  marginBottom: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1
                }}
              />
              <button
                onClick={handleAdminLogin}
                disabled={loading || !form.username || !form.password}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#000',
                  color: '#fff',
                  border: '2px solid #000',
                  cursor: loading || !form.username || !form.password ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace',
                  marginBottom: '8px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  opacity: loading || !form.username || !form.password ? 0.6 : 1
                }}
              >
                {loading ? 'Signing in...' : 'Admin Login'}
              </button>
            </div>
          )}

          {authStep === 'form' && activeTab === 'google' && (
            <div>
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#4285F4',
                  color: '#fff',
                  border: '2px solid #4285F4',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1
                }}
              >
                Continue with Google
              </button>
            </div>
          )}

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
