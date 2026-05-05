import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import BuyResaleModal from '../components/BuyResaleModal';
import Loader from '../components/Loader';

import API_BASE from '../utils/api';

const GRADIENT_COLORS = [
  'linear-gradient(135deg, #31bbaf 0%, #0a0a0a 100%)',
  'linear-gradient(135deg, #4a90e2 0%, #0a0a0a 100%)',
  'linear-gradient(135deg, #ec4899 0%, #0a0a0a 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #0a0a0a 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #0a0a0a 100%)',
];

const formatDate = (unix) => {
  if (!unix) return 'TBA';
  return new Date(Number(unix) * 1000).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};


// ── Page ───────────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [buyListing, setBuyListing] = useState(null);

  const fetchMarketplace = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_BASE}/tickets/marketplace`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load');
      setListings(data.tickets || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMarketplace(); }, []);

  const handleBuySuccess = () => {
    fetchMarketplace();
    setTimeout(() => { navigate('/tickets'); }, 2500);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--bg)', padding: '40px 20px' }}>
      <style>{`.fade-in{animation:fadeIn .2s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', borderBottom: '3px solid var(--border)', paddingBottom: '18px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.2rem', margin: '0 0 6px', textTransform: 'uppercase' }}>
              🏷️ Resale Marketplace
            </h1>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '13px', fontFamily: 'Space Mono, monospace' }}>
              {listings.length} verified resale ticket{listings.length !== 1 ? 's' : ''} — secured by identity verification
            </p>
          </div>
          <button onClick={fetchMarketplace} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: 'bold' }}>
            ↻ Refresh
          </button>
        </div>

        {/* States */}
        {loading && <Loader fullScreen text="Scanning resale network..." />}

        {error && (
          <div className="brutal-card" style={{ textAlign: 'center', padding: '3rem', color: '#ef4444', fontFamily: 'Space Mono, monospace' }}>
            ⚠ {error}
            <br /><button onClick={fetchMarketplace} className="brutal-btn" style={{ marginTop: '16px', padding: '10px 24px', fontSize: '13px' }}>Retry</button>
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="brutal-card fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏷️</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', margin: '0 0 8px' }}>No Resale Listings</h3>
            <p style={{ fontSize: '13px', fontFamily: 'Space Mono, monospace', marginBottom: '20px' }}>No tickets listed for resale right now. Check back later!</p>
            <button onClick={() => navigate('/')} className="brutal-btn" style={{ padding: '12px 24px', fontSize: '13px' }}>Browse Events →</button>
          </div>
        )}

        {/* Listing Grid */}
        {!loading && !error && listings.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {listings.map((listing, idx) => {
              const gradient = GRADIENT_COLORS[idx % GRADIENT_COLORS.length];
              const dateStr  = formatDate(listing.event?.date);
              const isBelow  = Number(listing.list_price) < Number(listing.sale_price);

              return (
                <div key={listing.token_id} className="brutal-card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Banner */}
                  <div style={{ height: '120px', background: gradient, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '14px', position: 'relative', borderBottom: '3px solid var(--border)' }}>
                    {isBelow && (
                      <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--primary)', color: '#000', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', border: '2px solid var(--border)', fontFamily: 'Space Mono, monospace' }}>
                        ↓ BELOW FACE VALUE
                      </div>
                    )}
                    <h3 style={{ margin: 0, color: '#fff', fontFamily: 'Syne, sans-serif', fontSize: '16px', textTransform: 'uppercase', textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                      {listing.event?.title || 'Event'}
                    </h3>
                  </div>

                  {/* Details */}
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', marginBottom: '12px', lineHeight: 1.8 }}>
                      <div>📅 {dateStr}</div>
                      <div>📍 {listing.event?.venue || 'TBA'}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', marginBottom: '2px' }}>Resale Price</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)', fontFamily: 'Space Mono, monospace' }}>
                          ₹{Number(listing.list_price).toLocaleString('en-IN')}
                        </div>
                        {listing.sale_price && (
                          <div style={{ fontSize: '11px', color: 'var(--muted)', textDecoration: 'line-through', fontFamily: 'Space Mono, monospace' }}>
                            ₹{Number(listing.sale_price).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', fontFamily: 'Space Mono, monospace' }}>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Token</div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text)' }}>#{listing.token_id}</div>
                      </div>
                    </div>

                    {isAuthenticated ? (
                      <button
                        className="brutal-btn"
                        onClick={() => setBuyListing(listing)}
                        style={{ width: '100%', padding: '12px', fontSize: '13px' }}
                      >
                        Buy for ₹{Number(listing.list_price).toLocaleString('en-IN')} →
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/')}
                        style={{ width: '100%', padding: '12px', fontSize: '13px', background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontWeight: 'bold' }}
                      >
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
      {buyListing && (
        <BuyResaleModal
          listing={buyListing}
          token={token}
          onClose={() => setBuyListing(null)}
          onSuccess={handleBuySuccess}
        />
      )}
    </div>
  );
}
