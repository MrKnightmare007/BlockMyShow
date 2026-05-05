import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BuyResaleModal from '../components/BuyResaleModal';
import PaymentGatewayModal from '../components/PaymentGatewayModal';
import EventCard from '../components/EventCard';
import { useLocation as useAppLocation } from '../context/LocationContext';
import { useCurrency, CRYPTO_CONFIG } from '../context/CurrencyContext';
import toast from 'react-hot-toast';

import API_BASE from '../utils/api';

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
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"/></svg>
  ),
  Bell: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  ),
};

// Normalize backend event to UI shape
const normalizeEvent = (event, index) => {
  const eventDate = Number(event.date);
  return {
    id: String(event.eventId),
    eventId: event.eventId,
    title: event.title,
    price: Number(event.price),
    totalTickets: Number(event.totalTickets),
    ticketsMinted: Number(event.ticketsMinted),
    date: Number.isFinite(eventDate) ? new Date(eventDate * 1000).toISOString() : event.date,
    venue: event.venue || 'TBA',
    city: event.city || 'Kolkata',
    description: event.description || 'Blockchain-backed event ticketed through BlockMyShow.',
    image: event.photoUrl || `https://picsum.photos/400?random=${index}`,
    organizer: event.organizer || 'BlockMyShow',
    metadataURI: event.metadataURI,
  };
};

const normalizeResale = (ticket, index) => {
  const COLORS = ['linear-gradient(135deg, #4a90e2, #000)', 'linear-gradient(135deg, #ec4899, #000)', 'linear-gradient(135deg, #31bbaf, #000)'];
  return {
    id: `resale_${ticket.token_id}`,
    eventId: ticket.event?.eventId || ticket.event_id,
    title: `${ticket.event?.title || 'Event'} (RESALE)`,
    price: Number(ticket.list_price),
    seller: ticket.seller_address || '0x???',
    venue: ticket.event?.venue || 'TBA',
    city: ticket.event?.city || 'Kolkata',
    date: ticket.event?.date
      ? (Number.isFinite(Number(ticket.event.date)) ? new Date(Number(ticket.event.date) * 1000).toISOString() : ticket.event.date)
      : new Date().toISOString(),
    category: ticket.event?.category || 'Technology',
    image: COLORS[index % COLORS.length],
    description: `Resale ticket — originally ₹${ticket.sale_price || ticket.event?.price || 'N/A'}`,
    isResale: true,
    tokenId: ticket.token_id,
    salePrice: ticket.sale_price,
  };
};

// Placeholder until API loads
const MOCK_EVENTS = [
  { 
    id: 'event_1', 
    title: 'Web3 Summit Mumbai 2024', 
    price: 2500, 
    totalTickets: 1000, 
    ticketsMinted: 450, 
    date: '2024-06-15T10:00:00Z', 
    venue: 'Mumbai Convention Centre', 
    city: 'Mumbai',
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
    city: 'Delhi',
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
    city: 'Mumbai',
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
    city: 'Bangalore',
    description: 'Explore the future of decentralized finance with industry leaders and protocol developers.',
    image: '#f59e0b',
    category: 'Finance',
    organizer: 'DeFi Alliance'
  },
  { 
    id: 'event_5', 
    title: 'Crypto Gaming Expo Hyderabad', 
    price: 1200, 
    totalTickets: 800, 
    ticketsMinted: 600, 
    date: '2024-10-15T11:00:00Z', 
    venue: 'Hyderabad Gaming Arena', 
    city: 'Hyderabad',
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
    city: 'Chennai',
    description: 'Learn smart contract auditing, security best practices, and vulnerability assessment techniques.',
    image: '#ef4444',
    category: 'Security',
    organizer: 'CyberSec Academy'
  },
  { 
    id: 'event_7', 
    title: 'Kolkata Web3 Meetup', 
    price: 0, 
    totalTickets: 200, 
    ticketsMinted: 150, 
    date: '2024-12-05T17:00:00Z', 
    venue: 'Salt Lake Sector V', 
    city: 'Kolkata',
    description: 'Networking event for blockchain enthusiasts and developers in the City of Joy.',
    image: '#31bbaf',
    category: 'Technology',
    organizer: 'Kolkata Crypto'
  },
  { 
    id: 'event_8', 
    title: 'NFT Music Fest Kolkata', 
    price: 1200, 
    totalTickets: 500, 
    ticketsMinted: 120, 
    date: '2025-01-12T19:00:00Z', 
    venue: 'Nicco Park Big Lawn', 
    city: 'Kolkata',
    description: 'Live music performances with NFT-gated access and exclusive artist drops.',
    image: '#a855f7',
    category: 'Entertainment',
    organizer: 'Music3'
  }
];

const MOCK_RESALE_TICKETS = [
  {
    id: 'resale_1',
    eventId: 'event_1',
    title: 'Web3 Summit Mumbai (RESALE)',
    price: 2500,
    seller: '0x742d...44e',
    venue: 'Mumbai Convention Centre',
    city: 'Mumbai',
    date: '2024-06-15T10:00:00Z',
    category: 'Technology',
    image: 'linear-gradient(135deg, #4a90e2, #000)',
    description: 'Selling 1 ticket at original price. Unable to attend due to work travel.',
    isResale: true
  },
  {
    id: 'resale_2',
    eventId: 'event_7',
    title: 'Kolkata Web3 Meetup (RESALE)',
    price: 0,
    seller: '0x123a...bc9',
    venue: 'Salt Lake Sector V',
    city: 'Kolkata',
    date: '2024-12-05T17:00:00Z',
    category: 'Technology',
    image: 'linear-gradient(135deg, #31bbaf, #000)',
    description: 'Free ticket resale. Just want it to go to someone who can attend!',
    isResale: true
  }
];

const DashboardPage = () => {
  const { user, walletAddress, token } = useAuth();
  const { selectedCity } = useAppLocation();
  const { selectedCrypto, setSelectedCrypto, convertInrToCrypto, cryptoList } = useCurrency();
  const [events, setEvents] = useState([]);
  const [resaleTickets, setResaleTickets] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [dateFilter, setDateFilter] = useState('All');
  const [marketType, setMarketType] = useState('Official');
  const [bookingEvent, setBookingEvent] = useState(null);   // active booking event → shows PaymentGatewayModal
  const [buyResaleListing, setBuyResaleListing] = useState(null);

  // Fetch real events and resale listings on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingEvents(true);
      try {
        const [evRes, resaleRes] = await Promise.all([
          fetch(`${API_BASE}/events`),
          fetch(`${API_BASE}/tickets/marketplace`),
        ]);
        const evData = await evRes.json();
        const resaleData = await resaleRes.json();
        if (evData.success) setEvents((evData.events || []).map(normalizeEvent));
        if (resaleData.success) setResaleTickets((resaleData.tickets || []).map(normalizeResale));
      } catch (err) {
        console.error('Failed to fetch events:', err);
        // Fall back to mock data on network error
        setEvents(MOCK_EVENTS);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchData();
  }, []);

  // Filter events based on search, city, price, date, and market type
  useEffect(() => {
    let baseData = marketType === 'Official' ? events : resaleTickets;
    let filtered = baseData;
    
    // City filter
    if (selectedCity) {
      filtered = filtered.filter(event => event.city === selectedCity);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Price filter
    filtered = filtered.filter(event => 
      event.price >= priceRange.min && event.price <= priceRange.max
    );

    // Date filter
    if (dateFilter !== 'All') {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        
        if (dateFilter === 'Today') {
          return eventDate.toDateString() === today.toDateString();
        }
        
        if (dateFilter === 'This Week') {
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          return eventDate >= today && eventDate <= nextWeek;
        }
        
        if (dateFilter === 'This Month') {
          const nextMonth = new Date(today);
          nextMonth.setMonth(today.getMonth() + 1);
          return eventDate >= today && eventDate <= nextMonth;
        }
        
        return true;
      });
    }
    
    setFilteredEvents(filtered);
  }, [searchTerm, selectedCity, priceRange, dateFilter, marketType, events]);

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
    setBookingEvent(selectedEvent);
  };

  const handleBookingSuccess = (ticketData) => {
    // Ticket minted — close modal and reset
    setBookingEvent(null);
    setSelectedEvent(null);
    toast.success(`🎫 Ticket #${ticketData?.token_id ?? ''} minted!`, { duration: 4000 });
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

            {/* Market Type Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Market Type</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Official', 'Resale'].map(type => (
                  <button
                    key={type}
                    onClick={() => setMarketType(type)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      background: marketType === type ? 'var(--primary)' : 'var(--surface)',
                      color: marketType === type ? '#000' : 'var(--text)',
                      border: '2px solid var(--border)',
                      cursor: 'pointer'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
                Price Range (₹{priceRange.min} - ₹{priceRange.max})
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '50%',
                    padding: '8px',
                    border: '2px solid var(--border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                />
                <span style={{ fontWeight: 'bold' }}>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '50%',
                    padding: '8px',
                    border: '2px solid var(--border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                />
              </div>
              <input 
                type="range" 
                min="0" 
                max="10000" 
                step="500"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                style={{ width: '100%', marginTop: '12px', cursor: 'pointer', accentColor: 'var(--primary)' }}
              />
            </div>

            {/* Date Filter */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Timeframe</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['All', 'Today', 'This Week', 'This Month'].map(period => (
                  <button
                    key={period}
                    onClick={() => setDateFilter(period)}
                    style={{
                      flex: '1 1 45%',
                      padding: '8px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      background: dateFilter === period ? 'var(--primary)' : 'var(--surface)',
                      color: dateFilter === period ? '#000' : 'var(--text)',
                      border: '2px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: dateFilter === period ? '2px 2px 0 var(--border)' : 'none',
                      transform: dateFilter === period ? 'translate(-1px, -1px)' : 'none'
                    }}
                  >
                    {period}
                  </button>
                ))}
              </div>
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
              <div style={{ fontSize: '32px', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>No events found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {filteredEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onSelect={setSelectedEvent} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div onClick={() => setSelectedEvent(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} className="brutal-card" style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            
            {/* Modal Header Image */}
            <div style={{ height: '250px', backgroundImage: `url(${selectedEvent.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', borderBottom: '3px solid var(--border)' }}>
              <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#000', color: '#fff', border: '2px solid #fff', width: '36px', height: '36px', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>
                ×
              </button>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '20px', color: 'var(--primary)' }}>₹{selectedEvent.price.toLocaleString()}</div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      background: 'var(--surface)',
                      padding: '4px 10px',
                      border: '2px solid var(--border)',
                      width: 'fit-content'
                    }}>
                      <select 
                        value={selectedCrypto}
                        onChange={(e) => setSelectedCrypto(e.target.value)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        {cryptoList.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                        {CRYPTO_CONFIG[selectedCrypto].symbol} {convertInrToCrypto(selectedEvent.price, selectedCrypto)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 'bold' }}>Availability</div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                    {selectedEvent.isResale 
                      ? '1 Ticket Available' 
                      : `${selectedEvent.totalTickets - selectedEvent.ticketsMinted} / ${selectedEvent.totalTickets}`
                    }
                  </div>
                </div>

                {/* Book Button */}
                <button 
                  onClick={() => {
                    const maxQty = selectedEvent.totalTickets - selectedEvent.ticketsMinted;
                    if (selectedEvent.isResale) {
                      // Resale ticket → use buy-resale flow
                      setBuyResaleListing(selectedEvent);
                    } else if (maxQty === 0) {
                      toast.success('Joined Waitlist! We will notify you when a resale ticket is available.', {
                        icon: '🔔',
                        style: { border: '2px solid var(--primary)', background: 'var(--bg)', color: 'var(--text)' }
                      });
                    } else {
                      handleBookTicket();
                    }
                  }}
                  className="brutal-btn"
                  style={{ 
                    gridColumn: 'span 2',
                    width: '100%', padding: '16px', 
                    background: selectedEvent.totalTickets - selectedEvent.ticketsMinted === 0 ? 'var(--bg)' : 'var(--primary)', 
                    color: selectedEvent.totalTickets - selectedEvent.ticketsMinted === 0 ? 'var(--text)' : '#000', 
                    border: '3px solid var(--border)', cursor: 'pointer', 
                    fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textTransform: 'uppercase', fontWeight: 'bold'
                  }}
                >
                  {((selectedEvent.totalTickets - selectedEvent.ticketsMinted) === 0) 
                    ? <><Icon.Bell /> JOIN WAITLIST</>
                    : <><Icon.Ticket /> BOOK TICKET • ₹{selectedEvent.price.toLocaleString()}</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single unified booking modal: Identity → Payment → OTP → Mint */}
      <PaymentGatewayModal
        isOpen={!!bookingEvent}
        onClose={() => setBookingEvent(null)}
        event={bookingEvent}
        onPaymentSuccess={handleBookingSuccess}
      />
      <BuyResaleModal
        listing={buyResaleListing}
        token={token}
        onClose={() => setBuyResaleListing(null)}
        onSuccess={() => {
          setBuyResaleListing(null);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};

export default DashboardPage;
