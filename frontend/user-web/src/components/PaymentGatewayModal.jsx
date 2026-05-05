import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:5000/api';

/**
 * BookingModal — unified 4-step booking flow
 *
 * Step 1 (identity): Enter Aadhaar ID
 *   → POST /api/payment/create-order { eventId, identity_id }
 *   → Backend sends OTP + creates Razorpay order
 *   → Razorpay popup opens automatically
 *
 * Step 2 (otp): After payment success, enter 6-digit OTP
 *   → POST /api/payment/verify { order_id, payment_id, signature, eventId, identity_id, otp }
 *   → Backend verifies payment + mints NFT ticket atomically
 *
 * Step 3 (success): Show token_id + tx_hash
 *
 * Replaces: AadhaarModal + PaymentGatewayModal + OTPVerificationModal
 */
const PaymentGatewayModal = ({ isOpen, onClose, event, onPaymentSuccess }) => {
  const { token } = useAuth();

  const [step, setStep]           = useState('identity'); // identity | paying | otp | success | error
  const [identityId, setIdentityId] = useState('');
  const [otp, setOtp]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Razorpay payment data (set after successful payment)
  const [paymentData, setPaymentData] = useState(null); // { order_id, payment_id, signature }
  const [orderData, setOrderData]     = useState(null); // response from create-order
  const [result, setResult]           = useState(null); // response from verify (token_id etc)

  // Load Razorpay script
  useEffect(() => {
    if (!isOpen) return;
    if (window.Razorpay) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onerror = () => setError('Failed to load Razorpay SDK. Please refresh.');
    document.body.appendChild(script);
  }, [isOpen]);

  const handleClose = () => {
    setStep('identity'); setIdentityId(''); setOtp(''); setLoading(false);
    setError(''); setPaymentData(null); setOrderData(null); setResult(null);
    onClose();
  };

  // ── Step 1: POST /api/payment/create-order { eventId, identity_id }
  // Backend: validates identity + sends OTP + creates Razorpay order
  const handleCreateOrder = async () => {
    if (identityId.length < 12) { setError('Enter a valid 12-digit Aadhaar / Identity ID'); return; }
    setLoading(true); setError('');

    try {
      const res = await fetch(`${API_BASE}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          eventId: event.eventId || event.id,
          identity_id: identityId,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create order');

      setOrderData(data);
      setStep('paying');
      toast.success('OTP sent to your registered phone!');

      // Open Razorpay checkout
      if (!window.Razorpay) throw new Error('Razorpay SDK not loaded. Please refresh.');

      const eventTitle = data.event?.title || event.title;
      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'BlockMyShow',
        description: `Ticket: ${eventTitle}`,
        order_id: data.order_id,
        handler: (response) => {
          // Payment success → store Razorpay data, move to OTP step
          setPaymentData({
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          setStep('otp');
        },
        modal: {
          ondismiss: () => {
            setStep('identity');
            setLoading(false);
            toast('Payment cancelled — you can try again', { icon: '⚠️' });
          },
        },
        prefill: { name: 'User', email: 'user@blockmyshow.com', contact: '9999999999' },
        theme: { color: '#31bbaf', backdrop_color: '#0a0a0a' },
        notes: { eventId: String(event.eventId || event.id) },
      });

      rzp.on('payment.failed', (resp) => {
        setError(resp.error?.description || 'Payment failed');
        setStep('identity');
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.message);
      setStep('identity');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: POST /api/payment/verify { ...paymentData, eventId, identity_id, otp }
  // Backend: verifies signature + OTP + mints NFT — atomic
  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    if (!paymentData) { setError('Missing payment data'); return; }
    setLoading(true); setError('');

    try {
      const res = await fetch(`${API_BASE}/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          order_id: paymentData.order_id,
          payment_id: paymentData.payment_id,
          signature: paymentData.signature,
          eventId: event.eventId || event.id,
          identity_id: identityId,
          otp,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Verification failed');

      setResult(data);
      setStep('success');
      toast.success('🎫 Ticket minted successfully!');
      if (onPaymentSuccess) onPaymentSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const STEP_LABELS = ['ID', 'PAY', 'OTP', 'DONE'];
  const stepIdx = { identity: 0, paying: 1, otp: 2, success: 3 }[step] ?? 0;

  return (
    <div onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '3px solid var(--border)', boxShadow: '8px 8px 0 var(--border)', maxWidth: '460px', width: '100%' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '3px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: '15px', textTransform: 'uppercase' }}>
            🎫 Book Ticket
          </h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '18px' }}>✕</button>
        </div>

        {/* Event bar */}
        {event && (
          <div style={{ padding: '10px 20px', borderBottom: '2px solid var(--border)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: 'Space Mono, monospace' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>{event.title}</span>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              {event.price > 0 ? `₹${Number(event.price).toLocaleString('en-IN')}` : 'FREE'}
            </span>
          </div>
        )}

        {/* Step indicator */}
        {step !== 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px 0', gap: '0' }}>
            {STEP_LABELS.slice(0, 3).map((label, i) => (
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
                <span style={{ fontSize: '9px', color: i === stepIdx ? 'var(--text)' : 'var(--muted)', marginLeft: '4px', fontFamily: 'Space Mono, monospace' }}>{label}</span>
                {i < 2 && <div style={{ width: '20px', height: '2px', background: i < stepIdx ? 'var(--primary)' : 'var(--border)', margin: '0 6px' }} />}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '24px' }}>

          {/* Error */}
          {error && (
            <div style={{ background: '#1a0000', color: '#ff4444', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', border: '2px solid #ff4444', fontFamily: 'Space Mono, monospace' }}>
              ⚠ {error}
            </div>
          )}

          {/* ── STEP 1: Identity ── */}
          {step === 'identity' && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Step 1: Identity Verification</h4>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px', fontFamily: 'Space Mono, monospace', lineHeight: 1.5 }}>
                Enter your 12-digit Aadhaar / Identity number. OTP will be sent and payment window will open.
              </p>
              <input
                type="text" inputMode="numeric"
                placeholder="Enter 12-digit Identity ID"
                value={identityId}
                onChange={e => { setIdentityId(e.target.value.replace(/\D/g, '').slice(0, 12)); setError(''); }}
                maxLength={12}
                style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '2px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontFamily: 'Space Mono, monospace', fontSize: '18px', letterSpacing: '4px', textAlign: 'center', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px', padding: '10px 14px', border: '2px dashed var(--border)', background: 'var(--bg)', fontFamily: 'Space Mono, monospace', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--text)' }}>Test IDs:</strong><br />
                • <span style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }} onClick={() => setIdentityId('111111111111')}>111111111111</span> — Rajesh Kumar<br />
                • <span style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }} onClick={() => setIdentityId('222222222222')}>222222222222</span> — Priya Singh
              </div>
              <button
                onClick={handleCreateOrder}
                disabled={loading || identityId.length < 12}
                className="brutal-btn"
                style={{ width: '100%', padding: '13px', fontSize: '13px', opacity: (loading || identityId.length < 12) ? 0.5 : 1, cursor: (loading || identityId.length < 12) ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Creating order & sending OTP…' : '💳 Pay & Get OTP →'}
              </button>
            </div>
          )}

          {/* ── STEP 2: Paying (Razorpay popup is open) ── */}
          {step === 'paying' && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
              <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>Razorpay Checkout Open</h4>
              <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'Space Mono, monospace', lineHeight: 1.6, marginBottom: '16px' }}>
                Complete the payment in the Razorpay popup.<br />After payment, you'll enter your OTP here.
              </p>
              <div style={{ border: '2px dashed var(--border)', padding: '12px', background: 'var(--bg)', fontFamily: 'Space Mono, monospace', fontSize: '12px', color: 'var(--muted)', textAlign: 'left' }}>
                <strong style={{ color: 'var(--text)' }}>Test card:</strong><br />
                Card: 4111 1111 1111 1111<br />
                Expiry: any future date<br />
                CVV: any 3 digits<br />
                OTP (bank): 1234
              </div>
            </div>
          )}

          {/* ── STEP 3: OTP ── */}
          {step === 'otp' && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Step 3: Verify OTP → Mint Ticket</h4>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px', fontFamily: 'Space Mono, monospace', lineHeight: 1.5 }}>
                Payment received ✓ — Enter the OTP sent to your registered phone to mint your NFT ticket.
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
              <button
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
                className="brutal-btn"
                style={{ width: '100%', padding: '13px', fontSize: '13px', opacity: (loading || otp.length !== 6) ? 0.5 : 1, cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Verifying & minting…' : '✅ Confirm & Mint Ticket'}
              </button>
            </div>
          )}

          {/* ── STEP 4: Success ── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ width: '72px', height: '72px', margin: '0 auto 20px', background: 'var(--primary)', border: '3px solid var(--border)', boxShadow: '4px 4px 0 var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                🎫
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', fontSize: '20px', margin: '0 0 10px', color: 'var(--primary)' }}>
                Ticket Minted!
              </h3>
              <div style={{ border: '2px solid var(--border)', background: 'var(--bg)', marginBottom: '20px', fontFamily: 'Space Mono, monospace', fontSize: '12px', textAlign: 'left' }}>
                {[
                  ['Token ID', result?.token_id !== undefined ? `#${result.token_id}` : '—'],
                  ['Event', result?.event?.title || event?.title || '—'],
                  ['Payment', result?.payment_id || '—'],
                  ['Tx Hash', result?.tx_hash ? result.tx_hash.slice(0, 20) + '…' : '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', padding: '8px 14px', borderBottom: '1px solid var(--border)', gap: '12px' }}>
                    <span style={{ color: 'var(--muted)', minWidth: '80px', fontSize: '11px', textTransform: 'uppercase' }}>{k}</span>
                    <span style={{ color: k === 'Token ID' ? 'var(--primary)' : 'var(--text)', fontWeight: 'bold', wordBreak: 'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleClose} className="brutal-btn" style={{ width: '100%', padding: '13px', fontSize: '13px' }}>
                View My Tickets →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayModal;
