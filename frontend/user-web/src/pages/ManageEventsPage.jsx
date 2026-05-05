import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function ManageEventsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('events');

  const emptyForm = { title: '', venue: '', date: '', price: '', photoUrl: '', totalTickets: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) { navigate('/'); return; }
    fetchEvents();
  }, [isAuthenticated, isAdmin]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events`);
      const data = await res.json();
      if (data.success) setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreating(true); setCreateError(''); setCreateSuccess('');
    try {
      const dateTs = Math.floor(new Date(form.date).getTime() / 1000);
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          venue: form.venue,
          date: dateTs,
          price: Number(form.price),
          photoUrl: form.photoUrl || '',
          totalTickets: Number(form.totalTickets),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create event');
      setCreateSuccess(`Event created! ID: ${data.event_id}`);
      setForm(emptyForm);
      fetchEvents();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="animate-fadeIn min-h-screen bg-gray-50 dark:bg-gray-900 dark-transition">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">⚙️ Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          {['events', 'create'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
              {tab === 'events' ? '📋 All Events' : '➕ Create Event'}
            </button>
          ))}
        </div>

        {/* All Events Tab */}
        {activeTab === 'events' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">All Events</h2>
              <button onClick={fetchEvents}
                className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="shimmer h-20 rounded-xl" />)}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                <div className="text-5xl mb-3">📅</div>
                <p>No events created yet.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {['ID', 'Title', 'Venue', 'Date', 'Price', 'Tickets', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {events.map((event) => {
                        const dateStr = Number.isFinite(Number(event.date))
                          ? new Date(Number(event.date) * 1000).toLocaleDateString('en-IN')
                          : event.date;
                        const total = Number(event.totalTickets);
                        const minted = Number(event.ticketsMinted);
                        const soldOut = minted >= total;
                        return (
                          <tr key={event.eventId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">#{event.eventId}</td>
                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{event.title}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{event.venue}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{dateStr}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-pink-600 dark:text-pink-400">₹{Number(event.price)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{minted}/{total}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                soldOut
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              }`}>
                                {soldOut ? 'Sold Out' : 'Available'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Event Tab */}
        {activeTab === 'create' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Create New Event</h2>

            {createSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-4 rounded-xl mb-4 font-semibold">
                ✅ {createSuccess}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Title *</label>
                  <input type="text" required value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Concert, Match, Conference..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Venue *</label>
                  <input type="text" required value={form.venue}
                    onChange={e => setForm({ ...form, venue: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Stadium, Arena, Hall..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date & Time *</label>
                  <input type="datetime-local" required value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ticket Price (₹) *</label>
                  <input type="number" required min="1" value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Tickets *</label>
                  <input type="number" required min="1" value={form.totalTickets}
                    onChange={e => setForm({ ...form, totalTickets: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="1000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo URL (optional)</label>
                  <input type="url" value={form.photoUrl}
                    onChange={e => setForm({ ...form, photoUrl: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="https://..." />
                </div>
              </div>

              {createError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
                  {createError}
                </div>
              )}

              <button type="submit" disabled={creating}
                className="w-full py-3 bms-button rounded-xl text-base font-bold disabled:opacity-50">
                {creating ? 'Creating Event on Blockchain...' : '🚀 Create Event'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageEventsPage;
