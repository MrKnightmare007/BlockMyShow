import React, { useState, useEffect, useContext } from 'react';
import { BlockchainContext } from '../App';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

function MyTickets() {
  const { account, contract } = useContext(BlockchainContext);
  const [tickets, setTickets] = useState([]);
  const [verifiedTickets, setVerifiedTickets] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('confirmed');
  const adminAddress = "0x18D167CdC47E125F564C2BaF2d6FB54bE62c5b61";

  useEffect(() => {
    if (account && contract) {
      fetchTickets();
      fetchTicketRequests();
    } else {
      setLoading(false);
    }
  }, [account, contract]);

  // Add this useEffect to load verified tickets
  useEffect(() => {
    const storedVerifiedTickets = JSON.parse(localStorage.getItem('verifiedTickets') || '[]');
    setVerifiedTickets(storedVerifiedTickets);
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      // Get all ticket requests to find approved ones
      const allRequests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
      const approvedRequests = allRequests.filter(
        req => req.status === 'approved' && 
        req.userAddress.toLowerCase() === account.toLowerCase()
      );
      
      // Set these as tickets directly - this is the key change
      setTickets(approvedRequests.map(req => ({
        tokenId: req.tokenId || 'N/A',
        aadharId: req.aadharId,
        pictureHash: req.pictureHash || 'ipfs://QmHash',
        eventName: req.eventName,
        date: req.date || 'Upcoming',
        seatInfo: req.seatId !== undefined ? 
          `Row ${Math.floor(req.seatId / 10) + 1}, Seat ${(req.seatId % 10) + 1}` : 
          "No seat assigned",
        status: "active"
      })));
      
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to fetch tickets');
      setLoading(false);
    }
  };

  const fetchTicketRequests = () => {
    // Get ticket requests from localStorage
    const allRequests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
    
    // Filter pending requests for this user
    const pending = allRequests.filter(
      req => req.userAddress.toLowerCase() === account.toLowerCase() && req.status === 'pending'
    );
    setPendingRequests(pending);
    
    // Filter rejected requests for this user
    const rejected = allRequests.filter(
      req => req.userAddress.toLowerCase() === account.toLowerCase() && req.status === 'rejected'
    );
    setRejectedRequests(rejected);
  };

  const isAdmin = account && account.toLowerCase() === adminAddress.toLowerCase();

  if (!account) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 max-w-md mx-auto">
        <p className="text-center text-gray-700 dark:text-gray-300">Please connect your wallet to view your tickets</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Tickets</h2>
      
      {isAdmin && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200">
            You are logged in as the admin. You can mint tickets for users from the Admin panel.
          </p>
        </div>
      )}
      
      {/* Tabs */}
      <div className="mb-6 border-b dark:border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`py-2 px-4 ${activeTab === 'confirmed' ? 'border-b-2 border-blue-500 font-medium dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Confirmed Tickets
            {tickets.length > 0 && (
              <span className="ml-2 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs font-medium px-2.5 py-0.5 rounded">
                {tickets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-4 ${activeTab === 'pending' ? 'border-b-2 border-blue-500 font-medium dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs font-medium px-2.5 py-0.5 rounded">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`py-2 px-4 ${activeTab === 'rejected' ? 'border-b-2 border-blue-500 font-medium dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Rejected Requests
            {rejectedRequests.length > 0 && (
              <span className="ml-2 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs font-medium px-2.5 py-0.5 rounded">
                {rejectedRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Confirmed Tickets Section */}
      {activeTab === 'confirmed' && (
        <div>
          {loading ? (
            <div className="text-center py-4 text-gray-700 dark:text-gray-300">Loading your tickets...</div>
          ) : tickets.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">You don't have any confirmed tickets yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((ticket) => (
                <div key={ticket.tokenId} className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-md relative bg-white dark:bg-gray-800">
                  {/* Event Image Banner */}
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 relative">
                    <img 
                      src={ticket.eventImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'} 
                      alt={ticket.eventName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                      <div className="p-3 text-white">
                        <h3 className="text-lg font-bold">{ticket.eventName}</h3>
                      </div>
                    </div>
                  </div>
                  
                  {/* Verification Badge - More prominent */}
                  {verifiedTickets.includes(ticket.tokenId.toString()) && (
                    <div className="absolute top-2 right-2 z-10 bg-green-500 text-white px-3 py-1 rounded-full flex items-center text-sm font-bold shadow-md">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Verified at entry
                    </div>
                  )}
                  
                  {/* Ticket Details */}
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{ticket.date}</p>
                      <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full font-medium">Active</span>
                    </div>
                    
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ticket ID</p>
                        <p className="font-medium text-gray-800 dark:text-gray-200">#{ticket.tokenId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Seat</p>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{ticket.seatInfo}</p>
                      </div>
                    </div>
                    
                    {/* Add mini QR code preview */}
                    <div className="flex justify-center my-2">
                      <div className="bg-white p-1 border dark:border-gray-600 rounded-md inline-block">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=TIX${ticket.tokenId}AID${ticket.aadharId.substring(0, 4)}`} 
                          alt="Ticket QR Code" 
                          className="w-16 h-16"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t dark:border-gray-700">
                      <Link 
                        to={`/ticket/${ticket.tokenId}`} 
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 block text-center"
                      >
                        View Ticket
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Pending Requests Section */}
      {activeTab === 'pending' && (
        <div>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No pending ticket requests</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border dark:border-gray-700 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">{request.eventName}</h4>
                    <span className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded">Pending</span>
                  </div>
                  <p className="text-sm mb-1 text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Requested:</span>{' '}
                    {new Date(request.timestamp).toLocaleString()}
                  </p>
                  <p className="text-sm mb-1 text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Aadhar ID:</span>{' '}
                    {request.aadharId}
                  </p>
                  {request.seatId !== undefined && (
                    <p className="text-sm mb-1 text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Seat:</span>{' '}
                      Row {Math.floor(request.seatId / 10) + 1}, Seat {(request.seatId % 10) + 1}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Your ticket request is being processed by the event organizer.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Rejected Requests Section */}
      {activeTab === 'rejected' && (
        <div>
          {rejectedRequests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No rejected ticket requests</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rejectedRequests.map((request) => (
                <div key={request.id} className="border dark:border-gray-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">{request.eventName}</h4>
                    <span className="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded">Rejected</span>
                  </div>
                  <p className="text-sm mb-1 text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Requested:</span>{' '}
                    {new Date(request.timestamp).toLocaleString()}
                  </p>
                  <p className="text-sm mb-1 text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Aadhar ID:</span>{' '}
                    {request.aadharId}
                  </p>
                  {request.seatId !== undefined && (
                    <p className="text-sm mb-1 text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Seat:</span>{' '}
                      Row {Math.floor(request.seatId / 10) + 1}, Seat {(request.seatId % 10) + 1}
                    </p>
                  )}
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                    Your ticket request was rejected by the event organizer.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MyTickets;