import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AadhaarModal from '../components/AadhaarModal';
import PaymentModal from '../components/PaymentModal';

const API_BASE = 'http://localhost:5000/api/v1';

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

// Mock Events Data
const MOCK_EVENTS = [
  { 
    id: 'event_1', 
    title: 'Web3 Summit Mumbai 2024', 
    price: 2500, 
    totalTickets: 1000, 
    ticketsMinted: 450, 
    date: '2024-06-15T10:00:00Z', 
    venue: 'Mumbai Convention Centre', 
    description: 'Annual Web3 conference featuring top blockchain developers, investors, and innovators from around the world.',
    image: '#4a90e2',
    category: 'Technology',
    organizer: 'Web3 Foundation'
  },
  { 
    id: 'event_2', 
    title: 'NFT Art Exhibition Delhi', 
    price: 800, 
    totalTickets: 300, 
    ticketsMinted: 180, 
    date: '2024-07-20T18:00:00Z', 
    venue: 'Delhi Art Gallery', 
    description: 'Showcase of emerging NFT artists and digital art collections with live minting sessions.',
    image: '#ec4899',
    category: 'Art',
    organizer: 'Digital Art Collective'
  },
  { 
    id: 'event_3', 
    title: 'Blockchain Bootcamp IIT Bombay', 
    price: 5000, 
    totalTickets: 100, 
    ticketsMinted: 45, 
    date: '2024-08-05T09:00:00Z', 
    venue: 'IIT Bombay Campus', 
    description: 'Intensive 3-day blockchain development course covering Solidity, DeFi, and dApp development.',
    image: '#10b981',
    category: 'Education',
    organizer: 'IIT Bombay'
  },
  { 
    id: 'event_4', 
    title: 'DeFi Conference Bangalore', 
    price: 1500, 
    totalTickets: 500, 
    ticketsMinted: 320, 
    date: '2024-09-10T14:00:00Z', 
    venue: 'Bangalore Tech Park', 
    description: 'Explore the future of decentralized finance with industry leaders and protocol developers.',
    image: '#f59e0b',
    category: 'Finance',
    organizer: 'DeFi Alliance'
  },
  { 
    id: 'event_5', 
    title: 'Crypto Gaming Expo', 
    price: 1200, 
    totalTickets: 800, 
    ticketsMinted: 600, 
    date: '2024-10-15T11:00:00Z', 
    venue: 'Hyderabad Gaming Arena', 
    description: 'Gaming meets blockchain - discover play-to-earn games, NFT gaming assets, and metaverse experiences.',
    image: '#8b5cf6',
    category: 'Gaming',
    organizer: 'GameFi Studios'
  },
  { 
    id: 'event_6', 
    title: 'Smart Contract Security Workshop', 
    price: 3500, 
    totalTickets: 150, 
    ticketsMinted: 89, 
    date: '2024-11-20T10:00:00Z', 
    venue: 'Chennai Tech Hub', 
    description: 'Learn smart contract auditing, security best practices, and vulnerability assessment techniques.',
    image: '#ef4444',
    category: 'Security',
    organizer: 'CyberSec Academy'
  }
];

const DashboardPage = () => {
  const { user, walletAddress } = useAuth();
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [filteredEvents, setFilteredEvents] = useState(MOCK_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingFlow, setBookingFlow] = useState({
    event: null,
    identityVerified: false,
    identity: null,
  });

  // Get unique categories
  const categories = ['All', ...new Set(events.map(event => event.category))];

  // Filter events based on search and category
  useEffect(() => {
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
    
    setFilteredEvents(filtered);
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
      {/* Header */}
      <div style={{ 
        background: '#fff', 
        padding: '2rem', 
        borderBottom: '3px solid #000',
        position: 'sticky',
        top: '56px',
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
        {filteredEvents.length === 0 ? (
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