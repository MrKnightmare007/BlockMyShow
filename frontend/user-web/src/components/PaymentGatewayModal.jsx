import { useState } from 'react';
import toast from 'react-hot-toast';

// Icons
const Icon = {
  X: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
    </svg>
  ),
  CreditCard: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

/**
 * PaymentGatewayModal
 * Fake payment gateway for testing
 * Later will be replaced with Razorpay integration
 * 
 * Flow: Payment Review → Enter Card Details → Processing → Success/Failure
 */
const PaymentGatewayModal = ({ isOpen, onClose, event, amount, onPaymentSuccess }) => {
  const [step, setStep] = useState(1); // 1: Review, 2: Card Details, 3: Processing, 4: Success/Failure
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardName, setCardName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const resetState = () => {
    setStep(1);
    setCardNumber('');
    setCardExpiry('');
    setCardCVV('');
    setCardName('');
    setLoading(false);
    setError('');
    setSuccess(false);
    setTransactionId('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(value.replace(/(\d{4})/g, '$1 ').trim());
  };

  const handleExpiryChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (value.length >= 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
    } else {
      setCardExpiry(value);
    }
  };

  const handleCVVChange = (e) => {
    setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 3));
  };

  const validateCardDetails = () => {
    if (!cardName.trim()) {
      setError('Card holder name is required');
      return false;
    }
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Card number must be 16 digits');
      return false;
    }
    if (!cardExpiry || cardExpiry.length !== 5) {
      setError('Expiry must be MM/YY format');
      return false;
    }
    if (cardCVV.length !== 3) {
      setError('CVV must be 3 digits');
      return false;
    }
    return true;
  };

  const handleProcessPayment = async () => {
    if (!validateCardDetails()) return;

    setLoading(true);
    setError('');

    // Simulate payment processing
    setStep(3);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fake payment success/failure logic
      // For testing: cards starting with 4111 succeed, others fail
      const cardDigits = cardNumber.replace(/\s/g, '');
      const isSuccessful = cardDigits.startsWith('4111') || cardDigits.startsWith('5555');

      if (!isSuccessful) {
        throw new Error('Test card declined. Use 4111111111111111 or 5555555555555555 for testing.');
      }

      // Generate fake transaction ID
      const txnId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setTransactionId(txnId);
      setSuccess(true);
      setStep(4);

      toast.success('✅ Payment successful!');

      // Call success callback after 2 seconds
      setTimeout(() => {
        if (onPaymentSuccess) {
          onPaymentSuccess({
            transactionId: txnId,
            amount: amount,
            status: 'success',
            timestamp: new Date().toISOString(),
          });
        }
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
      setStep(2);
      toast.error(err.message);
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
          maxWidth: '500px',
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
            <Icon.CreditCard />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '15px', fontWeight: 'bold' }}>
              Secure Payment
            </h3>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px' }}
          >
            <Icon.X />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          
          {/* Step 1: Review */}
          {step === 1 && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div style={{ padding: '12px', background: 'var(--bg)', border: '2px solid var(--border)' }}>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 8px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Order Summary
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                  <span>{event?.title}</span>
                  <span>₹{amount}</span>
                </div>
                <div style={{ borderTop: '2px dashed var(--border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)' }}>
                  <span>Total Amount</span>
                  <span>₹{amount}</span>
                </div>
              </div>

              <div style={{ padding: '12px', background: '#fef3c7', border: '2px solid #fbbf24', color: '#78350f' }}>
                <p style={{ fontSize: '12px', margin: 0, fontWeight: 'bold' }}>
                  💳 TEST CARDS:<br/>
                  Visa: 4111 1111 1111 1111<br/>
                  Mastercard: 5555 5555 5555 5555
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                style={{
                  padding: '12px',
                  border: '2px solid var(--border)',
                  background: 'var(--primary)',
                  color: '#000',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}
              >
                Proceed to Payment
              </button>
            </div>
          )}

          {/* Step 2: Card Details */}
          {step === 2 && (
            <form
              onSubmit={e => { e.preventDefault(); handleProcessPayment(); }}
              style={{ display: 'grid', gap: '1.5rem' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Cardholder Name *
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  placeholder="JOHN DOE"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    outline: 'none',
                    textTransform: 'uppercase',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Card Number *
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4111 1111 1111 1111"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    outline: 'none',
                    letterSpacing: '2px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Expiry (MM/YY) *
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="12/25"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    CVV *
                  </label>
                  <input
                    type="text"
                    value={cardCVV}
                    onChange={handleCVVChange}
                    placeholder="123"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ padding: '12px', background: '#fee2e2', border: '2px solid #fca5a5', color: '#991b1b', fontSize: '12px', fontWeight: 'bold' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px',
                  border: '2px solid var(--border)',
                  background: loading ? 'var(--surface)' : 'var(--primary)',
                  color: loading ? 'var(--muted)' : '#000',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? '⏳ Processing...' : '💳 Pay ₹' + amount}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                style={{
                  padding: '12px',
                  border: '2px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                ← Back
              </button>
            </form>
          )}

          {/* Step 3: Processing */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>
                💫
              </div>
              <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Processing Payment...</p>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '0.5rem' }}>Please wait while we verify your card</p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && success && (
            <div style={{ textAlign: 'center', padding: '2rem 0', display: 'grid', gap: '1rem' }}>
              <div style={{ fontSize: '3rem' }}>✅</div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, marginBottom: '0.5rem' }}>Payment Successful!</p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, marginBottom: '1rem' }}>
                  Transaction ID: <strong>{transactionId}</strong>
                </p>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg)', border: '2px dashed var(--border)', fontSize: '11px', color: 'var(--muted)' }}>
                Your ticket is being confirmed. You will be redirected shortly...
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {step !== 4 && (
          <div style={{ padding: '12px 24px', background: 'var(--bg)', borderTop: '2px solid var(--border)', fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon.CheckCircle style={{ minWidth: '16px' }} />
            Your payment is encrypted and secure
          </div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PaymentGatewayModal;
