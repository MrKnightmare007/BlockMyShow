import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { login, isAuthenticated, error, setAuthError } = useAuth();
  const [activeTab, setActiveTab] = useState('user');
  const [authStep, setAuthStep] = useState('form');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const resolveWalletAddress = (data) => {
    return data.wallet_address || data.user?.wallet_address || data.user?.walletAddress || null;
  };

  const completeUserLogin = (data) => {
    const walletAddr = resolveWalletAddress(data);
    login(data.user, data.token, walletAddr, 'user');
    setAuthStep('form');
    setForm(emptyForm);
    // Redirect happens via useEffect watching isAuthenticated
    setTimeout(() => navigate('/'), 500);
  };

  const handleUserAuth = async () => {
    setLoading(true);
    setAuthError(null);

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

      // Login successful
      completeUserLogin(data);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserOtpVerify = async () => {
    setLoading(true);
    setAuthError(null);

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

      // OTP verified and signup complete
      completeUserLogin(data);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    setAuthError(null);

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
      setAuthStep('form');
      // Redirect admin to dashboard or admin panel
      setTimeout(() => navigate('/admin'), 500);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMetaMaskAuth = async () => {
    setLoading(true);
    setAuthError(null);

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
      setTimeout(() => navigate('/'), 500);
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
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ maxWidth: '500px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontFamily: 'Syne, sans-serif', margin: '0 0 0.5rem 0' }}>
            🎫 BlockMyShow
          </h1>
          <p style={{ color: '#666', margin: 0 }}>NFT-Powered Event Ticketing</p>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '2rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          {['user', 'admin'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setAuthStep('form');
                setForm(emptyForm);
                setAuthError(null);
              }}
              style={{
                flex: 1,
                padding: '12px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid #000' : 'none',
                fontSize: '1rem',
                fontWeight: activeTab === tab ? '700' : '500',
                cursor: 'pointer',
                color: activeTab === tab ? '#000' : '#999',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'user' ? 'Attendee' : 'Admin'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {/* User Auth Tab */}
        {activeTab === 'user' && (
          <div>
            {authStep === 'form' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <button
                  onClick={handleUserAuth}
                  disabled={loading}
                  style={{
                    padding: '12px',
                    background: loading ? '#ccc' : '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Loading...' : 'Login / Sign Up'}
                </button>

                <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                  <button
                    onClick={handleMetaMaskAuth}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f97316',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    🦊 MetaMask
                  </button>
                  <button
                    onClick={handleGoogleAuth}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#ddd',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    🔵 Google
                  </button>
                </div>
              </div>
            )}

            {authStep === 'otp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Enter OTP sent to <strong>{form.email}</strong>
                </p>
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value.slice(0, 6) })}
                  maxLength="6"
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <button
                  onClick={handleUserOtpVerify}
                  disabled={loading}
                  style={{
                    padding: '12px',
                    background: loading ? '#ccc' : '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  onClick={() => {
                    setAuthStep('form');
                    setForm({ ...form, otp: '' });
                  }}
                  style={{
                    padding: '12px',
                    background: '#f3f4f6',
                    color: '#000',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
              </div>
            )}
          </div>
        )}

        {/* Admin Auth Tab */}
        {activeTab === 'admin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Admin username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              style={{
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
            <button
              onClick={handleAdminLogin}
              disabled={loading}
              style={{
                padding: '12px',
                background: loading ? '#ccc' : '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Loading...' : 'Admin Login'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
