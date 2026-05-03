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
    <div style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--bg)', padding: '2rem' }}>
      
      {/* 2-Column Layout */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '30px', flexDirection: 'row', flexWrap: 'wrap' }}>
        
        {/* LEFT SIDEBAR (Filters) */}
        <div style={{ flex: '1 1 300px', maxWidth: '350px' }}>
          <div className="brutal-card" style={{ padding: '24px', position: 'sticky', top: '80px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '8px', textTransform: 'uppercase' }}>Discover Events</h2>
            <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '24px' }}>Browse and book NFT tickets for Web3 events</p>
            
            {/* Search */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Search</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Events, venues, topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '2px solid var(--border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
                  <Icon.Search />
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid var(--border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'All' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Results Count */}
            <div style={{ padding: '12px', background: 'var(--surface)', border: '2px dashed var(--border)', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
              {filteredEvents.length} EVENT{filteredEvents.length !== 1 ? 'S' : ''} FOUND
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT (Event Grid) */}
        <div style={{ flex: '3 1 0%' }}>
          {filteredEvents.length === 0 ? (
            <div className="brutal-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted)' }}>
              <Icon.Search />
              <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>No events found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {filteredEvents.map(event => {
                const { date, time } = formatDate(event.date);
                const soldPercentage = (event.ticketsMinted / event.totalTickets) * 100;
                const remaining = event.totalTickets - event.ticketsMinted;
                
                return (
                  <div 
                    key={event.id} 
                    onClick={() => setSelectedEvent(event)} 
                    className="brutal-card"
                    style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} 
                  >
                    {/* Event Image */}
                    <div style={{ height: '180px', background: event.image, position: 'relative', borderBottom: '3px solid var(--border)' }}>
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#000', color: '#fff', padding: '6px 12px', border: '2px solid #fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {event.category}
                      </div>
                      {remaining < 50 && (
                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'var(--error, #ef4444)', color: '#fff', border: '2px solid #fff', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          Only {remaining} left!
                        </div>
                      )}
                    </div>
                    
                    {/* Event Details */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '10px', lineHeight: 1.2, height: '3rem', overflow: 'hidden' }}>
                        {event.title}
                      </h3>
                      
                      <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '15px', height: '3.6rem', overflow: 'hidden', lineHeight: 1.5 }}>
                        {event.description}
                      </p>
                      
                      {/* Date and Venue */}
                      <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '15px', padding: '10px', background: 'var(--bg)', border: '2px solid var(--border)' }}>
                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                          <Icon.Calendar /> {date} • {time}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                          <Icon.MapPin /> {event.venue}
                        </div>
                      </div>
                      
                      <div style={{ marginTop: 'auto' }}>
                        {/* Organizer */}
                        <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
                          by {event.organizer}
                        </div>
                        
                        {/* Availability Bar */}
                        <div style={{ marginBottom: '15px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', fontWeight: 'bold' }}>
                            <span>{remaining} AVAIL</span>
                            <span>{Math.round(soldPercentage)}% SOLD</span>
                          </div>
                          <div style={{ background: 'var(--bg)', border: '2px solid var(--border)', height: '12px', overflow: 'hidden' }}>
                            <div style={{ background: soldPercentage > 80 ? '#ef4444' : soldPercentage > 50 ? '#f59e0b' : 'var(--primary)', height: '100%', width: `${soldPercentage}%`, transition: 'width 0.3s' }} />
                          </div>
                        </div>
                        
                        {/* Price and Action */}
                        <div style={{ borderTop: '3px solid var(--border)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                              ₹{event.price.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                              per ticket
                            </div>
                          </div>
                          <div className={remaining === 0 ? "" : "brutal-btn"} style={{
                            background: remaining === 0 ? 'var(--muted)' : 'var(--primary)',
                            color: '#000', padding: '10px 16px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px',
                            border: remaining === 0 ? '2px solid var(--border)' : '',
                            textTransform: 'uppercase'
                          }}>
                            <Icon.Ticket />
                            {remaining === 0 ? 'Sold Out' : 'Book Now'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div onClick={() => setSelectedEvent(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} className="brutal-card" style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            
            {/* Modal Header Image */}
            <div style={{ height: '250px', background: selectedEvent.image, position: 'relative', borderBottom: '3px solid var(--border)' }}>
              <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#000', color: '#fff', border: '2px solid #fff', width: '36px', height: '36px', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>
                ×
              </button>
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: '#000', color: '#fff', padding: '8px 16px', border: '2px solid #fff', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {selectedEvent.category}
              </div>
            </div>
            
            {/* Modal Content */}
            <div style={{ padding: '30px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '10px', textTransform: 'uppercase' }}>
                {selectedEvent.title}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '20px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Organized by {selectedEvent.organizer}
              </p>
              
              <p style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '30px', lineHeight: 1.6 }}>
                {selectedEvent.description}
              </p>
              
              {/* Event Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '13px', background: 'var(--bg)', border: '3px solid var(--border)', padding: '20px', marginBottom: '30px' }}>
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 'bold' }}>Date & Time</div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{formatDate(selectedEvent.date).date} • {formatDate(selectedEvent.date).time}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 'bold' }}>Venue</div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{selectedEvent.venue}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 'bold' }}>Price</div>
                  <div style={{ fontWeight: 'bold', fontSize: '20px', color: 'var(--primary)' }}>₹{selectedEvent.price.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 'bold' }}>Availability</div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                    {selectedEvent.totalTickets - selectedEvent.ticketsMinted} / {selectedEvent.totalTickets}
                  </div>
                </div>
              </div>
              
              {/* Book Button */}
              <button 
                onClick={handleBookTicket} 
                disabled={selectedEvent.totalTickets - selectedEvent.ticketsMinted === 0}
                className={selectedEvent.totalTickets - selectedEvent.ticketsMinted === 0 ? "" : "brutal-btn"}
                style={{ 
                  width: '100%', padding: '16px', background: selectedEvent.totalTickets - selectedEvent.ticketsMinted === 0 ? 'var(--muted)' : 'var(--primary)', color: '#000', 
                  border: '3px solid var(--border)', cursor: selectedEvent.totalTickets - selectedEvent.ticketsMinted === 0 ? 'not-allowed' : 'pointer', 
                  fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                }}
              >
                <Icon.Ticket />
                {selectedEvent.totalTickets - selectedEvent.ticketsMinted === 0 
                  ? 'SOLD OUT' 
                  : `BOOK TICKET • ₹${selectedEvent.price.toLocaleString()}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AadhaarModal isOpen={showAadhaarModal} onClose={() => setShowAadhaarModal(false)} onVerified={handleIdentityVerified} eventId={bookingFlow.event?.id} />
      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} event={bookingFlow.event} userWallet={walletAddress} identity={bookingFlow.identity} onPaymentSuccess={handlePaymentSuccess} />
    </div>
  );
};

export default DashboardPage;