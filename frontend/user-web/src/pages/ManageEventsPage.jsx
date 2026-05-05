import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:5000/api';

const Icon = {
  Plus: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  RefreshCw: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"/>
    </svg>
  ),
};

function ManageEventsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingMetadata, setEditingMetadata] = useState(false);

  const emptyForm = { title: '', venue: '', date: '', price: '', photoUrl: '', totalTickets: '' };
  const [form, setForm] = useState(emptyForm);
  const [metadataForm, setMetadataForm] = useState({ photoUrl: '' });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) { navigate('/'); return; }
    fetchEvents();
  }, [isAuthenticated, isAdmin]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
        toast.success(`Loaded ${data.events?.length || 0} events`);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!form.title || !form.venue || !form.date || !form.price || !form.totalTickets) {
      toast.error('All fields are required');
      return;
    }
    
    setCreating(true);
    try {
      const dateTs = Math.floor(new Date(form.date).getTime() / 1000);
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          venue: form.venue,
          date: dateTs,
          price: Number(form.price),
          photoUrl: form.photoUrl || 'https://picsum.photos/400',
          totalTickets: Number(form.totalTickets),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create event');
      toast.success(`✅ Event created! ID: ${data.event?.eventId}`);
      setForm(emptyForm);
      setActiveTab('list');
      fetchEvents();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateMetadata = async (eventId) => {
    if (!metadataForm.photoUrl) {
      toast.error('Photo URL is required');
      return;
    }
    
    setUpdating(eventId);
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/metadata`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: metadataForm.photoUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to update metadata');
      toast.success('✅ Event metadata updated!');
      setEditingMetadata(false);
      setSelectedEvent(null);
      setMetadataForm({ photoUrl: '' });
      fetchEvents();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleViewEvent = async (eventId) => {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedEvent(data.event);
        setMetadataForm({ photoUrl: data.event.photoUrl || '' });
      }
    } catch (err) {
      toast.error('Failed to load event details');
    }
  };

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--bg)', color: 'var(--text)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem', borderBottom: '3px solid var(--border)', paddingBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            ⚙️ Manage Events
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Create, view, and manage blockchain-backed events</p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--border)', paddingBottom: '1rem' }}>
          {[
            { id: 'list', label: '📋 All Events', icon: '📋' },
            { id: 'create', label: '➕ Create Event', icon: '➕' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                border: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid var(--border)',
                background: activeTab === tab.id ? 'var(--primary)' : 'var(--surface)',
                color: activeTab === tab.id ? '#000' : 'var(--text)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
                boxShadow: activeTab === tab.id ? '2px 2px 0 var(--border)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Events List Tab */}
        {activeTab === 'list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>All Events</h2>
              <button
                onClick={fetchEvents}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  border: '2px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                <Icon.RefreshCw /> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                <p>Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="brutal-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
                <p>No events created yet. Create one to get started!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {events.map(event => {
                  const dateStr = Number.isFinite(Number(event.date))
                    ? new Date(Number(event.date) * 1000).toLocaleDateString('en-IN')
                    : event.date;
                  const total = Number(event.totalTickets);
                  const minted = Number(event.ticketsMinted);
                  const available = total - minted;
                  const soldPercentage = ((minted / total) * 100).toFixed(0);

                  return (
                    <div key={event.eventId} className="brutal-card" style={{ padding: '20px', border: '2px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', hover: { boxShadow: '4px 4px 0 var(--border)' } }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1.5rem' }}>
                        
                        {/* Event Info */}
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                            {event.title}
                          </h3>
                          
                          <div style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
                            <div>📍 {event.venue}</div>
                            <div>📅 {dateStr}</div>
                            <div>💰 ₹{Number(event.price)}</div>
                          </div>

                          {/* Ticket Progress */}
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                              <span>TICKETS SOLD</span>
                              <span>{minted}/{total}</span>
                            </div>
                            <div style={{ background: 'var(--surface)', border: '2px solid var(--border)', height: '12px', overflow: 'hidden' }}>
                              <div 
                                style={{
                                  background: soldPercentage >= 80 ? '#ef4444' : soldPercentage >= 50 ? '#f59e0b' : 'var(--primary)',
                                  height: '100%',
                                  width: `${soldPercentage}%`,
                                  transition: 'width 0.3s'
                                }}
                              />
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', textAlign: 'right' }}>
                              {available} available • {soldPercentage}% sold
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                          <button
                            onClick={() => handleViewEvent(event.eventId)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '10px 12px',
                              border: '2px solid var(--border)',
                              background: 'var(--surface)',
                              color: 'var(--text)',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              transition: 'all 0.2s'
                            }}
                            title="Edit metadata"
                          >
                            <Icon.Edit /> Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create Event Tab */}
        {activeTab === 'create' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Create New Event</h2>
            
            <form onSubmit={handleCreateEvent} className="brutal-card" style={{ padding: '2rem', border: '3px solid var(--border)' }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Concert, Match, Conference"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Venue *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.venue}
                    onChange={e => setForm({ ...form, venue: e.target.value })}
                    placeholder="e.g. Stadium, Arena, Hall"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                      Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid var(--border)',
                        background: 'var(--input-bg)',
                        color: 'var(--text)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      placeholder="500"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid var(--border)',
                        background: 'var(--input-bg)',
                        color: 'var(--text)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Total Tickets *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.totalTickets}
                    onChange={e => setForm({ ...form, totalTickets: e.target.value })}
                    placeholder="1000"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Photo URL (optional)
                  </label>
                  <input
                    type="url"
                    value={form.photoUrl}
                    onChange={e => setForm({ ...form, photoUrl: e.target.value })}
                    placeholder="https://picsum.photos/400"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '14px',
                    border: '2px solid var(--border)',
                    background: creating ? 'var(--surface)' : 'var(--primary)',
                    color: creating ? 'var(--muted)' : '#000',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    opacity: creating ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {creating ? '⏳ Creating on Blockchain...' : '🚀 Create Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Metadata Modal */}
        {selectedEvent && (
          <div onClick={() => setSelectedEvent(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div onClick={e => e.stopPropagation()} className="brutal-card" style={{ maxWidth: '500px', width: '100%', padding: '2rem', border: '3px solid var(--border)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Edit Event Metadata</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '24px', fontWeight: 'bold' }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem', padding: '12px', background: 'var(--surface)', border: '2px solid var(--border)' }}>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Event ID</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedEvent.eventId} • {selectedEvent.title}</p>
              </div>

              <form onSubmit={e => { e.preventDefault(); handleUpdateMetadata(selectedEvent.eventId); }} style={{ display: 'grid', gap: '1.5rem' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Photo URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={metadataForm.photoUrl}
                    onChange={e => setMetadataForm({ ...metadataForm, photoUrl: e.target.value })}
                    placeholder="https://picsum.photos/400"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                {metadataForm.photoUrl && (
                  <div style={{ border: '2px solid var(--border)', padding: '12px', background: 'var(--surface)' }}>
                    <img src={metadataForm.photoUrl} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover', border: '2px solid var(--border)' }} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={updating === selectedEvent.eventId}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '2px solid var(--border)',
                      background: 'var(--primary)',
                      color: '#000',
                      cursor: updating === selectedEvent.eventId ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      opacity: updating === selectedEvent.eventId ? 0.6 : 1
                    }}
                  >
                    {updating === selectedEvent.eventId ? 'Updating...' : '💾 Update Metadata'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '2px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageEventsPage;
