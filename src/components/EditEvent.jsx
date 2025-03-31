import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [totalSeats, setTotalSeats] = useState('100');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventFound, setEventFound] = useState(true);

  useEffect(() => {
    // Load event data from localStorage
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    console.log('Events from localStorage:', events);
    console.log('Looking for event with ID:', id);
    
    // Convert string IDs to ensure consistent comparison
    const event = events.find(e => String(e.id) === String(id));
    
    if (event) {
      console.log('Event found:', event);
      setName(event.name || '');
      setDescription(event.description || '');
      // Parse date if it exists and contains a space
      setDate(event.date?.split(' ')[0] || '');
      setTime(event.time || '');
      setLocation(event.location || '');
      setPrice(event.price || '');
      setTotalSeats(event.totalSeats || '100');
      setImage(event.image || '');
    } else {
      console.error('Event not found with ID:', id);
      setEventFound(false);
      toast.error('Event not found');
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !description || !date || !time || !location || !price) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get all events from localStorage
      const events = JSON.parse(localStorage.getItem('events') || '[]');
      const eventIndex = events.findIndex(e => e.id === id);
      
      if (eventIndex === -1) {
        toast.error('Event not found');
        return;
      }
      
      // Update the event
      const updatedEvent = {
        ...events[eventIndex],
        name,
        description,
        date: `${date} ${time}`,
        time,
        location,
        price,
        totalSeats,
        image
      };
      
      events[eventIndex] = updatedEvent;
      
      // Save back to localStorage
      localStorage.setItem('events', JSON.stringify(events));
      
      toast.success('Event updated successfully');
      navigate('/admin');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!eventFound) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Event Not Found</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">The event you're trying to edit could not be found.</p>
        <button
          onClick={() => navigate('/admin')}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Admin Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Edit Event</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Event Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows="4"
            required
          ></textarea>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Price (ETH)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              step="0.001"
              min="0"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Total Seats</label>
            <input
              type="number"
              value={totalSeats}
              onChange={(e) => setTotalSeats(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              min="1"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Image URL</label>
          <input
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Updating...' : 'Update Event'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditEvent;