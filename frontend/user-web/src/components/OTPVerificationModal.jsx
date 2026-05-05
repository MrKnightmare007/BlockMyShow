import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Icons
const Icon = {
  X: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

/**
 * OTPVerificationModal
 * Step 3 in booking flow: After payment, verify OTP before minting ticket
 * 
 * Flow: Show 6-digit OTP input → POST /api/tickets/confirm → Success
 */
const OTPVerificationModal = ({ isOpen, onClose, event, identityId, onOTPVerified }) => {
  const { token } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetState = () => {
    setOtp('');
    setLoading(false);
    setError('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      import API_BASE from '../utils/api';

      const res = await fetch(`${API_BASE}/tickets/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_id: event?.eventId ?? event?.id,
          identity_id: identityId,
          otp: otp,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      toast.success(
        data?.token_id !== undefined
          ? `✅ Ticket minted! Token #${data.token_id}`
          : '✅ Ticket booked successfully!',
        { duration: 4000 }
      );

      if (onOTPVerified) {
        onOTPVerified(data);
      }

      handleClose();
    } catch (err) {
      toast.error(`❌ ${err.message}`);
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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '3px solid var(--border)',
          boxShadow: '8px 8px 0 var(--border)',
          maxWidth: '480px',
          width: '100%',
          borderRadius: '0px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '3px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon.Lock />
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                textTransform: 'uppercase',
                fontSize: '15px',
                fontWeight: 'bold',
              }}
            >
              Verify OTP
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '4px',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Icon.X />
          </button>
        </div>

        {/* Event Info */}
        {event && (
          <div
            style={{
              padding: '10px 20px',
              background: 'var(--bg)',
              borderBottom: '2px solid var(--border)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--muted)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>🎫 <strong style={{ color: 'var(--text)' }}>{event.title}</strong></span>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              ₹{event.price?.toLocaleString('en-IN') || '0'}
            </span>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <h4
            style={{
              margin: '0 0 8px',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Enter 6-Digit OTP
          </h4>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '13px',
              marginBottom: '18px',
              lineHeight: 1.5,
            }}
          >
            An OTP has been sent to your phone linked with <strong style={{ color: 'var(--text)' }}>{identityId}</strong>
          </p>

          <input
            type="text"
            inputMode="numeric"
            placeholder="• • • • • •"
            value={otp}
            onChange={handleOTPChange}
            maxLength={6}
            autoFocus
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              border: '2px solid var(--border)',
              borderRadius: '0',
              fontSize: '28px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '10px',
              textAlign: 'center',
              background: 'var(--input-bg)',
              color: 'var(--text)',
              marginBottom: '16px',
              boxSizing: 'border-box',
              outline: 'none',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'text',
            }}
          />

          {error && (
            <div
              style={{
                padding: '12px',
                background: '#fee2e2',
                border: '2px solid #fca5a5',
                color: '#991b1b',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '16px',
              }}
            >
              ⚠ {error}
            </div>
          )}

          <div
            style={{
              fontSize: '12px',
              color: 'var(--muted)',
              textAlign: 'center',
              marginBottom: '18px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            For testing: <strong style={{ color: 'var(--primary)' }}>123456</strong>
          </div>

          <button
            onClick={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
            style={{
              width: '100%',
              padding: '13px',
              border: '2px solid var(--border)',
              background: loading || otp.length !== 6 ? 'var(--surface)' : 'var(--primary)',
              color: loading || otp.length !== 6 ? 'var(--muted)' : '#000',
              cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              opacity: loading || otp.length !== 6 ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? '⏳ Verifying...' : <>
              <Icon.CheckCircle style={{ width: '16px', height: '16px' }} />
              Verify & Mint Ticket
            </>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationModal;
