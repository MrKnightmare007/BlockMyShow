import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking state
  const [bookingStep, setBookingStep] = useState(null); // null | 'identity' | 'otp'
  const [identityId, setIdentityId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${API_BASE}/events/${id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Event not found');
        setEvent(data.event);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleRequestOtp = async () => {
    if (!identityId) { setBookingError('Please enter your Identity ID'); return; }
    setBookingLoading(true); setBookingError('');
    try {
      const res = await fetch(`${API_BASE}/tickets/request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.eventId, identity_id: identityId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to request OTP');
      setOtpMessage(data.message || 'OTP sent to your registered number');
      setBookingStep('otp');
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleConfirmTicket = async () => {
    if (!otp) { setBookingError('Please enter the OTP'); return; }
    setBookingLoading(true); setBookingError('');
    try {
      const res = await fetch(`${API_BASE}/tickets/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.eventId, identity_id: identityId, otp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to confirm booking');
      setSuccess(`🎉 Ticket booked! Token ID: ${data.token_id}`);
      setBookingStep(null);
      setTimeout(() => navigate('/tickets'), 2000);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Accessing event details..." />;
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Event not found'}</p>
          <button onClick={() => navigate('/events')}
            className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const dateStr = Number.isFinite(Number(event.date))
    ? new Date(Number(event.date) * 1000).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'TBA';
  const totalTickets = Number(event.totalTickets);
  const minted = Number(event.ticketsMinted);
  const available = totalTickets - minted;
  const pct = totalTickets > 0 ? Math.round((minted / totalTickets) * 100) : 0;

  return (
    <div className="animate-fadeIn min-h-screen bg-gray-50 dark:bg-gray-900 dark-transition">
      {bookingLoading && <Loader fullScreen text="Securing your ticket on blockchain..." />}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </button>

        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-xl mb-6 text-center font-semibold">
            {success}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Hero Image */}
          <div className="relative h-64 md:h-80 bg-gradient-to-br from-blue-500 to-purple-600">
            {event.photoUrl && (
              <img src={event.photoUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none'; }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
              <div className="p-6 md:p-8 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-1">{event.title}</h1>
                <p className="text-lg opacity-90">📍 {event.venue} &bull; 📅 {dateStr}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Event Details</h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span className="font-medium">Event ID</span>
                    <span>#{event.eventId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Price</span>
                    <span className="text-pink-600 dark:text-pink-400 font-bold text-lg">₹{Number(event.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Tickets</span>
                    <span>{totalTickets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Available</span>
                    <span className={available < 10 ? 'text-red-500 font-bold' : 'text-green-600 dark:text-green-400 font-bold'}>
                      {available}
                    </span>
                  </div>
                </div>

                {/* Availability bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>{minted} sold</span>
                    <span>{pct}% booked</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 80 ? '#ef4444' : '#3b82f6' }} />
                  </div>
                </div>
              </div>

              {/* Booking Panel */}
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Book Your Ticket</h2>

                {!isAuthenticated ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                    <p className="text-yellow-800 dark:text-yellow-200 mb-3 text-sm">Login required to book tickets</p>
                    <button onClick={() => navigate('/auth')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-colors">
                      Login to Book
                    </button>
                  </div>
                ) : available === 0 ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 dark:text-red-300 font-semibold">This event is sold out!</p>
                    <button onClick={() => navigate('/marketplace')}
                      className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition-colors">
                      Check Resale Marketplace
                    </button>
                  </div>
                ) : bookingStep === null ? (
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      Tickets are minted as NFTs and tied to your verified identity.
                    </p>
                    <button onClick={() => setBookingStep('identity')}
                      className="w-full bms-button text-center py-3 text-lg rounded-lg">
                      Book Now — ₹{Number(event.price)}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookingStep === 'identity' && (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Enter your Aadhaar / Identity ID to receive OTP</p>
                        <input
                          type="text"
                          placeholder="Enter your 12-digit Identity ID"
                          value={identityId}
                          onChange={e => setIdentityId(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </>
                    )}

                    {bookingStep === 'otp' && (
                      <>
                        <p className="text-sm text-green-600 dark:text-green-400">{otpMessage}</p>
                        <input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={e => setOtp(e.target.value.slice(0, 6))}
                          maxLength="6"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-center text-2xl tracking-widest"
                        />
                      </>
                    )}

                    {bookingError && (
                      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
                        {bookingError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={() => { setBookingStep(null); setBookingError(''); setIdentityId(''); setOtp(''); }}
                        className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                        Cancel
                      </button>
                      <button
                        onClick={bookingStep === 'identity' ? handleRequestOtp : handleConfirmTicket}
                        disabled={bookingLoading}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
                      >
                        {bookingLoading ? 'Processing...' : bookingStep === 'identity' ? 'Send OTP' : 'Confirm Booking'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetailsPage;
