import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlockchainContext } from '../App';
import toast from 'react-hot-toast';

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, contract, isOwner } = useContext(BlockchainContext);
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [aadharId, setAadharId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    // Load event data
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const foundEvent = events.find(e => e.id.toString() === id);
    
    if (foundEvent) {
      setEvent(foundEvent);
    } else {
      toast.error('Event not found');
      navigate('/events');
    }
    
    setLoading(false);
  }, [id, navigate]);
  
  const handleSeatClick = (seatId) => {
    // Check if seat is already booked
    if (event.bookedSeats && event.bookedSeats.some(seat => seat.seatId === seatId)) {
      return; // Seat is already booked
    }
    
    // Toggle seat selection
    setSelectedSeat(selectedSeat === seatId ? null : seatId);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!selectedSeat) {
      toast.error('Please select a seat');
      return;
    }
    
    if (!aadharId) {
      toast.error('Please enter your Aadhar ID');
      return;
    }
    
    // Validate Aadhar ID format (simple validation)
    if (!/^\d{12}$/.test(aadharId)) {
      toast.error('Please enter a valid 12-digit Aadhar ID');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a ticket request
      const ticketRequest = {
        id: Date.now(),
        eventId: parseInt(id),
        eventName: event.name,
        userAddress: account,
        aadharId: aadharId,
        seatId: selectedSeat,
        pictureHash: "ipfs://QmHash", // Placeholder for a real IPFS hash
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      // Save to localStorage
      const existingRequests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
      localStorage.setItem('ticketRequests', JSON.stringify([...existingRequests, ticketRequest]));
      
      toast.success('Ticket request submitted successfully!');
      navigate('/my-tickets');
    } catch (error) {
      console.error('Error submitting ticket request:', error);
      toast.error('Failed to submit ticket request');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="text-center py-10">Loading event details...</div>;
  }
  
  if (!event) {
    return <div className="text-center py-10">Event not found</div>;
  }
  
  // Generate seats grid
  const renderSeats = () => {
    const rows = event.rows || 10;
    const columns = event.columns || 10;
    const seats = [];
    
    for (let row = 0; row < rows; row++) {
      const rowSeats = [];
      for (let col = 0; col < columns; col++) {
        const seatId = row * columns + col;
        const isBooked = event.bookedSeats && event.bookedSeats.some(seat => seat.seatId === seatId);
        const isSelected = selectedSeat === seatId;
        
        rowSeats.push(
          <div 
            key={seatId}
            onClick={() => !isBooked && handleSeatClick(seatId)}
            className={`
              w-8 h-8 m-1 rounded-md flex items-center justify-center cursor-pointer text-xs
              ${isBooked ? 'bg-red-500 text-white cursor-not-allowed' : 
                isSelected ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-blue-100'}
            `}
            title={isBooked ? 'Booked' : `Row ${row + 1}, Seat ${col + 1}`}
          >
            {col + 1}
          </div>
        );
      }
      
      seats.push(
        <div key={row} className="flex items-center mb-2">
          <div className="w-6 text-right mr-2 text-sm font-medium">{row + 1}</div>
          <div className="flex">{rowSeats}</div>
        </div>
      );
    }
    
    return seats;
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Event Header */}
        <div className="relative">
          <img 
            src={event.image} 
            alt={event.name} 
            className="w-full h-64 object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/1200x400?text=No+Image';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
            <div className="p-6 text-white">
              <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
              <p className="text-lg">{event.location} • {event.date}</p>
            </div>
          </div>
        </div>
        
        {/* Event Details */}
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-2">About this event</h2>
            <p className="text-gray-700">{event.description}</p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Select your seat</h2>
            
            <div className="mb-6">
              <div className="w-full bg-gray-300 h-6 rounded-md flex items-center justify-center mb-8">
                SCREEN
              </div>
              
              <div className="flex justify-center">
                <div className="inline-block">
                  {renderSeats()}
                </div>
              </div>
              
              <div className="flex justify-center mt-6 space-x-6">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 rounded-sm mr-2"></div>
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-sm mr-2"></div>
                  <span className="text-sm">Selected</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-sm mr-2"></div>
                  <span className="text-sm">Booked</span>
                </div>
              </div>
            </div>
            
            {selectedSeat !== null && (
              <div className="mt-6 p-4 border rounded-md">
                <h3 className="font-bold mb-2">Booking Details</h3>
                <p className="mb-1">
                  <span className="font-medium">Event:</span> {event.name}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Date:</span> {event.date}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Seat:</span> Row {Math.floor(selectedSeat / event.columns) + 1}, 
                  Seat {(selectedSeat % event.columns) + 1}
                </p>
                <p className="mb-4">
                  <span className="font-medium">Price:</span> {event.price} ETH
                </p>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Aadhar ID</label>
                    <input
                      type="text"
                      value={aadharId}
                      onChange={(e) => setAadharId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter your 12-digit Aadhar ID"
                      maxLength="12"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isSubmitting ? 'Processing...' : 'Request Ticket'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;