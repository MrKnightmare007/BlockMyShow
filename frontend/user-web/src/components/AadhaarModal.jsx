import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

// Icons
const Icon = {
  X: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Ticket: () => (
    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"/>
    </svg>
  ),
};

// Mock Aadhaar registry — kept for the UI preview card only (backend has its own registry)
const MOCK_AADHAAR_REGISTRY = {
  '111111111111': { name: 'RAJESH KUMAR', phone: '+91-9876543210', color: '#4a90e2' },
  '222222222222': { name: 'PRIYA SINGH',  phone: '+91-8765432109', color: '#ec4899' },
};

/**
 * AadhaarModal
 *
 * Step 1 → POST /api/tickets/request  { event_id, identity_id }
 *          Backend validates identity_id (Aadhaar) and sends OTP to registered phone.
 *
 * Step 2 → POST /api/tickets/confirm  { event_id, identity_id, otp }
 *          Backend mints the NFT ticket on success.
 *
 * On success: calls onBookingComplete(result) and closes.
 */
const AadhaarModal = ({ isOpen, onClose, onBookingComplete, event }) => {
  const { token } = useAuth();

  const [step, setStep]           = useState(1);   // 1: Aadhaar input, 2: OTP, 3: Success
  const [aadhaarId, setAadhaarId] = useState('');
  const [otp, setOtp]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [preview, setPreview]     = useState(null); // local mock preview only
  const [result, setResult]       = useState(null);

  const reset = () => {
    setStep(1); setAadhaarId(''); setOtp('');
    setLoading(false); setError(''); setPreview(null); setResult(null);
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Step 1: Check if identity exists, add if not, then POST /api/tickets/request ──────────────────────────────────────
  const handleRequestOTP = async () => {
    if (aadhaarId.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar / identity number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // First, ensure identity is added to system (required for ticket purchase)
      const addIdentityRes = await fetch(`${API_BASE}/identity/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          identity_id: aadhaarId,
          // Backend will validate identity_id against Aadhaar registry
        }),
      });
      const addIdentityData = await addIdentityRes.json();
      
      // Even if identity add fails with 404 (not in registry), continue to ticket request
      // Backend will check identity again and send appropriate error
      
      // Now request OTP for ticket purchase
      const res = await fetch(`${API_BASE}/tickets/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: event?.eventId ?? event?.id,
          identity_id: aadhaarId,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to send OTP');

      // Show a local identity preview if Aadhaar is in mock registry
      setPreview(MOCK_AADHAAR_REGISTRY[aadhaarId] || null);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: POST /api/tickets/confirm ──────────────────────────────────────
  const handleConfirmOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/tickets/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: event?.eventId ?? event?.id,
          identity_id: aadhaarId,
          otp,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Invalid OTP');

      setResult(data);
      setStep(3);
      if (onBookingComplete) onBookingComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '3px solid var(--border)',
          boxShadow: '8px 8px 0 var(--border)',
          maxWidth: '480px', width: '100%',
          borderRadius: '0px', overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '3px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon.Shield />
            <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', fontSize: '15px', fontWeight: 'bold' }}>
              Book Ticket — Identity Verify
            </h3>
          </div>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px' }}>
            <Icon.X />
          </button>
        </div>

        {/* ── Event Badge ── */}
        {event && (
          <div style={{
            padding: '10px 20px',
            background: 'var(--bg)',
            borderBottom: '2px solid var(--border)',
            fontSize: '12px', fontFamily: 'Space Mono, monospace',
            color: 'var(--muted)', display: 'flex', justifyContent: 'space-between',
          }}>
            <span>🎫 <strong style={{ color: 'var(--text)' }}>{event.title}</strong></span>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              {event.price > 0 ? `₹${event.price.toLocaleString('en-IN')}` : 'FREE'}
            </span>
          </div>
        )}

        {/* ── Step Progress ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 20px 0' }}>
          {[1, 2, 3].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '28px', height: '28px',
                border: '2px solid var(--border)',
                background: step >= s ? (step > s ? 'var(--primary)' : 'var(--border)') : 'transparent',
                color: step >= s ? (step > s ? '#000' : 'var(--surface)') : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 'bold',
                boxShadow: step === s ? '2px 2px 0 var(--border)' : 'none',
              }}>
                {step > s ? '✓' : s}
              </div>
              {i < 2 && (
                <div style={{ width: '40px', height: '2px', background: step > s + 0.5 ? 'var(--primary)' : 'var(--border)', margin: '0 6px' }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '44px', fontSize: '10px', color: 'var(--muted)', padding: '4px 20px 0', fontFamily: 'Space Mono, monospace' }}>
          <span>AADHAAR</span><span>OTP</span><span>DONE</span>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '24px' }}>

          {/* Error */}
          {error && (
            <div style={{
              background: '#1a0000', color: '#ff4444',
              padding: '10px 14px', marginBottom: '18px',
              fontSize: '13px', border: '2px solid #ff4444',
              fontFamily: 'Space Mono, monospace',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* ── STEP 1: Aadhaar input ── */}
          {step === 1 && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Step 1: Enter Aadhaar / Identity ID
              </h4>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '18px', lineHeight: 1.5 }}>
                Enter your 12-digit identity number. An OTP will be sent to your registered mobile.
              </p>

              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 12-digit Aadhaar number"
                value={aadhaarId}
                onChange={e => {
                  setAadhaarId(e.target.value.replace(/\D/g, '').slice(0, 12));
                  setError('');
                }}
                maxLength={12}
                style={{
                  width: '100%', padding: '12px',
                  border: '2px solid var(--border)', borderRadius: '0',
                  fontSize: '18px', fontFamily: 'Space Mono, monospace',
                  letterSpacing: '4px', textAlign: 'center',
                  background: 'var(--input-bg)', color: 'var(--text)',
                  marginBottom: '14px', boxSizing: 'border-box',
                }}
              />

              {/* Mock hint */}
              <div style={{
                fontSize: '12px', color: 'var(--muted)',
                marginBottom: '18px', padding: '10px 14px',
                border: '2px dashed var(--border)', background: 'var(--bg)',
                fontFamily: 'Space Mono, monospace', lineHeight: 1.7,
              }}>
                <strong style={{ color: 'var(--text)' }}>For testing, use:</strong><br />
                • <span
                    style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                    onClick={() => setAadhaarId('111111111111')}
                  >111111111111</span> — Rajesh Kumar<br />
                • <span
                    style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                    onClick={() => setAadhaarId('222222222222')}
                  >222222222222</span> — Priya Singh
              </div>

              <button
                onClick={handleRequestOTP}
                disabled={loading || aadhaarId.length !== 12}
                className="brutal-btn"
                style={{
                  width: '100%', padding: '13px',
                  opacity: (loading || aadhaarId.length !== 12) ? 0.5 : 1,
                  cursor: (loading || aadhaarId.length !== 12) ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                }}
              >
                {loading ? 'Sending OTP…' : 'Send OTP →'}
              </button>
            </div>
          )}

          {/* ── STEP 2: OTP input ── */}
          {step === 2 && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Step 2: Enter OTP
              </h4>

              {/* Identity preview card */}
              {preview ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 16px', marginBottom: '18px',
                  border: '2px solid var(--border)', background: 'var(--bg)',
                }}>
                  <div style={{
                    width: '44px', height: '44px', flexShrink: 0,
                    background: preview.color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 'bold', color: '#fff',
                    fontSize: '18px', border: '2px solid var(--border)',
                  }}>
                    {preview.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontFamily: 'Space Mono, monospace', fontSize: '14px' }}>{preview.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{preview.phone}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>ID: {aadhaarId}</div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '12px 16px', marginBottom: '18px',
                  border: '2px solid var(--border)', background: 'var(--bg)',
                  fontSize: '13px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace',
                }}>
                  OTP sent to phone linked with <strong style={{ color: 'var(--text)' }}>{aadhaarId}</strong>
                </div>
              )}

              <input
                type="text"
                inputMode="numeric"
                placeholder="• • • • • •"
                value={otp}
                onChange={e => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                maxLength={6}
                autoFocus
                style={{
                  width: '100%', padding: '14px',
                  border: '2px solid var(--border)', borderRadius: '0',
                  fontSize: '28px', fontFamily: 'Space Mono, monospace',
                  letterSpacing: '10px', textAlign: 'center',
                  background: 'var(--input-bg)', color: 'var(--text)',
                  marginBottom: '12px', boxSizing: 'border-box',
                }}
              />

              <div style={{
                fontSize: '12px', color: 'var(--muted)', textAlign: 'center',
                marginBottom: '18px', fontFamily: 'Space Mono, monospace',
              }}>
                Testing OTP: <strong style={{ color: 'var(--primary)' }}>123456</strong>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => { setStep(1); setOtp(''); setError(''); }}
                  style={{
                    flex: 1, padding: '12px',
                    background: 'var(--bg)', color: 'var(--text)',
                    border: '2px solid var(--border)', cursor: 'pointer',
                    fontFamily: 'Space Mono, monospace', fontSize: '13px',
                    boxShadow: '3px 3px 0 var(--border)',
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleConfirmOTP}
                  disabled={loading || otp.length !== 6}
                  className="brutal-btn"
                  style={{
                    flex: 2, padding: '12px', fontSize: '13px',
                    opacity: (loading || otp.length !== 6) ? 0.5 : 1,
                    cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  {loading ? 'Confirming…' : <><Icon.CheckCircle /> Confirm & Mint Ticket</>}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Success ── */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                width: '72px', height: '72px', margin: '0 auto 20px',
                background: 'var(--primary)', border: '3px solid var(--border)',
                boxShadow: '4px 4px 0 var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#000',
              }}>
                <Icon.Ticket />
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', fontSize: '20px', margin: '0 0 10px', color: 'var(--primary)' }}>
                Ticket Booked!
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px', fontFamily: 'Space Mono, monospace', lineHeight: 1.6 }}>
                Your NFT ticket has been minted to your wallet.<br />
                {result?.token_id !== undefined && (
                  <span>Token ID: <strong style={{ color: 'var(--text)' }}>#{result.token_id}</strong></span>
                )}
              </p>
              <div style={{
                background: 'var(--bg)', border: '2px solid var(--primary)',
                padding: '12px', marginBottom: '20px',
                fontSize: '12px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace',
                textAlign: 'left', lineHeight: 1.8,
              }}>
                <div>🎫 Event: <strong style={{ color: 'var(--text)' }}>{event?.title}</strong></div>
                <div>📍 Venue: <strong style={{ color: 'var(--text)' }}>{event?.venue}</strong></div>
                <div>🆔 Identity: <strong style={{ color: 'var(--text)' }}>{aadhaarId}</strong></div>
              </div>
              <button
                onClick={handleClose}
                className="brutal-btn"
                style={{ width: '100%', padding: '13px', fontSize: '13px' }}
              >
                View My Tickets →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AadhaarModal;