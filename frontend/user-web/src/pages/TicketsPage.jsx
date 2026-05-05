import { useState, useEffect, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

import API_BASE from '../utils/api';

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  Ticket: ({ size = 20 }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Tag: () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  RefreshCw: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  X: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
};

// ── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (unix) => {
  if (!unix) return 'TBA';
  const d = new Date(Number(unix) * 1000);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const GRADIENT_COLORS = [
  'linear-gradient(135deg, #31bbaf 0%, #0a0a0a 100%)',
  'linear-gradient(135deg, #4a90e2 0%, #0a0a0a 100%)',
  'linear-gradient(135deg, #ec4899 0%, #0a0a0a 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #0a0a0a 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #0a0a0a 100%)',
];

// ── Ticket View Modal (with QR) ───────────────────────────────────────────
const TicketViewModal = ({ isOpen, onClose, ticket }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !ticket || !canvasRef.current) return;
    const qrData = `BLOCKMYSHOW:TOKEN:${ticket.token_id}:EVENT:${ticket.event_id}`;
    QRCode.toCanvas(canvasRef.current, qrData, {
      width: 200, margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).catch(console.error);
  }, [isOpen, ticket]);

  if (!isOpen || !ticket) return null;
  const dateStr = formatDate(ticket.event?.date);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '3px solid var(--border)', boxShadow: '8px 8px 0 var(--border)', maxWidth: '420px', width: '100%' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '3px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary)' }}>
          <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: '15px', textTransform: 'uppercase', color: '#000' }}>🎫 NFT Ticket Pass</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000', padding: '4px', fontSize: '18px', lineHeight: 1 }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          {/* QR Code */}
          <div style={{ background: '#fff', padding: '12px', border: '3px solid var(--border)', boxShadow: '4px 4px 0 var(--border)' }}>
            <canvas ref={canvasRef} />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', textAlign: 'center' }}>
            Scan at gate for entry verification
          </div>
          {/* Details */}
          <div style={{ width: '100%', border: '2px solid var(--border)', background: 'var(--bg)', fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>
            {[
              ['Event',   ticket.event?.title || 'Unknown'],
              ['Venue',   ticket.event?.venue || 'TBA'],
              ['Date',    dateStr],
              ['Token ID', `#${ticket.token_id}`],
              ['Event ID', `#${ticket.event_id}`],
              ['Price',   `₹${Number(ticket.salePrice || ticket.event?.price || 0).toLocaleString('en-IN')}`],
              ['Status',  ticket.used ? '✔ USED' : ticket.isListed ? '🏷 LISTED FOR RESALE' : '✅ ACTIVE'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '8px 14px', gap: '12px' }}>
                <span style={{ color: 'var(--muted)', minWidth: '80px', fontSize: '11px', textTransform: 'uppercase' }}>{k}</span>
                <span style={{ color: 'var(--text)', fontWeight: 'bold', wordBreak: 'break-all' }}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="brutal-btn" style={{ width: '100%', padding: '12px', fontSize: '13px' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ── Inline Resale / Update Price Modal ────────────────────────────────────
const ResaleActionModal = ({ isOpen, onClose, ticket, token, onSuccess }) => {
  const isAlreadyListed = ticket?.isListed;
  const [price, setPrice]   = useState('');
  const [loading, setLoading] = useState(false);

  // pre-fill with current listPrice when editing
  useEffect(() => {
    if (isOpen) setPrice(isAlreadyListed ? String(ticket?.listPrice || '') : '');
  }, [isOpen, ticket]);

  if (!isOpen || !ticket) return null;

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const salePrice = Number(ticket?.salePrice || ticket?.event?.price || 0);
  const priceNum  = Number(price);
  const priceOverCap = priceNum > 0 && salePrice > 0 && priceNum > salePrice;

  const handleList = async () => {
    if (!price || priceNum <= 0) { toast.error('Enter a valid price'); return; }
    if (priceOverCap) { toast.error(`Anti-scalping: price cannot exceed ₹${salePrice.toLocaleString('en-IN')}`); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/tickets/list`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ tokenId: String(ticket.token_id), price: priceNum }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to list');
      toast.success('🏷️ Ticket listed for resale!');
      onSuccess();
      onClose();
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleUpdatePrice = async () => {
    if (!price || priceNum <= 0) { toast.error('Enter a valid price'); return; }
    if (priceOverCap) { toast.error(`Anti-scalping: price cannot exceed ₹${salePrice.toLocaleString('en-IN')}`); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/tickets/update-list-price`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ tokenId: String(ticket.token_id), newPrice: Number(price) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to update price');
      toast.success('💰 List price updated!');
      onSuccess();
      onClose();
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/tickets/cancel-listing`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ tokenId: String(ticket.token_id) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to cancel');
      toast.success('❌ Listing cancelled');
      onSuccess();
      onClose();
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', border: '3px solid var(--border)',
        boxShadow: '8px 8px 0 var(--border)', maxWidth: '400px', width: '100%',
        borderRadius: '0',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '3px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: '16px', textTransform: 'uppercase' }}>
            {isAlreadyListed ? 'Manage Resale Listing' : 'List for Resale'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '4px' }}>
            <Icon.X />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Ticket info */}
          <div style={{ padding: '12px 16px', border: '2px solid var(--border)', background: 'var(--bg)', marginBottom: '20px', fontSize: '13px', fontFamily: 'Space Mono, monospace' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--text)', marginBottom: '4px' }}>{ticket.event?.title}</div>
            <div style={{ color: 'var(--muted)' }}>Token #{ticket.token_id} · Original price: ₹{ticket.salePrice?.toLocaleString('en-IN')}</div>
            {isAlreadyListed && (
              <div style={{ marginTop: '6px', color: 'var(--primary)', fontWeight: 'bold' }}>
                Currently listed at: ₹{ticket.listPrice?.toLocaleString('en-IN')}
              </div>
            )}
          </div>

          {/* Price input */}
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)' }}>
            {isAlreadyListed ? 'New List Price (₹)' : 'Resale Price (₹)'}
          </label>
          <input
            type="number" min="1" max={salePrice || undefined}
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder={`Max ₹${salePrice || '—'}`}
            style={{
              width: '100%', padding: '12px', marginBottom: '8px',
              border: `2px solid ${priceOverCap ? '#ef4444' : 'var(--border)'}`,
              background: 'var(--input-bg)',
              color: priceOverCap ? '#ef4444' : 'var(--text)',
              fontFamily: 'Space Mono, monospace',
              fontSize: '18px', fontWeight: 'bold', boxSizing: 'border-box',
            }}
          />
          {salePrice > 0 && (
            <div style={{ fontSize: '12px', marginBottom: '12px', fontFamily: 'Space Mono, monospace', color: priceOverCap ? '#ef4444' : 'var(--muted)' }}>
              {priceOverCap
                ? `⛔ Exceeds original price (₹${salePrice.toLocaleString('en-IN')})`
                : `🛡 Anti-scalping cap: max ₹${salePrice.toLocaleString('en-IN')}`}
            </div>
          )}

          <div style={{ fontSize: '12px', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid #f59e0b', padding: '10px 12px', marginBottom: '20px', fontFamily: 'Space Mono, monospace' }}>
            ⚠ Anti-scalping: you'll receive payment only when another user buys.
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isAlreadyListed ? (
              <>
                <button onClick={handleUpdatePrice} disabled={loading} className="brutal-btn"
                  style={{ width: '100%', padding: '13px', fontSize: '13px', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Updating…' : '💰 Update Price'}
                </button>
                <button onClick={handleCancel} disabled={loading}
                  style={{ width: '100%', padding: '12px', fontSize: '13px', background: 'transparent', border: '2px solid #ef4444', color: '#ef4444', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Space Mono, monospace', fontWeight: 'bold', opacity: loading ? 0.6 : 1 }}>
                  {loading ? '…' : '❌ Cancel Listing'}
                </button>
              </>
            ) : (
              <button onClick={handleList} disabled={loading} className="brutal-btn"
                style={{ width: '100%', padding: '13px', fontSize: '13px', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Listing…' : '🏷️ List for Resale'}
              </button>
            )}
            <button onClick={onClose} style={{ width: '100%', padding: '12px', fontSize: '13px', background: 'transparent', border: '2px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Space Mono, monospace' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Ticket Card ────────────────────────────────────────────────────────────
const TicketCard = ({ ticket, index, tab, token, onRefresh }) => {
  const [resaleOpen, setResaleOpen] = useState(false);
  const [viewOpen, setViewOpen]     = useState(false);
  const gradient = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
  const dateStr  = formatDate(ticket.event?.date);
  const status   = ticket.used ? 'USED' : ticket.isListed ? 'LISTED' : 'ACTIVE';

  const statusColors = {
    ACTIVE: { bg: 'var(--primary)', color: '#000' },
    LISTED: { bg: '#f59e0b', color: '#000' },
    USED:   { bg: '#374151', color: '#9ca3af' },
  };

  return (
    <>
      <div className="brutal-card fade-in" style={{ display: 'flex', padding: 0, overflow: 'hidden' }}>

        {/* Colour strip */}
        <div style={{
          width: '130px', flexShrink: 0,
          background: gradient,
          borderRight: '3px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', padding: '20px', gap: '8px',
        }}>
          <Icon.Ticket size={28} />
          <div style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.85 }}>NFT PASS</div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'Space Mono, monospace' }}>#{ticket.token_id}</div>
        </div>

        {/* Details */}
        <div style={{ padding: '20px 24px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ticket.event?.title || 'Unknown Event'}
            </h3>

            <div style={{ display: 'flex', gap: '18px', fontSize: '13px', color: 'var(--muted)', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Icon.Calendar /> {dateStr}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Icon.MapPin /> {ticket.event?.venue || 'TBA'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--bg)', border: '2px solid var(--border)', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontWeight: 'bold' }}>
                TOKEN #{ticket.token_id}
              </span>
              <span style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--bg)', border: '2px solid var(--border)', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontWeight: 'bold' }}>
                EVENT #{ticket.event_id}
              </span>
              <span style={{
                fontSize: '11px', padding: '4px 10px',
                background: statusColors[status].bg,
                color: statusColors[status].color,
                border: '2px solid var(--border)',
                fontWeight: 'bold', textTransform: 'uppercase',
              }}>
                {status}
              </span>
              {ticket.isListed && (
                <span style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(245,158,11,0.1)', border: '2px solid #f59e0b', color: '#f59e0b', fontFamily: 'Space Mono, monospace', fontWeight: 'bold' }}>
                  <Icon.Tag /> ₹{ticket.listPrice?.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {/* Right col */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text)', fontFamily: 'Space Mono, monospace' }}>
              ₹{Number(ticket.salePrice || ticket.event?.price || 0).toLocaleString('en-IN')}
            </div>

            {/* Action buttons */}
            {tab === 'active' && !ticket.used && !ticket.isListed && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="brutal-btn" onClick={() => setViewOpen(true)}
                  style={{ padding: '9px 14px', fontSize: '12px', background: 'var(--surface)', color: 'var(--text)' }}>
                  🎫 View
                </button>
                <button className="brutal-btn" onClick={() => setResaleOpen(true)}
                  style={{ padding: '9px 14px', fontSize: '12px', background: 'var(--surface)', color: '#f59e0b', borderColor: '#f59e0b' }}>
                  🏷️ Resell
                </button>
              </div>
            )}
            {tab === 'resell' && (
              <button className="brutal-btn" onClick={() => setResaleOpen(true)}
                style={{ padding: '9px 16px', fontSize: '12px', background: 'var(--surface)', color: '#f59e0b', borderColor: '#f59e0b' }}>
                ✏️ Edit Listing
              </button>
            )}
            {tab === 'used' && (
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', padding: '9px 16px', border: '2px solid var(--border)' }}>
                ✔ Entry Used
              </span>
            )}
          </div>
        </div>
      </div>

      <ResaleActionModal
        isOpen={resaleOpen}
        onClose={() => setResaleOpen(false)}
        ticket={ticket}
        token={token}
        onSuccess={onRefresh}
      />
      <TicketViewModal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        ticket={ticket}
      />
    </>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState('active');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE}/tickets/my-tickets`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load tickets');
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Classify tickets
  const activeTickets = tickets.filter(t => !t.used && !t.isListed);
  const resellTickets = tickets.filter(t => t.isListed);
  const usedTickets   = tickets.filter(t => t.used);

  const TABS = [
    { key: 'active', label: 'Active',   count: activeTickets.length, color: 'var(--primary)' },
    { key: 'resell', label: 'Resale',   count: resellTickets.length, color: '#f59e0b' },
    { key: 'used',   label: 'Used',     count: usedTickets.length,   color: '#6b7280' },
  ];

  const currentTickets = activeTab === 'active' ? activeTickets
    : activeTab === 'resell' ? resellTickets
    : usedTickets;

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--bg)', padding: '40px 20px' }}>
      <style>{`
        .fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', borderBottom: '3px solid var(--border)', paddingBottom: '18px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.2rem', color: 'var(--text)', margin: '0 0 6px', textTransform: 'uppercase' }}>
              My Tickets
            </h1>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '13px', fontFamily: 'Space Mono, monospace' }}>
              {tickets.length} NFT ticket{tickets.length !== 1 ? 's' : ''} in your wallet
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetchTickets} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: 'bold' }}>
              <Icon.RefreshCw /> Refresh
            </button>
            <Link to="/" className="brutal-btn" style={{ textDecoration: 'none', padding: '10px 18px', fontSize: '13px' }}>
              Browse Events
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '32px', border: '3px solid var(--border)', width: 'fit-content' }}>
          {TABS.map((tab, i) => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '12px 28px',
                background: isActive ? tab.color : 'var(--surface)',
                color: isActive ? '#000' : 'var(--muted)',
                border: 'none',
                borderLeft: i > 0 ? '3px solid var(--border)' : 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                textTransform: 'uppercase', fontFamily: 'Space Mono, monospace',
                letterSpacing: '0.5px',
                transition: 'all 0.15s',
                boxShadow: isActive ? 'inset 0 -3px 0 rgba(0,0,0,0.2)' : 'none',
              }}>
                {tab.label}
                <span style={{
                  marginLeft: '8px', fontSize: '11px', fontWeight: 'bold',
                  background: isActive ? 'rgba(0,0,0,0.2)' : 'var(--bg)',
                  color: isActive ? '#000' : 'var(--muted)',
                  padding: '2px 7px', borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading && <Loader fullScreen text="Accessing ticket vault..." />}

        {!loading && error && (
          <div className="brutal-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠</div>
            <p style={{ color: '#ef4444', fontFamily: 'Space Mono, monospace', fontSize: '13px', marginBottom: '16px' }}>{error}</p>
            <button onClick={fetchTickets} className="brutal-btn" style={{ padding: '10px 24px', fontSize: '13px' }}>Try Again</button>
          </div>
        )}

        {!loading && !error && currentTickets.length === 0 && (
          <div className="brutal-card fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', opacity: 0.4 }}>
              <Icon.Ticket size={48} />
            </div>
            <h3 style={{ marginTop: 0, marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'Syne, sans-serif', fontSize: '18px' }}>
              No {TABS.find(t => t.key === activeTab)?.label} Tickets
            </h3>
            <p style={{ fontSize: '13px', fontFamily: 'Space Mono, monospace', margin: '0 0 20px' }}>
              {activeTab === 'active' && "You don't have any active tickets. Book an event!"}
              {activeTab === 'resell' && "You haven't listed any tickets for resale."}
              {activeTab === 'used' && "No used tickets yet."}
            </p>
            {activeTab === 'active' && (
              <Link to="/" className="brutal-btn" style={{ textDecoration: 'none', padding: '12px 24px', fontSize: '13px' }}>
                Browse Events →
              </Link>
            )}
          </div>
        )}

        {!loading && !error && currentTickets.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {currentTickets.map((ticket, i) => (
              <TicketCard
                key={ticket.token_id}
                ticket={ticket}
                index={i}
                tab={activeTab}
                token={token}
                onRefresh={fetchTickets}
              />
            ))}
          </div>
        )}

        {/* Resale tab legend */}
        {activeTab === 'resell' && resellTickets.length > 0 && (
          <div style={{ marginTop: '24px', padding: '14px 18px', border: '2px dashed var(--border)', background: 'var(--surface)', fontSize: '12px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', lineHeight: 1.8 }}>
            <strong style={{ color: 'var(--text)' }}>Resale actions available:</strong><br />
            • <strong style={{ color: '#f59e0b' }}>Edit Listing</strong> — update the list price<br />
            • <strong style={{ color: '#ef4444' }}>Cancel Listing</strong> — remove from marketplace
          </div>
        )}

      </div>
    </div>
  );
}
