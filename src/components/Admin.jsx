import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BlockchainContext } from '../App';
import toast from 'react-hot-toast';
// Add this import at the top of the file
import TicketVerification from './TicketVerification';

function Admin() {
  const { account, contract } = useContext(BlockchainContext);
  const [recipient, setRecipient] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [aadharId, setAadharId] = useState('');
  const [pictureHash, setPictureHash] = useState('');
  const [sellBackAddress, setSellBackAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketRequests, setTicketRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('tickets'); // Change default if needed
  
  // Define the admin address - same as in MyTickets.jsx
  const adminAddress = "0x18D167CdC47E125F564C2BaF2d6FB54bE62c5b61";
  
  // Check if current account is admin
  const isAdmin = account && account.toLowerCase() === adminAddress.toLowerCase();

  useEffect(() => {
    if (contract) {
      fetchSellBackAddress();
    }
    
    // Load ticket requests from localStorage
    const storedRequests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
    setTicketRequests(storedRequests.filter(req => req.status === 'pending'));
    
    // Load events
    const storedEvents = JSON.parse(localStorage.getItem('events') || '[]');
    setEvents(storedEvents);
  }, [contract]);

  const fetchSellBackAddress = async () => {
    try {
      const address = await contract.sellBackAddress();
      setSellBackAddress(address);
    } catch (error) {
      console.error('Error fetching sell-back address:', error);
    }
  };

  const mintTicket = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error('Only the contract owner can mint tickets');
      return;
    }

    if (!recipient || !tokenId || !aadharId || !pictureHash) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      
      // Validate the recipient address
      if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
        toast.error('Invalid recipient address');
        setLoading(false);
        return;
      }
      
      // Validate the token ID
      const tokenIdNumber = parseInt(tokenId);
      if (isNaN(tokenIdNumber) || tokenIdNumber < 0) {
        toast.error('Invalid token ID');
        setLoading(false);
        return;
      }
      
      // Call the mintTicket function
      const tx = await contract.mintTicket(recipient, tokenIdNumber, aadharId, pictureHash);
      await tx.wait();
      
      toast.success('Ticket minted successfully!');
      
      // Clear the form
      setRecipient('');
      setTokenId('');
      setAadharId('');
      setPictureHash('');
    } catch (error) {
      console.error('Error minting ticket:', error);
      toast.error('Failed to mint ticket: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // In the approveTicketRequest function
  const approveTicketRequest = async (request) => {
    if (!isAdmin) {
      toast.error('Only the contract owner can approve tickets');
      return;
    }
  
    try {
      setLoading(true);
      
      // Generate a token ID (in a real app, you'd have a better system)
      const tokenId = Date.now() % 1000000;
      
      // Call the mintTicket function
      const tx = await contract.mintTicket(
        request.userAddress, 
        tokenId, 
        request.aadharId, 
        request.pictureHash
      );
      await tx.wait();
      
      // Update the request status in localStorage
      const allRequests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
      const updatedRequests = allRequests.map(req => 
        req.id === request.id ? 
          {...req, status: 'approved', tokenId, date: new Date().toLocaleDateString()} : 
          req
      );
      localStorage.setItem('ticketRequests', JSON.stringify(updatedRequests));
      
      // Update the UI
      setTicketRequests(updatedRequests.filter(req => req.status === 'pending'));
      
      // Update the event's booked seats
      if (request.seatId !== undefined) {
        const allEvents = JSON.parse(localStorage.getItem('events') || '[]');
        const updatedEvents = allEvents.map(event => {
          if (event.id === request.eventId) {
            return {
              ...event,
              bookedSeats: [...(event.bookedSeats || []), {
                seatId: request.seatId,
                userAddress: request.userAddress,
                tokenId
              }]
            };
          }
          return event;
        });
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        setEvents(updatedEvents);
      }
      
      toast.success(`Ticket minted successfully for ${request.userAddress.substring(0, 6)}...!`);
    } catch (error) {
      console.error('Error approving ticket request:', error);
      toast.error('Failed to approve ticket: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const rejectTicketRequest = (requestId) => {
    // Update the request status in localStorage
    const allRequests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
    const updatedRequests = allRequests.map(req => 
      req.id === requestId ? {...req, status: 'rejected'} : req
    );
    localStorage.setItem('ticketRequests', JSON.stringify(updatedRequests));
    
    // Update the UI
    setTicketRequests(updatedRequests.filter(req => req.status === 'pending'));
    
    toast.success('Ticket request rejected');
  };

  const deleteEvent = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const updatedEvents = events.filter(event => event.id !== eventId);
      localStorage.setItem('events', JSON.stringify(updatedEvents));
      setEvents(updatedEvents);
      toast.success('Event deleted successfully');
    }
  };

  if (!account) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
        <p className="text-center">Please connect your wallet to access admin features</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
        <p className="text-center">Only the contract owner can access this page</p>
        <p className="text-center mt-2 text-sm text-gray-600">
          Connected account: {account}
        </p>
        <p className="text-center mt-2 text-sm text-gray-600">
          Admin account: {adminAddress}
        </p>
      </div>
    );
  }

  // Inside the return statement, update the main container div
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Admin Dashboard</h2>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors ${
            activeTab === 'requests'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Ticket Requests
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors ${
            activeTab === 'events'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Manage Events
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors ${
            activeTab === 'verify'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Verify Tickets
        </button>
        <button
          onClick={() => setActiveTab('mint')}
          className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors ${
            activeTab === 'mint'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Manual Minting
        </button>
      </div>
      
      {/* Ticket Requests Tab */}
      {activeTab === 'requests' && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Pending Ticket Requests</h3>
          
          {loading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading requests...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700 text-left">
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 font-medium text-gray-600 dark:text-gray-300">User</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 font-medium text-gray-600 dark:text-gray-300">Event</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 font-medium text-gray-600 dark:text-gray-300">Aadhar ID</th>
                    <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 font-medium text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-300">
                        {request.userAddress.substring(0, 6)}...{request.userAddress.substring(request.userAddress.length - 4)}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-300">
                        {request.eventName}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-300">
                        {request.aadharId}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 dark:border-gray-600">
                        <button
                          onClick={() => approveTicketRequest(request)}
                          disabled={loading}
                          className="bg-green-500 text-white py-1 px-3 rounded-md text-sm mr-2 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectTicketRequest(request.id)}
                          disabled={loading}
                          className="bg-red-500 text-white py-1 px-3 rounded-md text-sm hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Manage Events Tab */}
      {activeTab === 'events' && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Manage Events</h3>
            <Link 
              to="/admin/add-event" 
              className="bg-blue-600 text-white py-1 px-4 rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Add New Event
            </Link>
          </div>
          
          {events.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No events found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <div key={event.id} className="event-card border dark:border-gray-700 rounded-lg overflow-hidden">
                  <img 
                    src={event.image} 
                    alt={event.name} 
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                    }}
                  />
                  <div className="p-4">
                    <h4 className="font-bold text-lg mb-1 text-gray-800 dark:text-white">{event.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {event.date} • {event.location}
                    </p>
                    <p className="text-sm mb-2 text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Price:</span> {event.price} ETH
                    </p>
                    <p className="text-sm mb-2 text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Seats:</span> {event.bookedSeats?.length || 0}/{event.totalSeats || 100} booked
                    </p>
                    <div className="flex justify-between mt-4">
                      <Link 
                        to={`/admin/edit-event/${event.id}`}
                        className="bg-blue-500 text-white py-1 px-3 rounded-md text-sm hover:bg-blue-600 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="bg-red-500 text-white py-1 px-3 rounded-md text-sm hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Verify Tickets Tab */}
      {activeTab === 'verify' && (
        <div className="mb-8">
          <TicketVerification />
        </div>
      )}
      
      {/* Manual Minting Tab */}
      {activeTab === 'mint' && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Mint New Ticket Manually</h3>
          <form onSubmit={mintTicket} className="max-w-md mint-form">
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0x..."
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Token ID</label>
              <input
                type="number"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter token ID"
                min="0"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Aadhar ID</label>
              <input
                type="text"
                value={aadharId}
                onChange={(e) => setAadharId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter Aadhar ID"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Picture Hash (IPFS)</label>
              <input
                type="text"
                value={pictureHash}
                onChange={(e) => setPictureHash(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="ipfs://..."
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Mint Ticket'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Admin;