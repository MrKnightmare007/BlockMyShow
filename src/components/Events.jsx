import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { BlockchainContext } from '../App';

function Events() {
  const { account } = useContext(BlockchainContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load events from localStorage
    const storedEvents = JSON.parse(localStorage.getItem('events') || '[]');
    setEvents(storedEvents);
    setLoading(false);
  }, []);
  
  if (loading) {
    return <div className="text-center py-10">Loading events...</div>;
  }
  
  if (events.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Events</h2>
        <p className="text-gray-500 mb-4">No events available at the moment.</p>
        {!account && (
          <p className="text-blue-600">Please connect your wallet to buy tickets.</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img 
              src={event.image} 
              alt={event.name} 
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
              }}
            />
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2">{event.name}</h3>
              <p className="text-gray-600 mb-2">{event.date} • {event.location}</p>
              <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">{event.price} ETH</span>
                <Link 
                  to={`/event/${event.id}`}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  View Details
                </Link>
              </div>
              {event.bookedSeats && (
                <p className="text-sm text-gray-500 mt-2">
                  {event.bookedSeats.length} / {event.totalSeats || 100} seats booked
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Events;