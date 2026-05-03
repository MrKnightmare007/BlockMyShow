import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

// Inline Icons
const Icon = {
  Ticket: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"/></svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
  ),
  MapPin: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  )
};

// Mock Data
const ALL_TICKETS = [
  { id: 'TXN-8429', title: 'Web3 Summit Mumbai 2024', date: 'June 15, 2024', venue: 'Mumbai Convention Centre', status: 'Active', price: '₹2,500', image: 'linear-gradient(135deg, #4a90e2, #000)' },
  { id: 'TXN-9912', title: 'Ethereum Developer Meetup', date: 'August 02, 2024', venue: 'Bangalore Tech Park', status: 'Active', price: '₹1,200', image: 'linear-gradient(135deg, #10b981, #000)' },
  { id: 'TXN-4511', title: 'NFT Art Exhibition Delhi', date: 'May 10, 2024', venue: 'Delhi Art Gallery', status: 'Resaled', price: '₹800', image: 'linear-gradient(135deg, #ec4899, #000)' },
  { id: 'TXN-1102', title: 'Crypto DevCon', date: 'March 10, 2024', venue: 'Virtual Metaverse', status: 'Expired', price: '₹500', image: 'linear-gradient(135deg, #f59e0b, #000)' }
];

export default function TicketsPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('Active');

  const filteredTickets = ALL_TICKETS.filter(t => t.status === activeFilter);

  const FILTERS = ['Active', 'Resaled', 'Expired'];

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--bg)', padding: '40px 20px' }}>
      <style>{`
        .fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', borderBottom: '3px solid var(--border)', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--text)', margin: '0 0 10px 0', textTransform: 'uppercase' }}>My Tickets</h1>
            <p style={{ color: 'var(--muted)', margin: 0, fontWeight: 'bold' }}>Manage your digital passes and NFT tickets</p>
          </div>
          <Link to="/" className="brutal-btn" style={{ textDecoration: 'none', padding: '12px 20px', fontSize: '14px' }}>Browse Events</Link>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
          {FILTERS.map(filter => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: '12px 24px',
                  background: isActive ? 'var(--primary)' : 'var(--surface)',
                  color: isActive ? '#000' : 'var(--text)',
                  border: '3px solid var(--border)',
                  boxShadow: isActive ? '4px 4px 0 var(--border)' : 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '4px 4px 0 var(--border)'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none'; } }}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Ticket Grid */}
        {filteredTickets.length === 0 ? (
          <div className="brutal-card fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <Icon.Ticket />
            </div>
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>No {activeFilter} Tickets</h3>
            <p>You don't have any tickets in this category right now.</p>
          </div>
        ) : (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {filteredTickets.map(ticket => (
              <div key={ticket.id} className="brutal-card" style={{ display: 'flex', padding: 0, overflow: 'hidden' }}>
                
                {/* Visual Stub */}
                <div style={{ width: '150px', background: ticket.image, borderRight: '3px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', padding: '20px' }}>
                  <Icon.Ticket />
                  <div style={{ marginTop: '10px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>NFT PASS</div>
                </div>

                {/* Details */}
                <div style={{ padding: '24px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--text)', fontSize: '22px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{ticket.title}</h3>
                    
                    <div style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '15px', display: 'flex', gap: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                        <Icon.Calendar /> {ticket.date}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                        <Icon.MapPin /> {ticket.venue}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                      <span style={{ fontSize: '11px', padding: '6px 10px', background: 'var(--bg)', border: '2px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>ID: {ticket.id}</span>
                      <span style={{ fontSize: '11px', padding: '6px 10px', background: ticket.status === 'Active' ? 'var(--primary)' : 'var(--bg)', border: `2px solid var(--border)`, color: ticket.status === 'Active' ? '#000' : 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>{ticket.status}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' }}>
                    <div style={{ color: 'var(--text)', fontWeight: 'bold', fontSize: '24px' }}>{ticket.price}</div>
                    
                    {activeFilter === 'Active' ? (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button className="brutal-btn" style={{ background: 'var(--surface)', color: 'var(--text)', padding: '10px 16px', fontSize: '12px' }}>Transfer</button>
                        <button className="brutal-btn" style={{ padding: '10px 16px', fontSize: '12px' }}>View Ticket</button>
                      </div>
                    ) : (
                      <button className="brutal-btn" style={{ marginTop: '15px', background: 'var(--surface)', color: 'var(--text)', padding: '10px 16px', fontSize: '12px' }}>View Details</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
