import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:5000/api';

const PaymentGatewayModal = ({ isOpen, onClose, event, onPaymentSuccess }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [status, setStatus]   = useState('idle'); // idle | creating | paying | verifying | done | error

  // Load Razorpay script
  useEffect(() => {
    if (!isOpen) return;
    if (window.Razorpay) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onerror = () => { setError('Failed to load Razorpay SDK'); setStatus('error'); };
    document.body.appendChild(script);
  }, [isOpen]);

  // Auto-trigger payment when modal opens
  useEffect(() => {
    if (isOpen && status === 'idle' && event?.price > 0) {
      // Small delay so the modal renders first, then trigger
      const t = setTimeout(() => handlePayment(), 400);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!event?.price) { setError('Event price not available'); setStatus('error'); return; }
    setLoading(true); setError(''); setStatus('creating');

    try {
      // Step 1: Create order — only send eventId, backend fetches price from blockchain
      const createRes = await fetch(`${API_BASE}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          eventId: event.eventId || event.id,
        }),
      });
      const orderData = await createRes.json();
      if (!orderData.success) throw new Error(orderData.message || 'Failed to create order');

      setStatus('paying');

      // Step 2: Open Razorpay checkout
      if (!window.Razorpay) throw new Error('Razorpay SDK not loaded. Please refresh and try again.');

      const eventTitle = orderData.event?.title || event.title;
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'BlockMyShow',
        description: `Ticket: ${eventTitle}`,
        order_id: orderData.order_id,
        handler: async (response) => {
          // Step 3: Verify
          setStatus('verifying');
          try {
            const verifyRes = await fetch(`${API_BASE}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                eventId: event.eventId || event.id,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) throw new Error(verifyData.message || 'Payment verification failed');

            setStatus('done');
            toast.success('💳 Payment verified!');
            onPaymentSuccess({
              payment_id: verifyData.payment_id,
              order_id: verifyData.order_id,
              amount: verifyData.amount,
              status: verifyData.status,
            });
          } catch (e) {
            setError(e.message); setStatus('error');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setStatus('idle');
            toast('Payment cancelled', { icon: '⚠️' });
          },
        },
        prefill: { name: 'User', email: 'user@blockmyshow.com', contact: '9999999999' },
        theme: { color: '#31bbaf', backdrop_color: '#0a0a0a' },
        notes: { eventId: String(event.eventId || event.id), eventTitle: event.title },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setError(resp.error?.description || 'Payment failed');
        setStatus('error');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || 'Payment error');
      setStatus('error');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStatus('idle'); setError(''); setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '3px solid var(--border)', boxShadow: '8px 8px 0 var(--border)', maxWidth: '440px', width: '100%' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '3px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: '15px', textTransform: 'uppercase' }}>
            💳 Payment Gateway
          </h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '18px' }}>✕</button>
        </div>

        {/* Event info bar */}
        {event && (
          <div style={{ padding: '10px 20px', borderBottom: '2px solid var(--border)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: 'Space Mono, monospace' }}>
            <span style={{ color: 'var(--text)', fontWeight: 'bold' }}>{event.title}</span>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{Number(event.price).toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{ background: '#1a0000', color: '#ff4444', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', border: '2px solid #ff4444', fontFamily: 'Space Mono, monospace' }}>
              ⚠ {error}
            </div>
          )}

          {/* Status indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
            {/* Progress steps */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '8px' }}>
              {[
                { key: 'creating', label: 'ORDER' },
                { key: 'paying', label: 'PAY' },
                { key: 'verifying', label: 'VERIFY' },
              ].map((s, i) => {
                const steps = ['creating', 'paying', 'verifying', 'done'];
                const currentIdx = steps.indexOf(status);
                const thisIdx = steps.indexOf(s.key);
                const isDone = currentIdx > thisIdx;
                const isActive = currentIdx === thisIdx;
                return (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '28px', height: '28px', border: '2px solid var(--border)',
                      background: isDone ? 'var(--primary)' : isActive ? 'var(--border)' : 'transparent',
                      color: isDone ? '#000' : isActive ? 'var(--surface)' : 'var(--muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 'bold', fontFamily: 'Space Mono, monospace',
                    }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <div style={{ fontSize: '9px', color: isActive ? 'var(--text)' : 'var(--muted)', marginLeft: '4px', fontFamily: 'Space Mono, monospace' }}>
                      {s.label}
                    </div>
                    {i < 2 && <div style={{ width: '20px', height: '2px', background: isDone ? 'var(--primary)' : 'var(--border)', margin: '0 6px' }} />}
                  </div>
                );
              })}
            </div>

            {/* Status messages */}
            {status === 'idle' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💳</div>
                <p style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'Space Mono, monospace', margin: 0 }}>
                  Preparing Razorpay checkout…
                </p>
              </div>
            )}
            {status === 'creating' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px', animation: 'pulse 1s infinite' }}>⏳</div>
                <p style={{ color: 'var(--primary)', fontSize: '13px', fontFamily: 'Space Mono, monospace', margin: 0, fontWeight: 'bold' }}>
                  Creating payment order…
                </p>
              </div>
            )}
            {status === 'paying' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔒</div>
                <p style={{ color: 'var(--primary)', fontSize: '13px', fontFamily: 'Space Mono, monospace', margin: 0, fontWeight: 'bold' }}>
                  Razorpay window open — complete payment there
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'Space Mono, monospace', margin: '8px 0 0' }}>
                  Test card: 4111 1111 1111 1111 · Expiry: any future · CVV: any 3 digits
                </p>
              </div>
            )}
            {status === 'verifying' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px', animation: 'pulse 1s infinite' }}>🔐</div>
                <p style={{ color: '#f59e0b', fontSize: '13px', fontFamily: 'Space Mono, monospace', margin: 0, fontWeight: 'bold' }}>
                  Verifying payment signature…
                </p>
              </div>
            )}
            {status === 'done' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', margin: '0 auto 12px', background: 'var(--primary)', border: '3px solid var(--border)', boxShadow: '4px 4px 0 var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>✓</div>
                <p style={{ color: 'var(--primary)', fontSize: '15px', fontFamily: 'Syne, sans-serif', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Payment Verified!
                </p>
              </div>
            )}
            {status === 'error' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>❌</div>
                <button onClick={handlePayment} className="brutal-btn" style={{ padding: '12px 24px', fontSize: '13px', marginTop: '8px' }}>
                  Retry Payment
                </button>
              </div>
            )}
          </div>

          {/* Manual trigger if auto didn't fire */}
          {status === 'idle' && !loading && (
            <button onClick={handlePayment} className="brutal-btn" style={{ width: '100%', padding: '14px', fontSize: '13px', marginTop: '8px' }}>
              💳 Open Razorpay Checkout
            </button>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '12px', textDecoration: 'underline' }}>
              Cancel & go back
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
};

export default PaymentGatewayModal;
