import React from 'react';

const Icon = {
  X: () => (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Download: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
    </svg>
  ),
  Share: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
};

const TicketDetailModal = ({ isOpen, onClose, ticket }) => {
  if (!isOpen || !ticket) return null;

  return (
    <div 
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(0,0,0,0.9)', 
        backdropFilter: 'blur(8px)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 2000,
        padding: '20px'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        style={{ 
          background: 'var(--surface)', 
          border: '3px solid var(--border)', 
          maxWidth: '380px', 
          width: '100%', 
          boxShadow: '8px 8px 0 var(--border)',
          borderRadius: '0px',
          position: 'relative',
          overflow: 'hidden',
          maxHeight: '90vh'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '15px', 
            right: '15px', 
            background: 'var(--border)', 
            color: 'var(--surface)', 
            border: 'none', 
            width: '32px', 
            height: '32px', 
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon.X />
        </button>

        {/* Ticket Header (Event Image) */}
        <div style={{ 
          height: '100px', 
          background: ticket.image || 'var(--primary)', 
          borderBottom: '4px dashed var(--border)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '15px'
        }}>
          <div style={{ 
            background: 'var(--border)', 
            color: 'var(--surface)', 
            padding: '4px 8px', 
            fontSize: '9px', 
            fontWeight: 'bold', 
            textTransform: 'uppercase' 
          }}>
            NFT PASS • VERIFIED
          </div>
        </div>

        {/* Ticket Content */}
        <div style={{ padding: '20px' }}>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '1.25rem', 
            marginBottom: '4px', 
            textTransform: 'uppercase',
            color: 'var(--text)'
          }}>
            {ticket.title}
          </h2>
          <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 'bold', marginBottom: '15px' }}>
            TXN ID: {ticket.id}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Date</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon.Calendar /> {ticket.date}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Venue</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon.MapPin /> {ticket.venue}
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div style={{ 
            background: '#fff', 
            padding: '15px', 
            border: '3px solid var(--border)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ 
              width: '140px', 
              height: '140px', 
              background: 'url(https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=' + ticket.id + ')',
              backgroundSize: 'contain',
              marginBottom: '10px'
            }} />
            <div style={{ fontSize: '9px', color: '#000', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>
              SCAN AT ENTRY
            </div>
          </div>

          {/* Barcode Section */}
          <div style={{ marginBottom: '20px' }}>
             <div style={{ 
               height: '30px', 
               background: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 6px)',
               border: '1px solid #000'
             }} />
             <div style={{ textAlign: 'center', fontSize: '8px', fontFamily: 'var(--font-mono)', marginTop: '4px', letterSpacing: '4px' }}>
                {ticket.id.split('-')[1]} 7749 2024
             </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="brutal-btn" style={{ flex: 1, padding: '10px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Icon.Download /> Download
            </button>
            <button className="brutal-btn" style={{ flex: 1, padding: '10px', fontSize: '11px', background: 'var(--surface)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Icon.Share /> Share
            </button>
          </div>
        </div>

        {/* Branding */}
        <div style={{ 
          background: 'var(--border)', 
          color: 'var(--surface)', 
          padding: '10px', 
          textAlign: 'center', 
          fontSize: '9px', 
          fontWeight: 'bold',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          Powered by BlockMyShow • Immutable Web3 Tickets
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
