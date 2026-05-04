import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AadhaarModal from '../components/AadhaarModal';
import PaymentModal from '../components/PaymentModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Icons
const Icon = {
  Calendar: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Filter: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Ticket: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"/>
      <path d="M13 5v2"/>
      <path d="M13 17v2"/>
      <path d="M13 11v2"/>
    </svg>
  ),
};

const EVENT_COLORS = ['#4a90e2', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const normalizeEvent = (event, index) => {
  const eventDate = Number(event.date);

  return {
    ...event,
    id: String(event.eventId),
    eventId: event.eventId,
    title: event.title,
    price: Number(event.price),
    totalTickets: Number(event.totalTickets),
    ticketsMinted: Number(event.ticketsMinted),
    date: Number.isFinite(eventDate)
      ? new Date(eventDate * 1000).toISOString()
      : event.date,
    venue: event.venue,
    description: event.metadataURI
      ? `On-chain event metadata: ${event.metadataURI}`
      : 'Blockchain-backed event ticketed through BlockMyShow.',
    image: EVENT_COLORS[index % EVENT_COLORS.length],
    category: 'On Chain',
    organizer: 'BlockMyShow',
    metadataURI: event.metadataURI
  };
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { walletAddress, isAuthenticated, token } = useAuth();
  
  // Check wallet address on mount - but only redirect if not authenticated at all
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Booking flow states
  const [bookingState, setBookingState] = useState(null); // 'requesting-otp', 'entering-otp', null
  const [identityId, setIdentityId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      setEventsError('');
      
      try {
        const response = await fetch(`${API_BASE}/events`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!data.success) {
          setEventsError(data.message || 'Failed to load events');
          return;
        }

        // Normalize and set events
        const normalizedEvents = data.events.map(normalizeEvent);
        setEvents(normalizedEvents);
      } catch (err) {
        setEventsError(err.message || 'Failed to load events');
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // Step 1: Request OTP for ticket booking
  const handleRequestOtp = async () => {
    if (!selectedEvent || !identityId) {
      setBookingError('Please enter your Identity ID');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const response = await fetch(`${API_BASE}/tickets/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: selectedEvent.eventId,
          identity_id: identityId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setBookingError(data.message || 'Failed to request OTP');
        return;
      }

      setOtpMessage(data.message);
      setBookingState('entering-otp');
      setOtp('');
    } catch (err) {
      setBookingError(err.message || 'Request failed');
    } finally {
      setBookingLoading(false);
    }
  };

  // Step 2: Confirm ticket with OTP
  const handleConfirmTicket = async () => {
    if (!selectedEvent || !identityId || !otp) {
      setBookingError('OTP is required');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const response = await fetch(`${API_BASE}/tickets/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: selectedEvent.eventId,
          identity_id: identityId,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setBookingError(data.message || 'Failed to confirm booking');
        return;
      }

      // Success - show success message
      alert(`Ticket booked successfully! ${data.message}`);
      
      // Reset and go to my tickets
      setBookingState(null);
      setSelectedEvent(null);
      setIdentityId('');
      setOtp('');
      
      // Navigate to tickets page
      navigate('/tickets');
    } catch (err) {
      setBookingError(err.message || 'Confirmation failed');
    } finally {
      setBookingLoading(false);
    }
  };

  // Reset booking flow
  const resetBooking = () => {
    setBookingState(null);
    setIdentityId('');
    setOtp('');
    setOtpMessage('');
    setBookingError('');
    setSelectedEvent(null);
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, selectedCategory]);

  if (!isAuthenticated || !walletAddress) {
    return null;
  }

  // Booking Modal
  if (selectedEvent && bookingState) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '90%',
          border: '2px solid #000'
        }}>
          <h2>{bookingState === 'requesting-otp' ? 'Verify Identity' : 'Enter OTP'}</h2>

          {bookingState === 'requesting-otp' && (
            <>
              <p style={{ color: '#666', marginBottom: '1rem' }}>
                Event: <strong>{selectedEvent.title}</strong>
              </p>
              <input
                type="text"
                placeholder="Enter your Identity ID (Aadhaar)"
                value={identityId}
                onChange={(e) => setIdentityId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </>
          )}

          {bookingState === 'entering-otp' && (
            <>
              <p style={{ color: '#666', marginBottom: '1rem' }}>
                {otpMessage}
              </p>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                maxLength="6"
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </>
          )}

          {bookingError && (
            <p style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {bookingError}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
            <button
              onClick={resetBooking}
              style={{
                flex: 1,
                padding: '10px',
                background: '#f3f4f6',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
            <button
              onClick={bookingState === 'requesting-otp' ? handleRequestOtp : handleConfirmTicket}
              disabled={bookingLoading}
              style={{
                flex: 1,
                padding: '10px',
                background: bookingLoading ? '#ccc' : '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: bookingLoading ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
            >
              {bookingLoading ? 'Processing...' : bookingState === 'requesting-otp' ? 'Request OTP' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'Syne, sans-serif', marginBottom: '2rem' }}>
          🎫 Events
        </h1>

        {/* Search and Filter */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px',
          marginBottom: '2rem'
        }}>
          <div style={{ position: 'relative' }}>
            <Icon.Search />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 30px',
                border: '1px solid #ddd',
                borderRadius: '6px',
              }}
            />
          </div>
        </div>

        {loadingEvents && <div>Loading events...</div>}

        {eventsError && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            {eventsError}
          </div>
        )}

        {/* Events List */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              style={{
                border: '2px solid #000',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#fff',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
            >
              <div style={{
                height: '200px',
                background: event.image,
                opacity: 0.8,
              }} />
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem' }}>{event.title}</h3>
                
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <Icon.Calendar /> {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <Icon.MapPin /> {event.venue}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Icon.Ticket /> ₹{event.price} | {event.ticketsMinted}/{event.totalTickets} sold
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    setBookingState('requesting-otp');
                    setIdentityId('');
                    setOtp('');
                    setBookingError('');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginTop: '1rem'
                  }}
                >
                  Book Ticket
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && !loadingEvents && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
            <p>No events found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
