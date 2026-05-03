import { useMemo, useState, useEffect } from 'react';
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
  const { walletAddress, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingFlow, setBookingFlow] = useState({
    event: null,
    identityVerified: false,
    identity: null,
  });

  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      setEventsError('');

      try {
        const response = await fetch(`${API_BASE}/events`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || data.error || 'Failed to load events');
        }

        const normalizedEvents = (data.events || []).map(normalizeEvent);
        setEvents(normalizedEvents);
      } catch (err) {
        setEventsError(err.message);
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // Get unique categories
  const categories = ['All', ...new Set(events.map(event => event.category))];

  // Filter events based on search and category
  const filteredEvents = useMemo(() => {
    let filtered = events;
    
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }
    
    return filtered;
  }, [searchTerm, selectedCategory, events]);

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

  const handleBookTicket = () => {
    if (!isAuthenticated) {
      // Redirect to auth page if not logged in
      window.location.href = '/auth';
      return;
    }
    
    setBookingFlow({
      event: selectedEvent,
      identityVerified: false,
      identity: null,
    });
    setShowAadhaarModal(true);
  };

  const handleIdentityVerified = (identityData) => {
    setBookingFlow(prev => ({
      ...prev,
      identityVerified: true,
      identity: identityData,
    }));
    setShowAadhaarModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    alert(`✅ Ticket Purchase Successful!\n\nOrder ID: ${paymentData.orderId}\nTicket NFT: ${paymentData.tokenId || 'Minting...'}\n\nYour ticket will appear in "My Tickets" shortly.`);
    setShowPaymentModal(false);
    setSelectedEvent(null);
    setBookingFlow({
      event: null,
      identityVerified: false,
      identity: null,
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Public Header with Login/Signup */}
      {!isAuthenticated && (
        <div style={{
          background: '#000',
          color: '#fff',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '1.25rem',
            fontWeight: 'bold'
          }}>
            BlockMyShow
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.location.href = '/auth'}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#fff',
                border: '2px solid #fff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Login
            </button>
            <button
              onClick={() => window.location.href = '/auth'}
              style={{
                padding: '8px 16px',
                background: '#fff',
                color: '#000',
                border: '2px solid #fff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      {/* Navbar for authenticated users */}
      {isAuthenticated && (
        <div style={{
          background: '#000',
          color: '#fff',
          padding: '0 2rem',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #000',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '1.25rem'
          }}>
            BlockMyShow
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="/" style={{ color: '#4a90e2', textDecoration: 'none', fontSize: '14px' }}>Events</a>
            <a href="/tickets" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px' }}>My Tickets</a>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '11px'
            }}>
              <div style={{ opacity: 0.7 }}>Wallet</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'No wallet'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ 
        background: '#fff', 
        padding: '2rem', 
        borderBottom: '3px solid #000',
        position: 'sticky',
        top: isAuthenticated ? '56px' : '0',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '2rem', 
                fontFamily: 'Syne, sans-serif', 
                marginBottom: '4px' 
              }}>
                Discover Events
              </h1>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Browse and book NFT tickets for Web3 events
              </p>
            </div>
            <div style={{ 
              background: '#f0f0f0', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              fontSize: '12px',
              textAlign: 'right'
            }}>
              <div style={{ color: '#888', marginBottom: '4px' }}>Your Wallet</div>
              <div style={{ 
                fontFamily: 'monospace', 
                fontWeight: 'bold', 
                color: '#000' 
              }}>
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
              <Icon.Search />
              <input
                type="text"
                placeholder="Search events, venues, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666'
              }}>
                <Icon.Search />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'All' ? 'All Categories' : category}
                </option>
              ))}
            </select>

            {/* Results Count */}
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              padding: '10px 0'
            }}>
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div style={{ 
        flex: 1, 
        padding: '2rem', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        width: '100%' 
      }}>
        {loadingEvents ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#666'
          }}>
            <Icon.Ticket />
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Loading events</h3>
            <p>Reading public events from the smart contract</p>
          </div>
        ) : eventsError ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#dc2626'
          }}>
            <Icon.Search />
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Could not load events</h3>
            <p>{eventsError}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            color: '#666'
          }}>
            <Icon.Search />
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>No events found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '20px' 
          }}>
            {filteredEvents.map(event => {
              const { date, time } = formatDate(event.date);
              const soldPercentage = (event.ticketsMinted / event.totalTickets) * 100;
              const remaining = event.totalTickets - event.ticketsMinted;
              
              return (
                <div 
                  key={event.id} 
                  onClick={() => setSelectedEvent(event)} 
                  style={{ 
                    border: '3px solid #000', 
                    background: '#fff', 
                    cursor: 'pointer', 
                    overflow: 'hidden', 
                    boxShadow: '4px 4px 0 #000', 
                    transition: 'all 0.15s',
                    borderRadius: '8px'
                  }} 
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                    e.currentTarget.style.boxShadow = '6px 6px 0 #000';
                  }} 
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '4px 4px 0 #000';
                  }}
                >
                  {/* Event Image */}
                  <div style={{ 
                    height: '160px', 
                    background: event.image,
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(0,0,0,0.8)',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {event.category}
                    </div>
                    {remaining < 50 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        background: '#ef4444',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        Only {remaining} left!
                      </div>
                    )}
                  </div>
                  
                  {/* Event Details */}
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ 
                      fontFamily: 'Syne, sans-serif', 
                      fontSize: '1.1rem', 
                      marginBottom: '8px', 
                      lineHeight: 1.2,
                      height: '2.4rem',
                      overflow: 'hidden'
                    }}>
                      {event.title}
                    </h3>
                    
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      marginBottom: '12px',
                      height: '3rem',
                      overflow: 'hidden',
                      lineHeight: 1.4
                    }}>
                      {event.description}
                    </p>
                    
                    {/* Date and Venue */}
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#555', 
                      marginBottom: '12px' 
                    }}>
                      <div style={{ 
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Icon.Calendar /> {date} • {time}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Icon.MapPin /> {event.venue}
                      </div>
                    </div>
                    
                    {/* Organizer */}
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#888',
                      marginBottom: '12px'
                    }}>
                      by {event.organizer}
                    </div>
                    
                    {/* Availability Bar */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        marginBottom: '4px'
                      }}>
                        <span>{remaining} available</span>
                        <span>{Math.round(soldPercentage)}% sold</span>
                      </div>
                      <div style={{ 
                        background: '#e5e7eb', 
                        height: '4px', 
                        borderRadius: '2px', 
                        overflow: 'hidden' 
                      }}>
                        <div style={{ 
                          background: soldPercentage > 80 ? '#ef4444' : soldPercentage > 50 ? '#f59e0b' : '#10b981', 
                          height: '100%', 
                          width: `${soldPercentage}%`,
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>
                    
                    {/* Price and Action */}
                    <div style={{ 
                      borderTop: '1px solid #eee', 
                      paddingTop: '12px', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '1.1rem' 
                        }}>
                          ₹{event.price.toLocaleString()}
                        </div>
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#666' 
                        }}>
                          per ticket
                        </div>
                      </div>
                      <div style={{
                        background: remaining === 0 ? '#ccc' : '#000',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Icon.Ticket />
                        {remaining === 0 ? 'Sold Out' : 'Book Now'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div 
          onClick={() => setSelectedEvent(null)} 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.6)', 
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
              maxWidth: '600px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflow: 'auto', 
              boxShadow: '8px 8px 0 #000',
              borderRadius: '8px'
            }}
          >
            {/* Modal Header Image */}
            <div style={{ 
              height: '250px', 
              background: selectedEvent.image,
              position: 'relative'
            }}>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(0,0,0,0.8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                background: 'rgba(0,0,0,0.8)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {selectedEvent.category}
              </div>
            </div>
            
            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              <h2 style={{ 
                fontFamily: 'Syne, sans-serif', 
                fontSize: '1.5rem', 
                marginBottom: '8px' 
              }}>
                {selectedEvent.title}
              </h2>
              
              <p style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginBottom: '4px' 
              }}>
                Organized by {selectedEvent.organizer}
              </p>
              
              <p style={{ 
                fontSize: '14px', 
                color: '#333', 
                marginBottom: '20px',
                lineHeight: 1.5
              }}>
                {selectedEvent.description}
              </p>
              
              {/* Event Details */}
              <div style={{ 
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '6px',
                marginBottom: '20px'
              }}>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '13px'
                }}>
                  <div>
                    <div style={{ color: '#666', marginBottom: '4px' }}>Date & Time</div>
                    <div style={{ fontWeight: 'bold' }}>
                      {formatDate(selectedEvent.date).date} • {formatDate(selectedEvent.date).time}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '4px' }}>Venue</div>
                    <div style={{ fontWeight: 'bold' }}>{selectedEvent.venue}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '4px' }}>Price</div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>₹{selectedEvent.price.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', marginBottom: '4px' }}>Availability</div>
                    <div style={{ fontWeight: 'bold' }}>
                      {selectedEvent.totalTickets - selectedEvent.ticketsMinted} / {selectedEvent.totalTickets}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Availability Progress */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  marginBottom: '6px'
                }}>
                  <span>Tickets Available</span>
                  <span>{Math.round((selectedEvent.ticketsMinted / selectedEvent.totalTickets) * 100)}% sold</span>
                </div>
                <div style={{ 
                  background: '#e5e7eb', 
                  height: '8px', 
                  borderRadius: '4px', 
                  overflow: 'hidden' 
                }}>
                  <div style={{ 
                    background: '#4a90e2', 
                    height: '100%', 
                    width: `${(selectedEvent.ticketsMinted / selectedEvent.totalTickets) * 100}%`,
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
              
              {/* Book Button */}
              <button 
                onClick={handleBookTicket} 
                disabled={selectedEvent.totalTickets - selectedEvent.ticketsMinted === 0}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  background: selectedEvent.totalTickets - selectedEvent.ticketsMinted === 0 ? '#ccc' : '#000', 
                  color: '#fff', 
                  border: '2px solid #000', 
                  cursor: selectedEvent.totalTickets - selectedEvent.ticketsMinted === 0 ? 'not-allowed' : 'pointer', 
                  fontFamily: 'monospace', 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Icon.Ticket />
                {selectedEvent.totalTickets - selectedEvent.ticketsMinted === 0 
                  ? 'Sold Out' 
                  : `Book Ticket • ₹${selectedEvent.price.toLocaleString()}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AadhaarModal
        isOpen={showAadhaarModal}
        onClose={() => setShowAadhaarModal(false)}
        onVerified={handleIdentityVerified}
        eventId={bookingFlow.event?.id}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        event={bookingFlow.event}
        userWallet={walletAddress}
        identity={bookingFlow.identity}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default DashboardPage;
