import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const COLORS = ['#4a90e2', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/events`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to fetch events');
        setEvents(data.events || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filtered = events.filter(e =>
    e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.venue?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fadeIn min-h-screen bg-gray-50 dark:bg-gray-900 dark-transition">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-blue-600 dark:text-blue-400">Upcoming Events</h1>
          <p className="text-gray-600 dark:text-gray-400">Discover and book blockchain-verified tickets</p>
        </div>

        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search events by name or venue..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loading && <Loader fullScreen text="Discovering events..." />}

        {error && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-medium mb-1">No events found</h3>
            <p>Try adjusting your search.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event, index) => {
              const dateStr = Number.isFinite(Number(event.date))
                ? new Date(Number(event.date) * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'TBA';
              const bgColor = COLORS[index % COLORS.length];
              const totalTickets = Number(event.totalTickets);
              const minted = Number(event.ticketsMinted);
              const pct = totalTickets > 0 ? Math.round((minted / totalTickets) * 100) : 0;

              return (
                <Link to={`/event/${event.eventId}`} key={event.eventId}
                  className="event-card bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-48" style={{ background: `linear-gradient(135deg, ${bgColor}99, ${bgColor})` }}>
                    {event.photoUrl && (
                      <img src={event.photoUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">₹{Number(event.price)}</div>
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="text-xl font-bold">{event.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">📅 {dateStr}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm mb-3">📍 {event.venue}</div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>{totalTickets - minted} left</span>
                        <span>{pct}% sold</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: pct > 80 ? '#ef4444' : '#3b82f6' }} />
                      </div>
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">
                      View & Book
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventsPage;
