import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function MarketplacePage() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Buy resale state
  const [buyModal, setBuyModal] = useState(null); // { tokenId, listPrice }
  const [buyStep, setBuyStep] = useState('identity'); // 'identity' | 'otp'
  const [buyerIdentity, setBuyerIdentity] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMarketplace();
  }, []);

  const fetchMarketplace = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/tickets/marketplace`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load marketplace');
      setListings(data.tickets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyRequest = async () => {
    if (!buyerIdentity) { setBuyError('Enter your Identity ID'); return; }
    setBuyLoading(true); setBuyError('');
    try {
      const res = await fetch(`${API_BASE}/tickets/buy-resale/request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: buyModal.tokenId, buyerIdentity }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setOtpMessage(data.message || 'OTP sent to your registered number');
      setBuyStep('otp');
    } catch (err) {
      setBuyError(err.message);
    } finally {
      setBuyLoading(false);
    }
  };

  const handleBuyConfirm = async () => {
    if (!otp) { setBuyError('Enter OTP'); return; }
    setBuyLoading(true); setBuyError('');
    try {
      const res = await fetch(`${API_BASE}/tickets/buy-resale/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: buyModal.tokenId, buyerIdentity, otp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuccess(`🎉 Ticket purchased! Token ID: ${data.token_id}`);
      setBuyModal(null); setBuyerIdentity(''); setOtp(''); setBuyStep('identity');
      fetchMarketplace();
      setTimeout(() => { setSuccess(''); navigate('/tickets'); }, 2500);
    } catch (err) {
      setBuyError(err.message);
    } finally {
      setBuyLoading(false);
    }
  };

  const closeBuyModal = () => {
    setBuyModal(null); setBuyerIdentity(''); setOtp(''); setBuyError(''); setBuyStep('identity');
  };

  return (
    <div className="animate-fadeIn min-h-screen bg-gray-50 dark:bg-gray-900 dark-transition">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
            🏪 Resale Marketplace
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Buy verified resale tickets from other users — secured by identity verification
          </p>
        </div>

        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-xl mb-6 font-semibold text-center">
            {success}
          </div>
        )}

        {/* Refresh */}
        <div className="flex justify-end mb-6">
          <button onClick={fetchMarketplace}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="shimmer h-72 rounded-xl" />)}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl">{error}</div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-xl font-semibold mb-2">No tickets listed for resale</h3>
            <p>Check back later or browse new events!</p>
            <button onClick={() => navigate('/events')}
              className="mt-6 bms-button px-8 py-3 rounded-lg">Browse Events</button>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing, index) => {
              const colors = ['#4a90e2', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];
              const bgColor = colors[index % colors.length];
              const dateStr = listing.event?.date
                ? new Date(Number(listing.event.date) * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'TBA';
              const discount = listing.sale_price > listing.list_price;

              return (
                <div key={listing.token_id}
                  className="marketplace-card bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md">
                  {/* Banner */}
                  <div className="relative h-40" style={{ background: `linear-gradient(135deg, ${bgColor}99, ${bgColor})` }}>
                    {listing.event?.photo_url && (
                      <img src={listing.event.photo_url} alt={listing.event?.title} className="absolute inset-0 w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {discount && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        BELOW FACE VALUE
                      </div>
                    )}
                    <div className="absolute bottom-2 left-3 text-white">
                      <h3 className="text-lg font-bold leading-tight">{listing.event?.title || 'Event'}</h3>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <div>📅 {dateStr}</div>
                      <div>📍 {listing.event?.venue || 'N/A'}</div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Resale Price</p>
                        <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                          ₹{Number(listing.list_price)}
                        </p>
                        {listing.sale_price && (
                          <p className="text-xs text-gray-400 line-through">
                            Original: ₹{Number(listing.sale_price)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Token</p>
                        <p className="font-mono text-gray-700 dark:text-gray-300 font-bold">#{listing.token_id}</p>
                      </div>
                    </div>

                    {isAuthenticated ? (
                      <button
                        onClick={() => setBuyModal({ tokenId: listing.token_id, listPrice: listing.list_price })}
                        className="w-full bms-button text-center py-2.5 rounded-lg font-semibold"
                      >
                        Buy for ₹{Number(listing.list_price)}
                      </button>
                    ) : (
                      <button onClick={() => navigate('/auth')}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2.5 rounded-lg font-semibold transition-colors">
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
      {buyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-1 text-gray-800 dark:text-white">Buy Resale Ticket</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
              Token #{buyModal.tokenId} &bull; ₹{Number(buyModal.listPrice)}
            </p>

            {buyStep === 'identity' && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Enter your Aadhaar / Identity ID to receive OTP verification
                </p>
                <input
                  type="text"
                  placeholder="Enter your 12-digit Identity ID"
                  value={buyerIdentity}
                  onChange={e => setBuyerIdentity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500 focus:outline-none mb-3"
                />
              </>
            )}

            {buyStep === 'otp' && (
              <>
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm mb-3">
                  {otpMessage}
                </div>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value.slice(0, 6))}
                  maxLength="6"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500 focus:outline-none text-center text-2xl tracking-widest mb-3"
                />
              </>
            )}

            {buyError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm mb-3">
                {buyError}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={closeBuyModal}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                Cancel
              </button>
              <button
                onClick={buyStep === 'identity' ? handleBuyRequest : handleBuyConfirm}
                disabled={buyLoading}
                className="flex-1 py-2.5 bms-button rounded-lg font-semibold disabled:opacity-50"
              >
                {buyLoading ? 'Processing...' : buyStep === 'identity' ? 'Send OTP' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketplacePage;
