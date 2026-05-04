import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QRCode from 'qrcode';

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
  Download: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1"/>
    </svg>
  ),
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const TicketsPage = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedTicketId, setCopiedTicketId] = useState(null);
  const [qrCodes, setQrCodes] = useState({});

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
      return;
    }
    fetchTickets();
  }, [isAuthenticated, token, navigate]);

  useEffect(() => {
    const buildQrCodes = async () => {
      const entries = await Promise.all(
        tickets.map(async (ticket) => {
          const qrData = generateQRCode(ticket.token_id);
          const dataUrl = await QRCode.toDataURL(qrData, {
            width: 220,
            margin: 1,
            color: {
              dark: '#111111',
              light: '#ffffff',
            },
          });

          return [ticket.token_id, dataUrl];
        })
      );

      setQrCodes(Object.fromEntries(entries));
    };

    if (tickets.length > 0) {
      buildQrCodes();
    } else {
      setQrCodes({});
    }
  }, [tickets]);

  const fetchTickets = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/tickets/my-tickets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Failed to fetch tickets');
        return;
      }

      // data.tickets contains array of full ticket objects with event info
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = (tokenId) => {
    // QR code would contain: { tokenId: <number> }
    return JSON.stringify({ tokenId });
  };

  const downloadQR = (tokenId) => {
    // In a real app, you'd generate and download the QR code image
    const qrData = generateQRCode(tokenId);
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(qrData)}`);
    element.setAttribute('download', `ticket-${tokenId}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = (tokenId) => {
    const qrData = generateQRCode(tokenId);
    navigator.clipboard.writeText(qrData);
    setCopiedTicketId(tokenId);
    setTimeout(() => setCopiedTicketId(null), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontFamily: 'Syne, sans-serif', margin: 0 }}>
            My Tickets
          </h1>
          <button
            onClick={fetchTickets}
            style={{
              padding: '10px 20px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Refresh
          </button>
        </div>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
            <p>Loading your tickets...</p>
          </div>
        )}

        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#991b1b', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '2rem'
          }}>
            {error}
          </div>
        )}

        {!loading && tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
            <Icon.Ticket />
            <h3>No tickets found</h3>
            <p>Purchase tickets from the Events page to see them here</p>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: '1rem',
                padding: '10px 20px',
                background: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {tickets.map((ticket) => (
              <div key={ticket.token_id} style={{ 
                border: '3px solid #000', 
                background: '#fff', 
                padding: '20px',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>
                      {ticket.event?.title || 'Event'}
                    </h3>
                    
                    <div style={{ marginBottom: '12px', fontSize: '0.9rem', color: '#666' }}>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Token ID:</strong> {ticket.token_id}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Event ID:</strong> {ticket.event_id}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Venue:</strong> {ticket.event?.venue || 'N/A'}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Date:</strong> {ticket.event?.date ? new Date(ticket.event.date * 1000).toLocaleDateString() : 'N/A'}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Price:</strong> ₹{ticket.event?.price || 'N/A'}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Used:</strong> <span style={{ color: ticket.used ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                          {ticket.used ? 'Yes' : 'No'}
                        </span>
                      </p>
                    </div>

                    <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '0.85rem' }}>
                      <strong>QR Code Data:</strong> {generateQRCode(ticket.token_id)}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '0.85rem' }}>
                      Show this QR code at the gate for entry verification
                    </p>
                  </div>

                  <div style={{
                    minWidth: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      width: '220px',
                      height: '220px',
                      background: '#fff',
                      border: '1px solid #d1d5db',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {qrCodes[ticket.token_id] ? (
                        <img
                          src={qrCodes[ticket.token_id]}
                          alt={`QR code for ticket ${ticket.token_id}`}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Generating QR...</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', textAlign: 'center' }}>
                      Token ID {ticket.token_id}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                    <button
                      onClick={() => copyToClipboard(ticket.token_id)}
                      title="Copy QR data"
                      style={{
                        padding: '8px 12px',
                        background: '#f3f4f6',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Icon.Copy />
                      {copiedTicketId === ticket.token_id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => downloadQR(ticket.token_id)}
                      title="Download QR code"
                      style={{
                        padding: '8px 12px',
                        background: '#f3f4f6',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Icon.Download />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsPage;
