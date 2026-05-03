import { useState } from 'react';

// Icons
const Icon = {
  X: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6L6 18"/>
      <path d="M6 6l12 12"/>
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
};

// Mock Aadhaar Registry (same as backend)
const MOCK_AADHAAR_REGISTRY = {
  '111111111111': {
    name: 'RAJESH KUMAR',
    phone: '+91-9876543210',
    photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNGE5MGUyIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UkFKRVNIPC90ZXh0Pgo8L3N2Zz4K'
  },
  '222222222222': {
    name: 'PRIYA SINGH',
    phone: '+91-8765432109',
    photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZWM0ODk5Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UFJJWUE8L3RleHQ+Cjwvc3ZnPgo='
  }
};

const AadhaarModal = ({ isOpen, onClose, onVerified }) => {
  const [step, setStep] = useState(1); // 1: Enter Aadhaar, 2: Enter OTP
  const [aadhaarId, setAadhaarId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identity, setIdentity] = useState(null);

  // Reset state when modal opens/closes
  const resetState = () => {
    setStep(1);
    setAadhaarId('');
    setOtp('');
    setLoading(false);
    setError('');
    setIdentity(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Step 1: Send OTP to Aadhaar-linked phone
  const handleSendOTP = async () => {
    if (!aadhaarId || aadhaarId.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if Aadhaar exists in mock registry
      const mockIdentity = MOCK_AADHAAR_REGISTRY[aadhaarId];
      if (!mockIdentity) {
        throw new Error('Aadhaar number not found in registry. Try: 111111111111 or 222222222222');
      }

      await new Promise(resolve => setTimeout(resolve, 600));
      setStep(2);
      setIdentity(mockIdentity);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and complete identity verification
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      if (otp !== '123456') {
        throw new Error('Invalid OTP. Use 123456 for the mock verification.');
      }

      // Identity verified successfully
      const verifiedIdentity = {
        aadhaarId,
        name: identity.name,
        phone: identity.phone,
        photo: identity.photo,
        verified: true,
        verifiedAt: new Date().toISOString()
      };

      onVerified(verifiedIdentity);
      resetState();
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
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(0,0,0,0.7)', 
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
          background: '#fff', 
          border: '3px solid #000', 
          maxWidth: '500px', 
          width: '100%', 
          boxShadow: '8px 8px 0 #000',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          background: '#000',
          color: '#fff',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon.Shield />
            <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif' }}>
              Identity Verification
            </h3>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <Icon.X />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '30px' }}>
          {/* Progress Indicator */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '30px',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#000',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              1
            </div>
            <div style={{
              width: '40px',
              height: '2px',
              background: step >= 2 ? '#000' : '#ddd',
              margin: '0 10px'
            }} />
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: step >= 2 ? '#000' : '#ddd',
              color: step >= 2 ? '#fff' : '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              2
            </div>
          </div>

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

          {/* Step 1: Enter Aadhaar Number */}
          {step === 1 && (
            <div>
              <h4 style={{ 
                marginBottom: '10px',
                fontSize: '16px'
              }}>
                Step 1: Enter Aadhaar Number
              </h4>
              <p style={{ 
                color: '#666', 
                fontSize: '14px', 
                marginBottom: '20px',
                lineHeight: 1.4
              }}>
                Enter your 12-digit Aadhaar number to receive an OTP on your registered mobile number.
              </p>

              <input
                type="text"
                placeholder="Enter 12-digit Aadhaar number"
                value={aadhaarId}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setAadhaarId(value);
                  setError('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                  marginBottom: '20px'
                }}
                maxLength={12}
              />

              <div style={{ 
                fontSize: '12px', 
                color: '#666',
                marginBottom: '20px',
                background: '#f8f9fa',
                padding: '12px',
                borderRadius: '6px'
              }}>
                <strong>For testing, use:</strong><br/>
                • 111111111111 (Rajesh Kumar)<br/>
                • 222222222222 (Priya Singh)
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading || aadhaarId.length !== 12}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading || aadhaarId.length !== 12 ? '#ccc' : '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || aadhaarId.length !== 12 ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          )}

          {/* Step 2: Enter OTP */}
          {step === 2 && (
            <div>
              <h4 style={{ 
                marginBottom: '10px',
                fontSize: '16px'
              }}>
                Step 2: Enter OTP
              </h4>
              <p style={{ 
                color: '#666', 
                fontSize: '14px', 
                marginBottom: '20px',
                lineHeight: 1.4
              }}>
                OTP sent to {identity?.phone}. Enter the 6-digit code to verify your identity.
              </p>

              {/* Identity Preview */}
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '6px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <img 
                  src={identity?.photo} 
                  alt="Identity"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '6px',
                    border: '2px solid #ddd'
                  }}
                />
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {identity?.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Aadhaar: {aadhaarId}
                  </div>
                </div>
              </div>

              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                  setError('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '18px',
                  fontFamily: 'monospace',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}
                maxLength={6}
              />

              <div style={{ 
                fontSize: '12px', 
                color: '#666',
                marginBottom: '20px',
                textAlign: 'center',
                background: '#f8f9fa',
                padding: '8px',
                borderRadius: '4px'
              }}>
                For testing, use OTP: <strong>123456</strong>
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
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  style={{
                    flex: 2,
                    padding: '12px',
                    background: loading || otp.length !== 6 ? '#ccc' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {loading ? (
                    'Verifying...'
                  ) : (
                    <>
                      <Icon.CheckCircle />
                      Verify Identity
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AadhaarModal;
