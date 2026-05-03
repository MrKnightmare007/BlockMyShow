import { useState } from 'react';

const ResaleModal = ({ isOpen, onClose, ticket, onResaleList }) => {
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = parseInt(ticket.quantity) || 1;

  if (!isOpen) return null;

  const handleList = () => {
    onResaleList({
      ticketId: ticket.id,
      quantity: quantity,
      price: ticket.price,
      title: ticket.title
    });
    onClose();
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
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Purchase Price: {ticket.price}</div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
            Quantity to Resell (Max {maxQuantity})
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', border: '2px solid var(--border)', background: 'var(--bg)' }}>
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ padding: '8px 15px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', fontWeight: 'bold' }}
              >-</button>
              <div style={{ padding: '8px 15px', borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>
                {quantity}
              </div>
              <button 
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                style={{ padding: '8px 15px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', fontWeight: 'bold' }}
              >+</button>
            </div>
          </div>
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
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: 'transparent', 
              border: '2px solid var(--border)', 
              color: 'var(--text)',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleList}
            className="brutal-btn"
            style={{ 
              flex: 2, 
              padding: '12px', 
              background: 'var(--primary)', 
              color: '#000',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            List for Resale
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResaleModal;
