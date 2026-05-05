import { useState } from 'react';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:5000/api';

const ResaleModal = ({ isOpen, onClose, ticket, token, onResaleSuccess }) => {
  const [price, setPrice] = useState(ticket.sale_price || '');
  const [loading, setLoading] = useState(false);
  const maxQuantity = parseInt(ticket.quantity) || 1;

  if (!isOpen) return null;

  const handleList = async () => {
    if (!price || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tickets/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          token_id: ticket.tokenId,
          price: Number(price),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Ticket listed for resale!');
        onResaleSuccess?.();
      } else {
        toast.error(data.message || 'Failed to list ticket');
      }
    } catch (err) {
      console.error('Error listing ticket:', err);
      toast.error('Network error while listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(0,0,0,0.8)', 
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
          background: 'var(--surface)', 
          border: '3px solid var(--border)', 
          maxWidth: '400px', 
          width: '100%', 
          boxShadow: '8px 8px 0 var(--border)',
          padding: '30px'
        }}
      >
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '10px', textTransform: 'uppercase' }}>
          Resell Ticket
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px', lineHeight: 1.5 }}>
          You can list your tickets for resale at the original purchase price. 
          Anti-scalping rules are active.
        </p>

        <div style={{ marginBottom: '25px', padding: '15px', background: 'var(--bg)', border: '2px solid var(--border)' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{ticket.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Original Price: ₹{ticket.sale_price?.toLocaleString('en-IN') || 'N/A'}</div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
            Resale Price (₹)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter price"
            min="1"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--input-bg)',
              border: '2px solid var(--border)',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          />
        </div>

        <div style={{ 
          fontSize: '12px', 
          color: '#f59e0b', 
          background: 'rgba(245, 158, 11, 0.1)', 
          padding: '10px', 
          border: '1px solid #f59e0b',
          marginBottom: '25px'
        }}>
          ⚠️ You will receive the refund only after another user buys these tickets.
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={onClose}
            disabled={loading}
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: 'transparent', 
              border: '2px solid var(--border)', 
              color: 'var(--text)',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleList}
            disabled={loading}
            className="brutal-btn"
            style={{ 
              flex: 2, 
              padding: '12px', 
              background: 'var(--primary)', 
              color: '#000',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'LISTING...' : 'List for Resale'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResaleModal;
