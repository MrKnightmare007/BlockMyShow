import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:5000/api';

const GRADIENT_COLORS = [
  'linear-gradient(135deg, #31bbaf 0%, #0a0a0a 100%)',
  'linear-gradient(135deg, #4a90e2 0%, #0a0a0a 100%)',
  'linear-gradient(135deg, #ec4899 0%, #0a0a0a 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #0a0a0a 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #0a0a0a 100%)',
];

const formatDate = (unix) => {
  if (!unix) return 'TBA';
  return new Date(Number(unix) * 1000).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

// ── Buy Resale Modal  ──────────────────────────────────────────────────────
// Steps:  identity → payment → otp → success
const BuyResaleModal = ({ listing, onClose, token, onSuccess }) => {
  const [step, setStep]               = useState('identity'); // identity | payment | otp | success
  const [buyerIdentity, setBuyerIdentity] = useState('');
  const [otp, setOtp]                 = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [resultData, setResultData]   = useState(null);

  if (!listing) return null;

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Step 1 → 2: verify identity exists → show payment confirmation
  const handleIdentityNext = async () => {
    if (!buyerIdentity || buyerIdentity.length < 6) {
      setError('Enter a valid Identity ID (min 6 digits)');
      return;
    }
    setError('');
    setStep('payment');
  };

  // Step 2 → 3: POST /api/tickets/buy-resale/request
  const handlePaymentConfirm = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/tickets/buy-resale/request`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ tokenId: String(listing.token_id), buyerIdentity }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Request failed');
      toast.success('OTP sent to your registered number!');
      setStep('otp');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 → 4: POST /api/tickets/buy-resale/confirm
  const handleOTPConfirm = async () => {
    if (!otp || otp.length !== 6) { setError('Enter 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/tickets/buy-resale/confirm`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ tokenId: String(listing.token_id), buyerIdentity, otp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Invalid OTP');
      setResultData(data);
      setStep('success');
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ['identity', 'payment', 'otp', 'success'];
  const stepIdx = STEPS.indexOf(step);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '3px solid var(--border)', boxShadow: '8px 8px 0 var(--border)', maxWidth: '460px', width: '100%' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '3px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: '15px', textTransform: 'uppercase' }}>
            Buy Resale Ticket
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '18px' }}>✕</button>
        </div>

        {/* Ticket info bar */}
        <div style={{ padding: '10px 20px', borderBottom: '2px solid var(--border)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: 'Space Mono, monospace' }}>
          <span style={{ color: 'var(--text)', fontWeight: 'bold' }}>{listing.event?.title || 'Event'}</span>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{Number(listing.list_price).toLocaleString('en-IN')}</span>
        </div>

        {/* Step indicator */}
        {step !== 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px 0', gap: '0' }}>
            {['ID', 'PAY', 'OTP'].map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '28px', height: '28px',
                  border: '2px solid var(--border)',
                  background: i < stepIdx ? 'var(--primary)' : i === stepIdx ? 'var(--border)' : 'transparent',
                  color: i <= stepIdx ? (i < stepIdx ? '#000' : 'var(--surface)') : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 'bold', fontFamily: 'Space Mono, monospace',
                }}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: '9px', color: i === stepIdx ? 'var(--text)' : 'var(--muted)', marginLeft: '4px', fontFamily: 'Space Mono, monospace', marginRight: i < 2 ? '0' : '0' }}>
                  {label}
                </div>
                {i < 2 && <div style={{ width: '24px', height: '2px', background: i < stepIdx ? 'var(--primary)' : 'var(--border)', margin: '0 6px' }} />}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{ background: '#1a0000', color: '#ff4444', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', border: '2px solid #ff4444', fontFamily: 'Space Mono, monospace' }}>
              ⚠ {error}
            </div>
          )}

          {/* STEP 1: Identity */}
          {step === 'identity' && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Step 1: Your Identity ID</h4>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px', fontFamily: 'Space Mono, monospace', lineHeight: 1.5 }}>
                Enter your 12-digit Aadhaar / identity number. OTP will be sent to your registered phone.
              </p>
              <input
                type="text" inputMode="numeric"
                placeholder="Enter 12-digit Identity ID"
                value={buyerIdentity}
                onChange={e => { setBuyerIdentity(e.target.value.replace(/\D/g, '').slice(0, 12)); setError(''); }}
                maxLength={12}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '2px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'Space Mono, monospace', fontSize: '18px', letterSpacing: '4px', textAlign: 'center', boxSizing: 'border-box' }}
              />
              {/* Test hint */}
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px', padding: '10px 14px', border: '2px dashed var(--border)', background: 'var(--bg)', fontFamily: 'Space Mono, monospace', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--text)' }}>For testing:</strong><br />
                • <span style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }} onClick={() => setBuyerIdentity('111111111111')}>111111111111</span> — Rajesh Kumar<br />
                • <span style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }} onClick={() => setBuyerIdentity('222222222222')}>222222222222</span> — Priya Singh
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '2px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>Cancel</button>
                <button onClick={handleIdentityNext} disabled={buyerIdentity.length < 6} className="brutal-btn"
                  style={{ flex: 2, padding: '12px', fontSize: '13px', opacity: buyerIdentity.length < 6 ? 0.5 : 1, cursor: buyerIdentity.length < 6 ? 'not-allowed' : 'pointer' }}>
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Payment confirmation */}
          {step === 'payment' && (
            <div>
              <h4 style={{ margin: '0 0 16px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Step 2: Confirm Payment</h4>
              <div style={{ border: '2px solid var(--border)', background: 'var(--bg)', marginBottom: '20px', fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>
                {[
                  ['Ticket', `Token #${listing.token_id}`],
                  ['Event', listing.event?.title || 'N/A'],
                  ['Venue', listing.event?.venue || 'N/A'],
                  ['Date', formatDate(listing.event?.date)],
                  ['Identity ID', buyerIdentity],
                  ['Original Price', `₹${Number(listing.sale_price || 0).toLocaleString('en-IN')}`],
                  ['Resale Price', `₹${Number(listing.list_price).toLocaleString('en-IN')}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', padding: '8px 14px', borderBottom: '1px solid var(--border)', gap: '12px' }}>
                    <span style={{ color: 'var(--muted)', minWidth: '100px', fontSize: '11px', textTransform: 'uppercase' }}>{k}</span>
                    <span style={{ color: k === 'Resale Price' ? 'var(--primary)' : 'var(--text)', fontWeight: 'bold' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '12px', color: '#f59e0b', border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.08)', padding: '10px 14px', marginBottom: '20px', fontFamily: 'Space Mono, monospace' }}>
                ⚠ Clicking "Pay & Get OTP" will initiate the purchase. An OTP will be sent to verify your identity.
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep('identity')} style={{ flex: 1, padding: '12px', background: 'transparent', border: '2px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>← Back</button>
                <button onClick={handlePaymentConfirm} disabled={loading} className="brutal-btn"
                  style={{ flex: 2, padding: '12px', fontSize: '13px', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Sending OTP…' : `Pay ₹${Number(listing.list_price).toLocaleString('en-IN')} & Get OTP`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: OTP */}
          {step === 'otp' && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Step 3: Enter OTP</h4>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px', fontFamily: 'Space Mono, monospace', lineHeight: 1.5 }}>
                OTP sent to your registered phone. Enter it below to complete the purchase.
              </p>
              <input
                type="text" inputMode="numeric"
                placeholder="• • • • • •"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                maxLength={6}
                autoFocus
                style={{ width: '100%', padding: '14px', marginBottom: '10px', border: '2px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'Space Mono, monospace', fontSize: '28px', letterSpacing: '12px', textAlign: 'center', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', marginBottom: '18px', fontFamily: 'Space Mono, monospace' }}>
                Testing OTP: <strong style={{ color: 'var(--primary)' }}>123456</strong>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setStep('payment'); setOtp(''); setError(''); }} style={{ flex: 1, padding: '12px', background: 'transparent', border: '2px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>← Back</button>
                <button onClick={handleOTPConfirm} disabled={loading || otp.length !== 6} className="brutal-btn"
                  style={{ flex: 2, padding: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (loading || otp.length !== 6) ? 0.5 : 1, cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Confirming…' : '✅ Confirm Purchase'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ width: '72px', height: '72px', margin: '0 auto 20px', background: 'var(--primary)', border: '3px solid var(--border)', boxShadow: '4px 4px 0 var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                🎫
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', fontSize: '20px', margin: '0 0 10px', color: 'var(--primary)' }}>
                Purchase Complete!
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px', fontFamily: 'Space Mono, monospace', lineHeight: 1.6 }}>
                Your NFT ticket has been transferred to your wallet.
                {resultData?.token_id !== undefined && (
                  <><br />Token ID: <strong style={{ color: 'var(--text)' }}>#{resultData.token_id}</strong></>
                )}
              </p>
              <button onClick={onClose} className="brutal-btn" style={{ width: '100%', padding: '13px', fontSize: '13px' }}>
                View My Tickets →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [buyListing, setBuyListing] = useState(null);

  const fetchMarketplace = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_BASE}/tickets/marketplace`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load');
      setListings(data.tickets || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMarketplace(); }, []);

  const handleBuySuccess = () => {
    fetchMarketplace();
    setTimeout(() => { navigate('/tickets'); }, 2500);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--bg)', padding: '40px 20px' }}>
      <style>{`.fade-in{animation:fadeIn .2s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', borderBottom: '3px solid var(--border)', paddingBottom: '18px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.2rem', margin: '0 0 6px', textTransform: 'uppercase' }}>
              🏷️ Resale Marketplace
            </h1>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '13px', fontFamily: 'Space Mono, monospace' }}>
              {listings.length} verified resale ticket{listings.length !== 1 ? 's' : ''} — secured by identity verification
            </p>
          </div>
          <button onClick={fetchMarketplace} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: 'bold' }}>
            ↻ Refresh
          </button>
        </div>

        {/* States */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {[1, 2, 3].map(i => <div key={i} className="brutal-card" style={{ height: '220px', opacity: 0.4 }} />)}
          </div>
        )}

        {error && (
          <div className="brutal-card" style={{ textAlign: 'center', padding: '3rem', color: '#ef4444', fontFamily: 'Space Mono, monospace' }}>
            ⚠ {error}
            <br /><button onClick={fetchMarketplace} className="brutal-btn" style={{ marginTop: '16px', padding: '10px 24px', fontSize: '13px' }}>Retry</button>
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="brutal-card fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏷️</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', margin: '0 0 8px' }}>No Resale Listings</h3>
            <p style={{ fontSize: '13px', fontFamily: 'Space Mono, monospace', marginBottom: '20px' }}>No tickets listed for resale right now. Check back later!</p>
            <button onClick={() => navigate('/')} className="brutal-btn" style={{ padding: '12px 24px', fontSize: '13px' }}>Browse Events →</button>
          </div>
        )}

        {/* Listing Grid */}
        {!loading && !error && listings.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {listings.map((listing, idx) => {
              const gradient = GRADIENT_COLORS[idx % GRADIENT_COLORS.length];
              const dateStr  = formatDate(listing.event?.date);
              const isBelow  = Number(listing.list_price) < Number(listing.sale_price);

              return (
                <div key={listing.token_id} className="brutal-card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Banner */}
                  <div style={{ height: '120px', background: gradient, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '14px', position: 'relative', borderBottom: '3px solid var(--border)' }}>
                    {isBelow && (
                      <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--primary)', color: '#000', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', border: '2px solid var(--border)', fontFamily: 'Space Mono, monospace' }}>
                        ↓ BELOW FACE VALUE
                      </div>
                    )}
                    <h3 style={{ margin: 0, color: '#fff', fontFamily: 'Syne, sans-serif', fontSize: '16px', textTransform: 'uppercase', textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                      {listing.event?.title || 'Event'}
                    </h3>
                  </div>

                  {/* Details */}
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', marginBottom: '12px', lineHeight: 1.8 }}>
                      <div>📅 {dateStr}</div>
                      <div>📍 {listing.event?.venue || 'TBA'}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: '2px' }}>Resale Price</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)', fontFamily: 'Space Mono, monospace' }}>
                          ₹{Number(listing.list_price).toLocaleString('en-IN')}
                        </div>
                        {listing.sale_price && (
                          <div style={{ fontSize: '11px', color: 'var(--muted)', textDecoration: 'line-through', fontFamily: 'Space Mono, monospace' }}>
                            ₹{Number(listing.sale_price).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', fontFamily: 'Space Mono, monospace' }}>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Token</div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text)' }}>#{listing.token_id}</div>
                      </div>
                    </div>

                    {isAuthenticated ? (
                      <button
                        className="brutal-btn"
                        onClick={() => setBuyListing(listing)}
                        style={{ width: '100%', padding: '12px', fontSize: '13px' }}
                      >
                        Buy for ₹{Number(listing.list_price).toLocaleString('en-IN')} →
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/')}
                        style={{ width: '100%', padding: '12px', fontSize: '13px', background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontWeight: 'bold' }}
                      >
                        Login to Buy
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Buy Modal */}
      {buyListing && (
        <BuyResaleModal
          listing={buyListing}
          token={token}
          onClose={() => setBuyListing(null)}
          onSuccess={handleBuySuccess}
        />
      )}
    </div>
  );
}
