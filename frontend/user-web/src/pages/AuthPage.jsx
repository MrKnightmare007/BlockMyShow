import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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

const AuthPage = () => {
  const { login, setAuthError, error } = useAuth();
  const [activeTab, setActiveTab] = useState('email');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (isSignup) => {
    setLoading(true);
    try {
      const endpoint = isSignup ? '/auth/login' : '/auth/login';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          password: form.password, 
          ...(isSignup && { name: form.name }) 
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Auth failed');
      
      // Backend returns user, token, and wallet address
      login(data.user, data.token, data.user.wallet);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      // Mock Google OAuth - in real implementation, use Firebase Auth
      const mockGoogleUser = {
        email: 'user@gmail.com',
        name: 'Google User',
        wallet: '0x' + Math.random().toString(16).substr(2, 40)
      };
      
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: mockGoogleUser.email, 
          password: 'google_auth_' + Date.now(),
          name: mockGoogleUser.name,
          authType: 'google'
        }),
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Google auth failed');
      
      login(data.user, data.token, data.user.wallet);
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
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No MetaMask accounts found');
      }
      
      const walletAddress = accounts[0];
      
      // Create account with MetaMask address
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: `${walletAddress}@metamask.local`,
          password: 'metamask_auth_' + Date.now(),
          name: `MetaMask User`,
          authType: 'metamask',
          walletAddress: walletAddress
        }),
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'MetaMask auth failed');
      
      login(data.user, data.token, walletAddress);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
            Welcome to BlockMyShow
          </h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Choose your preferred login method
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

          {/* Auth Method Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '1.5rem' 
          }}>
            {['email', 'google', 'metamask'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                style={{ 
                  flex: 1, 
                  padding: '10px 8px', 
                  border: activeTab === tab ? '2px solid #000' : '2px solid #ccc', 
                  background: activeTab === tab ? '#000' : '#fff', 
                  color: activeTab === tab ? '#fff' : '#000', 
                  cursor: 'pointer', 
                  fontFamily: 'monospace', 
                  fontSize: '11px', 
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'email' ? '📧' : tab === 'google' ? '🔵' : '🦊'} {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Email/Password Form */}
          {activeTab === 'email' && (
            <div>
              <input 
                type="email" 
                placeholder="Email address" 
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  marginBottom: '12px', 
                  border: '2px solid #ddd', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }} 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  marginBottom: '12px', 
                  border: '2px solid #ddd', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }} 
              />
              <input 
                type="text" 
                placeholder="Full name (optional)" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  marginBottom: '16px', 
                  border: '2px solid #ddd', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }} 
              />
              <button 
                onClick={() => handleEmailAuth(true)} 
                disabled={loading || !form.email || !form.password} 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: '#000', 
                  color: '#fff', 
                  border: '2px solid #000', 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  fontFamily: 'monospace', 
                  marginBottom: '8px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  opacity: loading || !form.email || !form.password ? 0.6 : 1
                }}
              >
                {loading ? 'Creating Account...' : 'Sign Up / Login'}
              </button>
              <p style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
                New users will be automatically registered
              </p>
            </div>
          )}

          {/* Google OAuth */}
          {activeTab === 'google' && (
            <button 
              onClick={handleGoogleAuth} 
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: '#fff', 
                color: '#000', 
                border: '2px solid #4285F4', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                fontFamily: 'monospace', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                borderRadius: '4px',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              <Icon.Google /> 
              {loading ? 'Connecting...' : 'Continue with Google'}
            </button>
          )}

          {/* MetaMask */}
          {activeTab === 'metamask' && (
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