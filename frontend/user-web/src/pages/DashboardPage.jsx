import { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const COLORS = ['#4a90e2', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { walletAddress, isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) navigate('/auth', { replace: true });
  }, [isAuthenticated, navigate]);

  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');

  // Booking flow
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookingStep, setBookingStep] = useState(null); // null | 'identity' | 'otp'
  const [identityId, setIdentityId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true); setEventsError('');
      try {
        const res = await fetch(`${API_BASE}/events`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to load events');
        setEvents(data.events || []);
      } catch (err) {
        setEventsError(err.message);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  const handleRequestOtp = async () => {
    if (!identityId) { setBookingError('Please enter your Identity ID'); return; }
    setBookingLoading(true); setBookingError('');
    try {
      const res = await fetch(`${API_BASE}/tickets/request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: selectedEvent.eventId, identity_id: identityId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to request OTP');
      setOtpMessage(data.message || 'OTP sent');
      setBookingStep('otp'); setOtp('');
    } catch (err) { setBookingError(err.message); }
    finally { setBookingLoading(false); }
  };

  const handleConfirmTicket = async () => {
    if (!otp) { setBookingError('OTP required'); return; }
    setBookingLoading(true); setBookingError('');
    try {
      const res = await fetch(`${API_BASE}/tickets/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: selectedEvent.eventId, identity_id: identityId, otp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to confirm booking');
      alert(`🎉 Ticket booked! Token ID: ${data.token_id}`);
      setBookingStep(null); setSelectedEvent(null); setIdentityId(''); setOtp('');
      navigate('/tickets');
    } catch (err) { setBookingError(err.message); }
    finally { setBookingLoading(false); }
  };

  const filteredEvents = useMemo(() =>
    events.filter(e => e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.venue?.toLowerCase().includes(searchTerm.toLowerCase())),
    [events, searchTerm]
  );

  if (!isAuthenticated) return null;

  return (
    <div className="animate-fadeIn min-h-screen bg-gray-50 dark:bg-gray-900 dark-transition">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">🎪 Events</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and book tickets for upcoming events
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 flex gap-3">
          <div className="relative flex-1 max-w-md">
            <input type="text" placeholder="Search events..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Link to="/marketplace"
            className="flex items-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-semibold transition-colors">
            🏪 Marketplace
          </Link>
        </div>

        {loadingEvents && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="shimmer h-72 rounded-xl" />)}
          </div>
        )}

        {eventsError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl mb-4">{eventsError}</div>
        )}

        {!loadingEvents && filteredEvents.length === 0 && (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p>No events found</p>
          </div>
        )}

        {!loadingEvents && filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => {
              const dateStr = Number.isFinite(Number(event.date))
                ? new Date(Number(event.date) * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'TBA';
              const bgColor = COLORS[index % COLORS.length];
              const total = Number(event.totalTickets);
              const minted = Number(event.ticketsMinted);
              const pct = total > 0 ? Math.round((minted / total) * 100) : 0;
              const soldOut = minted >= total;

              return (
                <div key={event.eventId} className="event-card bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md">
                  <div className="relative h-44 cursor-pointer" style={{ background: `linear-gradient(135deg, ${bgColor}99, ${bgColor})` }}
                    onClick={() => navigate(`/event/${event.eventId}`)}>
                    {event.photoUrl && (
                      <img src={event.photoUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                      ₹{Number(event.price)}
                    </div>
                    {soldOut && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">SOLD OUT</div>
                    )}
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="text-lg font-bold leading-tight">{event.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">📅 {dateStr}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm mb-3">📍 {event.venue}</div>
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{total - minted} left</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: pct > 80 ? '#ef4444' : '#3b82f6' }} />
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedEvent(event); setBookingStep('identity'); setIdentityId(''); setOtp(''); setBookingError(''); }}
                      disabled={soldOut}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full text-sm font-semibold transition-colors"
                    >
                      {soldOut ? 'Sold Out' : 'Book Now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedEvent && bookingStep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slideUp">
            <h2 className="text-xl font-bold mb-1 text-gray-800 dark:text-white">
              {bookingStep === 'identity' ? '🔐 Verify Identity' : '📱 Enter OTP'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
              {selectedEvent.title} — ₹{Number(selectedEvent.price)}
            </p>

            {bookingStep === 'identity' && (
              <input type="text" placeholder="Enter your Identity ID (Aadhaar)"
                value={identityId} onChange={e => setIdentityId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none mb-3"
              />
            )}

            {bookingStep === 'otp' && (
              <>
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-xl text-sm mb-3">
                  {otpMessage}
                </div>
                <input type="text" placeholder="6-digit OTP"
                  value={otp} onChange={e => setOtp(e.target.value.slice(0, 6))} maxLength="6"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none mb-3 text-center text-2xl tracking-widest"
                />
              </>
            )}

            {bookingError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-xl text-sm mb-3">
                {bookingError}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setBookingStep(null); setSelectedEvent(null); setBookingError(''); }}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                Cancel
              </button>
              <button onClick={bookingStep === 'identity' ? handleRequestOtp : handleConfirmTicket}
                disabled={bookingLoading}
                className="flex-1 py-2.5 bms-button rounded-xl font-semibold disabled:opacity-50">
                {bookingLoading ? 'Processing...' : bookingStep === 'identity' ? 'Send OTP' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
