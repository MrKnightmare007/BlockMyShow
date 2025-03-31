import React, { useState, useContext, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BlockchainContext } from '../App';
import toast from 'react-hot-toast';

// Sample event data (same as in Events.jsx)
const sampleEvents = [
  {
    id: 1,
    name: "Summer Music Festival",
    date: "2023-07-15",
    location: "Central Park",
    price: "0.01",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
    description: "Join us for a day of amazing music performances from top artists."
  },
  {
    id: 2,
    name: "Tech Conference 2023",
    date: "2023-08-22",
    location: "Convention Center",
    price: "0.02",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
    description: "Learn about the latest technologies and network with industry professionals."
  },
  {
    id: 3,
    name: "Sports Championship",
    date: "2023-09-10",
    location: "Stadium Arena",
    price: "0.015",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
    description: "Watch the final match of the championship series live."
  }
];

function BuyTicket() {
  const { account, contract, isOwner } = useContext(BlockchainContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId');
  
  const [event, setEvent] = useState(null);
  const [aadharId, setAadharId] = useState('');
  const [picture, setPicture] = useState(null);
  const [pictureHash, setPictureHash] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventId) {
      // Find the event by ID
      const selectedEvent = sampleEvents.find(e => e.id === parseInt(eventId));
      if (selectedEvent) {
        setEvent(selectedEvent);
      }
    }
  }, [eventId]);

  // Function to handle file upload and generate hash
  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPicture(file);
    
    // In a real app, you would upload this to IPFS or similar
    // For this example, we'll just create a simple hash
    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target.result;
      const hash = await generateSimpleHash(buffer);
      setPictureHash(hash);
    };
    reader.readAsArrayBuffer(file);
  };

  // Simple hash function (for demo purposes only)
  const generateSimpleHash = async (buffer) => {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const requestTicket = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!aadharId || !pictureHash) {
      toast.error('Please provide Aadhar ID and upload a picture');
      return;
    }

    try {
      setLoading(true);
      
      // In a real app, you would send this request to a backend
      // For this demo, we'll simulate a successful request
      
      // Store the request in localStorage (simulating a database)
      const ticketRequests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
      const newRequest = {
        id: Date.now(),
        eventId: event ? event.id : 0,
        eventName: event ? event.name : 'General Admission',
        userAddress: account,
        aadharId,
        pictureHash,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      
      ticketRequests.push(newRequest);
      localStorage.setItem('ticketRequests', JSON.stringify(ticketRequests));
      
      toast.success('Ticket request submitted successfully! The admin will mint your ticket soon.');
      
      // Clear form
      setAadharId('');
      setPicture(null);
      setPictureHash('');
      
      // Redirect to my tickets page after a short delay
      setTimeout(() => {
        navigate('/my-tickets');
      }, 2000);
      
    } catch (error) {
      console.error('Error requesting ticket:', error);
      toast.error('Failed to request ticket: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {event ? `Buy Ticket: ${event.name}` : 'Buy Ticket'}
      </h2>
      
      {event && (
        <div className="mb-6 p-4 border rounded-lg">
          <img 
            src={event.image} 
            alt={event.name} 
            className="w-full h-40 object-cover rounded-md mb-4"
          />
          <h3 className="font-bold text-lg mb-2">{event.name}</h3>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Date:</span> {event.date}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Location:</span> {event.location}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Price:</span> {event.price} ETH
          </p>
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Aadhar ID</label>
        <input
          type="text"
          value={aadharId}
          onChange={(e) => setAadharId(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter your Aadhar ID"
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Your Picture</label>
        <input
          type="file"
          accept="image/*"
          onChange={handlePictureUpload}
          className="w-full"
        />
        {picture && (
          <div className="mt-2">
            <img
              src={URL.createObjectURL(picture)}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-md"
            />
          </div>
        )}
      </div>
      
      <button
        onClick={requestTicket}
        disabled={loading || !account}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Processing...' : `Request Ticket${event ? ` for ${event.price} ETH` : ''}`}
      </button>
      
      {!account && (
        <p className="mt-4 text-red-500 text-sm">Please connect your wallet to buy tickets</p>
      )}
      
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-medium mb-2">How it works:</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Submit your ticket request with Aadhar ID and picture</li>
          <li>The event organizer will verify your information</li>
          <li>Once approved, your NFT ticket will be minted directly to your wallet</li>
          <li>Check the "My Tickets" section to view your tickets</li>
        </ol>
      </div>
    </div>
  );
}

export default BuyTicket;