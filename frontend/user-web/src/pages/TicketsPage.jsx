import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api/v1';

// Icons
const Icon = {
  Ticket: () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"/>
    </svg>
  ),
  QrCode: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="5" height="5"/>
      <rect x="16" y="3" width="5" height="5"/>
      <rect x="3" y="16" width="5" height="5"/>
    </svg>
  ),
};

// Mock tickets data
const MOCK_TICKETS = [
  {
    tokenId: 1001,
    eventTitle: 'Web3 Summit Mumbai 2024',
    eventDate: '2024-06-15T10:00:00Z',
    venue: 'Mumbai Convention Centre',
    price: 2500,
    used: false,
    purchasedAt: '2024-05-01T10:00:00Z'
  }
];

const TicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState(MOCK_TICKETS);

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'Syne, sans-serif', marginBottom: '2rem' }}>
          My Tickets
        </h1>
        
        {tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
            <Icon.Ticket />
            <h3>No tickets found</h3>
            <p>Purchase tickets from the Events page to see them here</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {tickets.map(ticket => (
              <div key={ticket.tokenId} style={{ 
                border: '3px solid #000', 
                background: '#fff', 
                padding: '20px',
                borderRadius: '8px'
              }}>
                <h3>{ticket.eventTitle}</h3>
                <p>Token ID: {ticket.tokenId}</p>
                <p>Price: ₹{ticket.price}</p>
                <p>Status: {ticket.used ? 'Used' : 'Active'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsPage;