import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const QR_API = (data) => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;

function TicketsPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('my');

  // Resale state
  const [resaleModal, setResaleModal] = useState(null); // { tokenId, step: 'list'|'price'|'unlist' }
  const [resalePrice, setResalePrice] = useState('');
  const [resaleLoading, setResaleLoading] = useState(false);
  const [resaleError, setResaleError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/auth'); return; }
    fetchTickets();
  }, [isAuthenticated]);

  const fetchTickets = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/tickets/my-tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch tickets');
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleListResale = async () => {
    if (!resalePrice || Number(resalePrice) <= 0) { setResaleError('Enter a valid price'); return; }
    setResaleLoading(true); setResaleError('');
    try {
      const res = await fetch(`${API_BASE}/tickets/list`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: resaleModal.tokenId, price: Number(resalePrice) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setResaleModal(null); setResalePrice('');
      fetchTickets();
    } catch (err) {
      setResaleError(err.message);
    } finally {
      setResaleLoading(false);
    }
  };

  const handleCancelListing = async (tokenId) => {
    setResaleLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tickets/cancel-listing`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      fetchTickets();
    } catch (err) {
      alert(err.message);
    } finally {
      setResaleLoading(false);
    }
  };

  const TicketCard = ({ ticket }) => {
    const dateStr = ticket.event?.date
      ? new Date(Number(ticket.event.date) * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'TBA';

    return (
      <div className="ticket-card bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-blue-500 to-purple-600 relative flex items-end">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative p-3 text-white">
            <h3 className="text-lg font-bold leading-tight">{ticket.event?.title || 'Event'}</h3>
          </div>
          {ticket.used && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">USED</div>
          )}
          {ticket.is_listed && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">LISTED</div>
          )}
        </div>

        <div className="p-4">
          <div className="flex justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Token ID</p>
              <p className="font-bold text-gray-800 dark:text-gray-200">#{ticket.token_id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
              <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">{dateStr}</p>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            <div className="mb-1">📍 {ticket.event?.venue || 'N/A'}</div>
            <div>💰 ₹{ticket.event?.price || 'N/A'}</div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-3">
            <div className="bg-white p-2 border dark:border-gray-600 rounded-xl inline-block shadow-sm">
              <img
                src={QR_API(`BLOCKMYSHOW:TOKEN:${ticket.token_id}`)}
                alt={`QR for ticket ${ticket.token_id}`}
                className="w-28 h-28"
              />
            </div>
          </div>

          {/* Actions */}
          {!ticket.used && (
            <div className="flex gap-2">
              {ticket.is_listed ? (
                <button onClick={() => handleCancelListing(ticket.token_id)} disabled={resaleLoading}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
                  Cancel Listing
                </button>
              ) : (
                <button onClick={() => setResaleModal({ tokenId: ticket.token_id })}
                  className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
                  List for Resale
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fadeIn min-h-screen bg-gray-50 dark:bg-gray-900 dark-transition">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">🎫 My Tickets</h1>
          <button onClick={fetchTickets} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="shimmer h-72 rounded-2xl" />)}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl mb-4">{error}</div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4">🎟️</div>
            <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
            <p className="mb-6">Browse events and buy your first blockchain-verified ticket!</p>
            <button onClick={() => navigate('/events')}
              className="bms-button px-8 py-3 rounded-lg text-base">
              Browse Events
            </button>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tickets.map(ticket => <TicketCard key={ticket.token_id} ticket={ticket} />)}
          </div>
        )}
      </div>

      {/* Resale Modal */}
      {resaleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">List Ticket for Resale</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Token #{resaleModal.tokenId}</p>
            <input
              type="number"
              placeholder="Enter resale price (₹)"
              value={resalePrice}
              onChange={e => setResalePrice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none mb-3"
            />
            {resaleError && <p className="text-red-500 text-sm mb-3">{resaleError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setResaleModal(null); setResaleError(''); setResalePrice(''); }}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                Cancel
              </button>
              <button onClick={handleListResale} disabled={resaleLoading}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors">
                {resaleLoading ? 'Listing...' : 'List Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketsPage;
