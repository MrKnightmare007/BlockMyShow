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

  const [step, setStep]           = useState(1);   // 1: Aadhaar input, 2: Payment
  const [aadhaarId, setAadhaarId] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const reset = () => {
    setStep(1); setAadhaarId('');
    setLoading(false); setError('');
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
      // Request OTP for ticket purchase - backend will add identity to table if needed
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

      // Move to payment step
      setStep(2);
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
          {[1, 2].map((s, i) => (
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
              {i < 1 && (
                <div style={{ width: '40px', height: '2px', background: step > s + 0.5 ? 'var(--primary)' : 'var(--border)', margin: '0 6px' }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '56px', fontSize: '10px', color: 'var(--muted)', padding: '4px 20px 0', fontFamily: 'Space Mono, monospace' }}>
          <span>IDENTITY</span><span>PAYMENT</span>
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

          {/* ── STEP 2: Payment ── */}
          {step === 2 && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Step 2: Complete Payment
              </h4>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '18px', lineHeight: 1.5 }}>
                Proceed with payment using Razorpay to complete your ticket booking.
              </p>

              <div style={{
                background: 'var(--bg)',
                border: '2px solid var(--border)',
                padding: '14px',
                marginBottom: '18px',
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase' }}>Order Summary</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                  <span>{event?.title}</span>
                  <span>₹{event?.price}</span>
                </div>
                <div style={{
                  borderTop: '2px dashed var(--border)',
                  paddingTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'var(--primary)',
                }}>
                  <span>Total</span>
                  <span>₹{event?.price}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onBookingComplete) {
                    onBookingComplete({ 
                      identity_id: aadhaarId,
                      event_id: event?.eventId ?? event?.id,
                      amount: event?.price
                    });
                  }
                  handleClose();
                }}
                className="brutal-btn"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px',
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                }}
              >
                {loading ? 'Processing…' : '💳 Proceed to Payment →'}
              </button>

              <button
                onClick={() => setStep(1)}
                disabled={loading}
                style={{
                  width: '100%', padding: '13px',
                  marginTop: '10px',
                  border: '2px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                ← Back
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AadhaarModal;