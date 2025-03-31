import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlockchainContext } from '../App';
import toast from 'react-hot-toast';

function AddEvent({ isEditing = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, isOwner } = useContext(BlockchainContext);
  
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [totalSeats, setTotalSeats] = useState(100);
  const [rows, setRows] = useState(10);
  const [columns, setColumns] = useState(10);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isEditing && id) {
      // Load event data for editing
      const events = JSON.parse(localStorage.getItem('events') || '[]');
      const event = events.find(e => e.id.toString() === id);
      
      if (event) {
        setName(event.name);
        setDate(event.date);
        setLocation(event.location);
        setPrice(event.price);
        setDescription(event.description);
        setImage(event.image);
        setTotalSeats(event.totalSeats || 100);
        setRows(event.rows || 10);
        setColumns(event.columns || 10);
      } else {
        toast.error('Event not found');
        navigate('/admin');
      }
    }
  }, [isEditing, id, navigate]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isOwner) {
      toast.error('Only admin can add or edit events');
      return;
    }
    
    if (!name || !date || !location || !price || !description || !image) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get existing events
      const events = JSON.parse(localStorage.getItem('events') || '[]');
      
      if (isEditing) {
        // Update existing event
        const updatedEvents = events.map(event => {
          if (event.id.toString() === id) {
            return {
              ...event,
              name,
              date,
              location,
              price,
              description,
              image,
              totalSeats,
              rows,
              columns,
              updatedAt: new Date().toISOString()
            };
          }
          return event;
        });
        
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        toast.success('Event updated successfully');
      } else {
        // Add new event
        const newEvent = {
          id: Date.now(),
          name,
          date,
          location,
          price,
          description,
          image,
          totalSeats,
          rows,
          columns,
          bookedSeats: [],
          createdAt: new Date().toISOString()
        };
        
        events.push(newEvent);
        localStorage.setItem('events', JSON.stringify(events));
        toast.success('Event added successfully');
      }
      
      // Redirect to admin dashboard
      navigate('/admin');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setLoading(false);
    }
  };
  
  if (!account) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
        <p className="text-center">Please connect your wallet to access this page</p>
      </div>
    );
  }
  
  if (!isOwner) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
        <p className="text-center">Only admin can access this page</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Event' : 'Add New Event'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Event Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter event name"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter event location"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Price (ETH)</label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="0.01"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows="4"
            placeholder="Enter event description"
          ></textarea>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Image URL</label>
          <input
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter image URL"
          />
          {image && (
            <div className="mt-2">
              <img
                src={image}
                alt="Preview"
                className="w-full h-40 object-cover rounded-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                }}
              />
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Seating Configuration</label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Total Seats</label>
              <input
                type="number"
                value={totalSeats}
                onChange={(e) => setTotalSeats(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Rows</label>
              <input
                type="number"
                value={rows}
                onChange={(e) => {
                  const newRows = parseInt(e.target.value);
                  setRows(newRows);
                  setTotalSeats(newRows * columns);
                }}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Columns</label>
              <input
                type="number"
                value={columns}
                onChange={(e) => {
                  const newColumns = parseInt(e.target.value);
                  setColumns(newColumns);
                  setTotalSeats(rows * newColumns);
                }}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
              />
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : (isEditing ? 'Update Event' : 'Add Event')}
        </button>
      </form>
    </div>
  );
}

export default AddEvent;