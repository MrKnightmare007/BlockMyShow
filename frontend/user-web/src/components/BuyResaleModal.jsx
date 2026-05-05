import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import API_BASE from '../utils/api';

/**
 * BuyResaleModal
 *
 * Props:
 *   listing   — object with: token_id, list_price, sale_price, event: { title, venue, date }
 *   token     — JWT bearer token
 *   onClose   — close callback
 *   onSuccess — called after successful purchase (before redirect)
 *
 * Step flow: identity → payment → otp → success
 */
const BuyResaleModal = ({ listing, token, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep]             = useState('identity');
  const [buyerIdentity, setBuyerIdentity] = useState('');
  const [otp, setOtp]               = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [resultData, setResultData] = useState(null);

  if (!listing) return null;

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const tokenId    = listing.token_id ?? listing.tokenId;
  const listPrice  = Number(listing.list_price ?? listing.listPrice ?? listing.price ?? 0);
  const salePrice  = Number(listing.sale_price ?? listing.salePrice ?? 0);
  const eventTitle = listing.event?.title ?? listing.title ?? 'Event';
  const eventVenue = listing.event?.venue ?? listing.venue ?? 'TBA';

  const formatDate = (val) => {
    if (!val) return 'TBA';
    const unix = Number(val);
    // Unix timestamp (seconds)
    if (Number.isFinite(unix) && unix > 1e9) {
      return new Date(unix * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    // ISO string
    return new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const dateStr = formatDate(listing.event?.date ?? listing.date);

  // Step 1 → 2: identity validation (local only)
  const handleIdentityNext = () => {
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
      const res  = await fetch(`${API_BASE}/tickets/buy-resale/request`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ tokenId: String(tokenId), buyerIdentity }),
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
    if (otp.length !== 6) { setError('Enter 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_BASE}/tickets/buy-resale/confirm`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ tokenId: String(tokenId), buyerIdentity, otp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Invalid OTP');
      setResultData(data);
      setStep('success');
      if (onSuccess) onSuccess(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const STEP_LABELS = ['ID', 'PAY', 'OTP'];
  const stepIdx = ['identity', 'payment', 'otp'].indexOf(step);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '3px solid var(--border)', boxShadow: '8px 8px 0 var(--border)', maxWidth: '460px', width: '100%' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '3px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: '15px', textTransform: 'uppercase' }}>
            🏷️ Buy Resale Ticket
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '18px' }}>✕</button>
        </div>

        {/* Ticket info bar */}
        <div style={{ padding: '10px 20px', borderBottom: '2px solid var(--border)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: 'Space Mono, monospace' }}>
          <span style={{ color: 'var(--text)', fontWeight: 'bold' }}>{eventTitle}</span>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{listPrice.toLocaleString('en-IN')}</span>
        </div>

        {/* Step indicator */}
        {step !== 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px 0', gap: '0' }}>
            {STEP_LABELS.map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '28px', height: '28px', border: '2px solid var(--border)',
                  background: i < stepIdx ? 'var(--primary)' : i === stepIdx ? 'var(--border)' : 'transparent',
                  color: i < stepIdx ? '#000' : i === stepIdx ? 'var(--surface)' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 'bold', fontFamily: 'Space Mono, monospace',
                }}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: '9px', color: i === stepIdx ? 'var(--text)' : 'var(--muted)', marginLeft: '4px', fontFamily: 'Space Mono, monospace' }}>
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
                Enter your 12-digit Aadhaar / identity number. An OTP will be sent to verify.
              </p>
              <input
                type="text" inputMode="numeric"
                placeholder="Enter 12-digit Identity ID"
                value={buyerIdentity}
                onChange={e => { setBuyerIdentity(e.target.value.replace(/\D/g, '').slice(0, 12)); setError(''); }}
                maxLength={12}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '2px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'Space Mono, monospace', fontSize: '18px', letterSpacing: '4px', textAlign: 'center', boxSizing: 'border-box' }}
              />
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
                  ['Ticket', `Token #${tokenId}`],
                  ['Event', eventTitle],
                  ['Venue', eventVenue],
                  ['Date', dateStr],
                  ['Identity ID', buyerIdentity],
                  ...(salePrice > 0 ? [['Original Price', `₹${salePrice.toLocaleString('en-IN')}`]] : []),
                  ['Resale Price', `₹${listPrice.toLocaleString('en-IN')}`],
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
                  {loading ? 'Sending OTP…' : `Pay ₹${listPrice.toLocaleString('en-IN')} & Get OTP`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: OTP */}
          {step === 'otp' && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Step 3: Verify OTP</h4>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px', fontFamily: 'Space Mono, monospace', lineHeight: 1.5 }}>
                OTP sent to your registered phone. Enter it below to complete the purchase.
              </p>
              <input
                type="text" inputMode="numeric"
                placeholder="• • • • • •"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                maxLength={6} autoFocus
                style={{ width: '100%', padding: '14px', marginBottom: '10px', border: '2px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'Space Mono, monospace', fontSize: '28px', letterSpacing: '12px', textAlign: 'center', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', marginBottom: '18px', fontFamily: 'Space Mono, monospace' }}>
                Testing OTP: <strong style={{ color: 'var(--primary)' }}>123456</strong>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setStep('payment'); setOtp(''); setError(''); }} style={{ flex: 1, padding: '12px', background: 'transparent', border: '2px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>← Back</button>
                <button onClick={handleOTPConfirm} disabled={loading || otp.length !== 6} className="brutal-btn"
                  style={{ flex: 2, padding: '12px', fontSize: '13px', opacity: (loading || otp.length !== 6) ? 0.5 : 1, cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer' }}>
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
              <button onClick={() => { onClose(); navigate('/tickets'); }} className="brutal-btn" style={{ width: '100%', padding: '13px', fontSize: '13px' }}>
                View My Tickets →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyResaleModal;
