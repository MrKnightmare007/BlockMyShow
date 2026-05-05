import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const emptyForm = { email: '', password: '', username: '', otp: '' };

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, error, setAuthError } = useAuth();
  const [activeTab, setActiveTab] = useState('user');
  const [authStep, setAuthStep] = useState('form');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const completeUserLogin = (data) => {
    const walletAddr = data.wallet_address || data.user?.wallet_address || null;
    login(data.user, data.token, walletAddr, 'user');
    setAuthStep('form'); setForm(emptyForm);
    setTimeout(() => navigate('/'), 500);
  };

  const handleUserAuth = async () => {
    setLoading(true); setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/user/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Authentication failed');
      if (data.otpRequired) { setAuthStep('otp'); return; }
      completeUserLogin(data);
    } catch (err) { setAuthError(err.message); }
    finally { setLoading(false); }
  };

  const handleUserOtpVerify = async () => {
    setLoading(true); setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/user/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, otp: form.otp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'OTP verification failed');
      completeUserLogin(data);
    } catch (err) { setAuthError(err.message); }
    finally { setLoading(false); }
  };

  const handleAdminLogin = async () => {
    setLoading(true); setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Admin login failed');
      login(data.admin, data.token, null, 'admin');
      setForm(emptyForm); setAuthStep('form');
      setTimeout(() => navigate('/admin'), 500);
    } catch (err) { setAuthError(err.message); }
    finally { setLoading(false); }
  };

  const handleMetaMaskAuth = async () => {
    setLoading(true); setAuthError(null);
    try {
      if (!window.ethereum) throw new Error('MetaMask not installed');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts?.length) throw new Error('No MetaMask accounts found');
      const walletAddress = accounts[0];
      const mockUser = { id: `metamask_${Date.now()}`, wallet_address: walletAddress, auth_method: 'metamask' };
      login(mockUser, `metamask_token_${Date.now()}`, walletAddress, 'user');
      setTimeout(() => navigate('/'), 500);
    } catch (err) { setAuthError(err.message); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 dark-transition">
      <div className="w-full max-w-md animate-slideUp">
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Hero top */}
          <div className="hero-gradient p-8 text-center">
            <div className="text-5xl mb-2">🎫</div>
            <h1 className="text-2xl font-bold text-white">BlockMyShow</h1>
            <p className="text-white/80 text-sm mt-1">NFT-Powered Event Ticketing</p>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Tabs */}
            <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1 mb-6">
              {['user', 'admin'].map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab); setAuthStep('form'); setForm(emptyForm); setAuthError(null); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}>
                  {tab === 'user' ? '🙋 Attendee' : '⚙️ Admin'}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            {/* User Tab */}
            {activeTab === 'user' && authStep === 'form' && (
              <div className="space-y-3">
                <input type="email" placeholder="Email address" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className={inputCls} />
                <input type="password" placeholder="Password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleUserAuth()}
                  className={inputCls} />
                <button onClick={handleUserAuth} disabled={loading}
                  className="w-full py-3 bms-button rounded-xl text-base font-bold disabled:opacity-50">
                  {loading ? 'Processing...' : 'Login / Sign Up'}
                </button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-600" /></div>
                  <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-800 px-3 text-xs text-gray-400">OR</span></div>
                </div>
                <button onClick={handleMetaMaskAuth} disabled={loading}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                  🦊 Continue with MetaMask
                </button>
              </div>
            )}

            {activeTab === 'user' && authStep === 'otp' && (
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-xl text-sm">
                  OTP sent to <strong>{form.email}</strong>
                </div>
                <input type="text" placeholder="Enter 6-digit OTP" value={form.otp}
                  onChange={e => setForm({ ...form, otp: e.target.value.slice(0, 6) })}
                  maxLength="6"
                  className={`${inputCls} text-center text-2xl tracking-widest`} />
                <button onClick={handleUserOtpVerify} disabled={loading}
                  className="w-full py-3 bms-button rounded-xl text-base font-bold disabled:opacity-50">
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button onClick={() => { setAuthStep('form'); setForm({ ...form, otp: '' }); }}
                  className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Back
                </button>
              </div>
            )}

            {/* Admin Tab */}
            {activeTab === 'admin' && (
              <div className="space-y-3">
                <input type="text" placeholder="Admin username" value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className={inputCls} />
                <input type="password" placeholder="Password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                  className={inputCls} />
                <button onClick={handleAdminLogin} disabled={loading}
                  className="w-full py-3 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-base font-bold transition-colors disabled:opacity-50">
                  {loading ? 'Logging in...' : '⚙️ Admin Login'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
