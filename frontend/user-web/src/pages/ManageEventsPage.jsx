/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const initialCreateForm = {
  title: '',
  venue: '',
  date: '',
  price: '',
  totalTickets: '',
  metadataURI: ''
};

const initialUpdateForm = {
  eventId: '',
  metadataURI: ''
};

const normalizeEvent = (event) => {
  const eventDate = Number(event.date);

  return {
    ...event,
    id: String(event.eventId),
    dateLabel: Number.isFinite(eventDate)
      ? new Date(eventDate * 1000).toLocaleString('en-IN')
      : event.date
  };
};

const ManageEventsPage = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [updateForm, setUpdateForm] = useState(initialUpdateForm);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    setEventsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/events`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || data.error || 'Failed to load events');
      }

      setEvents((data.events || []).map(normalizeEvent));
    } catch (err) {
      setError(err.message);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: createForm.title,
          venue: createForm.venue,
          date: new Date(createForm.date).getTime() / 1000, // Convert to Unix timestamp
          price: Number(createForm.price),
          totalTickets: Number(createForm.totalTickets),
          metadataURI: createForm.metadataURI
        })
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || data.error || 'Failed to create event');
      }

      setMessage(`Event #${data.event.eventId} created on chain: ${data.event.transactionHash}`);
      setCreateForm(initialCreateForm);
      await fetchEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMetadata = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_BASE}/events/${updateForm.eventId}/metadata`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          metadataURI: updateForm.metadataURI
        })
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || data.error || 'Failed to update event metadata');
      }

      setMessage(`Event #${data.event.eventId} metadata updated: ${data.event.transactionHash}`);
      setUpdateForm(initialUpdateForm);
      await fetchEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '2px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
    background: '#fff'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '6px',
    display: 'block'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <div style={{
        background: '#fff',
        padding: '2rem',
        borderBottom: '3px solid #000',
        position: 'sticky',
        top: '56px',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '2rem',
            fontFamily: 'Syne, sans-serif',
            marginBottom: '4px'
          }}>
            Manage Events
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Create contract events and update event metadata
          </p>
        </div>
      </div>

      <div style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        <div style={{
          border: '3px solid #000',
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '4px 4px 0 #000'
        }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', marginBottom: '16px' }}>
            Create Event
          </h2>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input
                style={inputStyle}
                value={createForm.title}
                onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Venue</label>
              <input
                style={inputStyle}
                value={createForm.venue}
                onChange={e => setCreateForm({ ...createForm, venue: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="datetime-local"
                style={inputStyle}
                value={createForm.date}
                onChange={e => setCreateForm({ ...createForm, date: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Price</label>
                <input
                  type="number"
                  min="0"
                  style={inputStyle}
                  value={createForm.price}
                  onChange={e => setCreateForm({ ...createForm, price: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Total Tickets</label>
                <input
                  type="number"
                  min="1"
                  style={inputStyle}
                  value={createForm.totalTickets}
                  onChange={e => setCreateForm({ ...createForm, totalTickets: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Metadata URI</label>
              <input
                style={inputStyle}
                value={createForm.metadataURI}
                onChange={e => setCreateForm({ ...createForm, metadataURI: e.target.value })}
              />
            </div>
            <button
              onClick={handleCreateEvent}
              disabled={loading || !createForm.title || !createForm.venue || !createForm.date || !createForm.price || !createForm.totalTickets || !createForm.metadataURI}
              style={{
                width: '100%',
                padding: '12px',
                background: '#000',
                color: '#fff',
                border: '2px solid #000',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'monospace',
                borderRadius: '4px',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Submitting...' : 'Create On Chain'}
            </button>
          </div>
        </div>

        <div style={{
          border: '3px solid #000',
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '4px 4px 0 #000'
        }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', marginBottom: '16px' }}>
            Update Metadata
          </h2>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Event ID</label>
              <input
                type="number"
                min="0"
                style={inputStyle}
                value={updateForm.eventId}
                onChange={e => setUpdateForm({ ...updateForm, eventId: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>New Metadata URI</label>
              <input
                style={inputStyle}
                value={updateForm.metadataURI}
                onChange={e => setUpdateForm({ ...updateForm, metadataURI: e.target.value })}
              />
            </div>
            <button
              onClick={handleUpdateMetadata}
              disabled={loading || updateForm.eventId === '' || !updateForm.metadataURI}
              style={{
                width: '100%',
                padding: '12px',
                background: '#000',
                color: '#fff',
                border: '2px solid #000',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'monospace',
                borderRadius: '4px',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Updating...' : 'Update Metadata'}
            </button>

            {message && (
              <div style={{
                background: '#f0fdf4',
                color: '#166534',
                padding: '12px',
                fontSize: '12px',
                border: '2px solid #16a34a',
                borderRadius: '4px',
                wordBreak: 'break-all'
              }}>
                {message}
              </div>
            )}

            {error && (
              <div style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: '12px',
                fontSize: '12px',
                border: '2px solid #dc2626',
                borderRadius: '4px'
              }}>
                {error}
              </div>
            )}
          </div>
        </div>

        <div style={{
          gridColumn: '1 / -1',
          border: '3px solid #000',
          background: '#fff',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', marginBottom: '16px' }}>
            On-Chain Events
          </h2>

          {eventsLoading ? (
            <p style={{ color: '#666', fontSize: '14px' }}>Loading events...</p>
          ) : events.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>No events found.</p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {events.map(event => (
                <div
                  key={event.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 160px 120px',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '12px',
                    border: '2px solid #eee',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>#{event.eventId}</div>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{event.title}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{event.venue} • {event.dateLabel}</div>
                    <div style={{ fontSize: '11px', color: '#888', wordBreak: 'break-all' }}>{event.metadataURI}</div>
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    {event.ticketsMinted} / {event.totalTickets} minted
                  </div>
                  <div style={{ fontWeight: 'bold' }}>₹{Number(event.price).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageEventsPage;
