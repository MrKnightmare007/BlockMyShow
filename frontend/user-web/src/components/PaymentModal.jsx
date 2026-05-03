import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api/v1';

// Icons
const Icon = {
  X: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6L6 18"/>
      <path d="M6 6l12 12"/>
    </svg>
  ),
  CreditCard: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="1" y="4" width="22" height="16" rx="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  Shield: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Wallet: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/>
    </svg>
  ),
};

const PaymentModal = ({ isOpen, onClose, event, userWallet, identity, quantity, onPaymentSuccess }) => {
  const [step, setStep] = useState(1); // 1: Review, 2: Payment, 3: Processing, 4: Success
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [useBlockCoins, setUseBlockCoins] = useState(false);
  const { user, updateBlockCoins } = useAuth();

  // Reset state when modal opens/closes
  const resetState = () => {
    setStep(1);
    setPaymentMethod('razorpay');
    setLoading(false);
    setError('');
    setPaymentData(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Calculate total amount (including fees)
  const qty = quantity || 1;
  const ticketPrice = (event?.price || 0) * qty;
  const platformFee = Math.round(ticketPrice * 0.02); // 2% platform fee
  const gstAmount = Math.round((ticketPrice + platformFee) * 0.18); // 18% GST
  
  const coinsAvailable = user?.blockCoins || 0;
  const coinDiscount = useBlockCoins ? Math.min(coinsAvailable / 10, ticketPrice + platformFee + gstAmount) : 0;
  
  const totalAmount = Math.max(0, ticketPrice + platformFee + gstAmount - coinDiscount);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  // Handle payment processing
  const handlePayment = async () => {
    setLoading(true);
    setError('');
    setStep(3); // Processing

    try {
      // Step 1: Create payment order
      const orderResponse = await fetch(`${API_BASE}/payment/create-order`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          eventId: event.id,
          quantity: qty,
          totalAmount: totalAmount,
          currency: 'INR'
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Mock payment success (in real implementation, this would be Razorpay)
      const mockPaymentId = 'pay_' + Math.random().toString(36).substr(2, 9);
      const mockSignature = 'sig_' + Math.random().toString(36).substr(2, 16);

      // Step 3: Verify payment
      const verifyResponse = await fetch(`${API_BASE}/payment/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          orderId: orderData.order.razorpayOrderId,
          paymentId: mockPaymentId,
          signature: mockSignature
        }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      // Step 4: Mint NFT ticket
      const mintResponse = await fetch(`${API_BASE}/tickets/mint`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          eventId: event.id,
          quantity: qty,
          paymentId: mockPaymentId,
          aadhaarId: identity.aadhaarId,
          secret: 'user_secret_' + Date.now()
        }),
      });

      const mintData = await mintResponse.json();
      if (!mintData.success) {
        throw new Error(mintData.error || 'Failed to mint NFT ticket');
      }

      // Success!
      const successData = {
        orderId: orderData.order.orderId,
        paymentId: mockPaymentId,
        tokenId: mintData.ticket?.tokenId || Math.floor(Math.random() * 10000) + 1000,
        transactionHash: mintData.ticket?.transactionHash || '0x' + Math.random().toString(16).substr(2, 64),
        amount: totalAmount,
        event: event,
        identity: identity
      };

      setPaymentData(successData);
      setStep(4); // Success
      
      // Update Block Coins if used or earned
      if (useBlockCoins) {
        updateBlockCoins(-coinsAvailable);
      }
      // Earn 10% of total as new coins
      updateBlockCoins(Math.floor(totalAmount / 10));
      
      // Auto-close and callback after 3 seconds
      setTimeout(() => {
        onPaymentSuccess(successData);
      }, 3000);

    } catch (err) {
      setError(err.message);
      setStep(2); // Back to payment step
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !event) return null;

  const eventDate = formatDate(event.date);

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
        padding: '20px'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        style={{ 
          background: 'var(--surface)', 
          border: '3px solid var(--border)', 
          maxWidth: '600px', 
          width: '100%', 
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '8px 8px 0 var(--border)',
          borderRadius: '0px'
        }}
      >
        {/* Modal Header */}
        <div style={{
          background: step === 4 ? '#10b981' : 'var(--surface)',
          color: step === 4 ? '#000' : 'var(--text)',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {step === 4 ? <Icon.CheckCircle /> : <Icon.CreditCard />}
            <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', fontSize: '16px', fontWeight: 'bold' }}>
              {step === 1 ? 'Review Booking' : 
               step === 2 ? 'Payment' : 
               step === 3 ? 'Processing...' : 
               'Payment Successful!'}
            </h3>
          </div>
          {step !== 3 && step !== 4 && (
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <Icon.X />
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div style={{ padding: '30px' }}>
          {error && (
            <div style={{ 
              background: '#fee2e2', 
              color: '#dc2626', 
              padding: '12px', 
              marginBottom: '20px', 
              fontSize: '14px', 
              border: '2px solid #dc2626',
              borderRadius: '6px'
            }}>
              {error}
            </div>
          )}

          {/* Step 1: Review Booking */}
          {step === 1 && (
            <div>
              {/* Event Details */}
              <div style={{
                background: 'var(--bg)',
                padding: '20px',
                border: '2px solid var(--border)',
                borderRadius: '0px',
                marginBottom: '20px'
              }}>
                <h4 style={{ marginBottom: '12px', fontSize: '16px', textTransform: 'uppercase' }}>Event Details</h4>
                <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '18px' }}>{event.title}</div>
                <div style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '4px' }}>
                  📅 {eventDate.date} • {eventDate.time}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                  📍 {event.venue}
                </div>
              </div>

              {/* Identity Verification */}
              <div style={{
                background: '#f0fdf4',
                border: '2px solid #10b981',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <Icon.CheckCircle />
                  <strong>Identity Verified</strong>
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {identity?.name} • Aadhaar: {identity?.aadhaarId}
                </div>
              </div>

              {/* Wallet Information */}
              <div style={{
                background: 'var(--bg)',
                padding: '16px',
                border: '2px solid var(--border)',
                borderRadius: '0px',
                marginBottom: '20px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <Icon.Wallet />
                  <strong>NFT Delivery Wallet</strong>
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--muted)',
                  wordBreak: 'break-all'
                }}>
                  {userWallet}
                </div>
              </div>

              {/* Price Breakdown */}
              <div style={{
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '20px'
              }}>
                <div style={{
                  background: '#f3f4f6',
                  padding: '12px 16px',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  Price Breakdown
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span>Ticket Price</span>
                    <span>₹{ticketPrice.toLocaleString()}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    <span>Platform Fee (2%)</span>
                    <span>₹{platformFee.toLocaleString()}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    <span>GST (18%)</span>
                    <span>₹{gstAmount.toLocaleString()}</span>
                  </div>
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {coinsAvailable > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '10px',
                        background: 'var(--surface)',
                        border: '2px dashed var(--primary)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input 
                            type="checkbox" 
                            id="useCoins" 
                            checked={useBlockCoins}
                            onChange={(e) => setUseBlockCoins(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <label htmlFor="useCoins" style={{ fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Use {coinsAvailable} Block Coins
                          </label>
                        </div>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>- ₹{Math.floor(coinsAvailable / 10)}</span>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}>
                      <span>Total Amount</span>
                      <span>₹{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Proceed to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {step === 2 && (
            <div>
              <h4 style={{ marginBottom: '20px', fontSize: '16px' }}>
                Choose Payment Method
              </h4>

              {/* Payment Methods */}
              <div style={{ marginBottom: '20px' }}>
                <div 
                  onClick={() => setPaymentMethod('razorpay')}
                  style={{
                    border: paymentMethod === 'razorpay' ? '2px solid #000' : '2px solid #ddd',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    marginBottom: '12px',
                    background: paymentMethod === 'razorpay' ? '#f8f9fa' : '#fff'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '2px solid #000',
                      background: paymentMethod === 'razorpay' ? '#000' : '#fff'
                    }} />
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        💳 Razorpay (Cards, UPI, Wallets)
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Secure payment via Razorpay gateway
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div style={{
                background: '#f0f9ff',
                border: '2px solid #0ea5e9',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '12px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  marginBottom: '4px'
                }}>
                  <Icon.Shield />
                  <strong>Secure Payment</strong>
                </div>
                Your payment is processed securely. NFT ticket will be minted automatically after successful payment.
              </div>

              {/* Total Amount */}
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                  Total Amount
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  ₹{totalAmount.toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f3f4f6',
                    color: '#666',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '12px',
                    background: loading ? '#ccc' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString()}`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '20px',
                animation: 'spin 2s linear infinite'
              }}>
                ⚡
              </div>
              <h4 style={{ marginBottom: '12px' }}>Processing Payment...</h4>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                Please wait while we process your payment and mint your NFT ticket.
              </p>
              <div style={{ 
                background: '#f8f9fa',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#666'
              }}>
                This may take a few seconds. Do not close this window.
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && paymentData && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
              <h4 style={{ marginBottom: '12px', color: '#10b981' }}>
                Payment Successful!
              </h4>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                Your NFT ticket has been minted and will appear in "My Tickets" shortly.
              </p>

              {/* Success Details */}
              <div style={{
                background: '#f0fdf4',
                border: '2px solid #10b981',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Order ID:</strong> {paymentData.orderId}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>NFT Token ID:</strong> #{paymentData.tokenId}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Amount Paid:</strong> ₹{paymentData.amount.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
                  <strong>Transaction:</strong> {paymentData.transactionHash}
                </div>
              </div>

              <div style={{ 
                fontSize: '12px', 
                color: '#666',
                marginBottom: '20px'
              }}>
                This window will close automatically in a few seconds...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PaymentModal;