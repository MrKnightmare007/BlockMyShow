import { useState } from 'react';
import { useCurrency, CRYPTO_CONFIG } from '../context/CurrencyContext';

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
  Ticket: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"/>
      <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
    </svg>
  ),
};

const EventCard = ({ event, onSelect }) => {
  const { convertInrToCrypto, cryptoList } = useCurrency();
  const [cardCrypto, setCardCrypto] = useState('ETH');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatDate(event.date);
  const totalTickets = event.totalTickets || 1;
  const ticketsMinted = event.ticketsMinted || 0;
  const soldPercentage = (ticketsMinted / totalTickets) * 100;
  const remaining = totalTickets - ticketsMinted;

  return (
    <div 
      onClick={() => onSelect(event)} 
      className="brutal-card"
      style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} 
    >
      <div style={{ height: '180px', background: event.image, position: 'relative', borderBottom: '3px solid var(--border)' }}>
        <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#000', color: '#fff', padding: '6px 12px', border: '2px solid #fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          {event.category}
        </div>
        {remaining < 50 && (
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: '#ef4444', color: '#fff', border: '2px solid #fff', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Only {remaining} left!
          </div>
        )}
      </div>
      
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '10px', lineHeight: 1.2, height: '3rem', overflow: 'hidden' }}>
          {event.title}
        </h3>
        
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '15px', height: '3.6rem', overflow: 'hidden', lineHeight: 1.5 }}>
          {event.description}
        </p>
        
        <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '15px', padding: '10px', background: 'var(--bg)', border: '2px solid var(--border)' }}>
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Icon.Calendar /> {date} • {time}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Icon.MapPin /> {event.venue}
          </div>
        </div>
        
        <div style={{ marginTop: 'auto' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>
            {event.isResale ? 'VERIFIED SECONDARY MARKET' : `by ${event.organizer || 'Official Partner'}`}
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            {event.isResale ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', fontWeight: 'bold', color: '#f59e0b' }}>
                <span>RESALE TICKET</span>
                <span>SELLER: {event.seller}</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', fontWeight: 'bold' }}>
                  <span>{remaining} AVAIL</span>
                  <span>{Math.round(soldPercentage)}% SOLD</span>
                </div>
                <div style={{ background: 'var(--bg)', border: '2px solid var(--border)', height: '12px', overflow: 'hidden' }}>
                  <div style={{ background: soldPercentage > 80 ? '#ef4444' : soldPercentage > 50 ? '#f59e0b' : 'var(--primary)', height: '100%', width: `${soldPercentage}%`, transition: 'width 0.3s' }} />
                </div>
              </>
            )}
          </div>
          
          <div style={{ borderTop: '3px solid var(--border)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                ₹{event.price.toLocaleString()}
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                background: 'var(--bg)',
                padding: '2px 6px',
                border: '1px solid var(--border)',
                borderRadius: '2px'
              }}>
                <select 
                  value={cardCrypto}
                  onChange={(e) => setCardCrypto(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    outline: 'none',
                    padding: 0
                  }}
                >
                  {cryptoList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                  {CRYPTO_CONFIG[cardCrypto].symbol} {convertInrToCrypto(event.price, cardCrypto)}
                </span>
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
};

export default EventCard;
