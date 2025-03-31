import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContext } from 'react';
import { BlockchainContext } from '../App';

function TicketView() {
  const { id } = useParams();
  const { account } = useContext(BlockchainContext);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load ticket data
    const fetchTicket = async () => {
      try {
        console.log("Looking for ticket with ID:", id);
        
        // For demo, get from localStorage
        const allRequests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
        console.log("All ticket requests:", allRequests);
        
        // Try to find the ticket by converting IDs to strings for comparison
        const approvedRequest = allRequests.find(
          req => req.status === 'approved' && String(req.tokenId) === String(id)
        );
        
        console.log("Found ticket:", approvedRequest);
        
        // First, make sure we're storing the image in the ticket state when we find an approved request
        if (approvedRequest) {
          setTicket({
            id: approvedRequest.tokenId,
            eventName: approvedRequest.eventName,
            date: approvedRequest.date || 'Upcoming',
            venue: approvedRequest.location || 'Venue',
            seat: approvedRequest.seatId !== undefined ? 
              `Row ${Math.floor(approvedRequest.seatId / 10) + 1}, Seat ${(approvedRequest.seatId % 10) + 1}` : 
              "General Admission",
            price: approvedRequest.price || '0.1 ETH',
            aadharId: approvedRequest.aadharId,
            purchasedOn: new Date(approvedRequest.timestamp).toLocaleDateString(),
            verified: JSON.parse(localStorage.getItem('verifiedTickets') || '[]').includes(String(id)),
            image: approvedRequest.eventImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80'
          });
        }
        
        if (approvedRequest) {
          setTicket({
            id: approvedRequest.tokenId,
            eventName: approvedRequest.eventName,
            date: approvedRequest.date || 'Upcoming',
            venue: approvedRequest.location || 'Venue',
            seat: approvedRequest.seatId !== undefined ? 
              `Row ${Math.floor(approvedRequest.seatId / 10) + 1}, Seat ${(approvedRequest.seatId % 10) + 1}` : 
              "General Admission",
            price: approvedRequest.price || '0.1 ETH',
            aadharId: approvedRequest.aadharId,
            purchasedOn: new Date(approvedRequest.timestamp).toLocaleDateString(),
            verified: JSON.parse(localStorage.getItem('verifiedTickets') || '[]').includes(String(id)),
            image: approvedRequest.eventImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80'
          });
        } else {
          // Try to find the ticket in the tickets array as a fallback
          const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
          const ticket = tickets.find(t => String(t.id) === String(id));
          
          if (ticket) {
            setTicket({
              id: ticket.id,
              eventName: ticket.eventName,
              date: ticket.date || 'Upcoming',
              venue: ticket.location || 'Venue',
              seat: ticket.seat || "General Admission",
              price: ticket.price || '0.1 ETH',
              aadharId: ticket.aadharId || '123456789012',
              purchasedOn: new Date().toLocaleDateString(),
              verified: JSON.parse(localStorage.getItem('verifiedTickets') || '[]').includes(String(id)),
              image: ticket.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80'
            });
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching ticket:', error);
        setLoading(false);
      }
    };
    
    fetchTicket();
  }, [id]);

  if (loading) {
    return <div className="text-center py-10">Loading ticket...</div>;
  }

  if (!ticket) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-10">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Ticket Not Found</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">The ticket you're looking for could not be found.</p>
        <Link to="/my-tickets" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 inline-block">
          Back to My Tickets
        </Link>
      </div>
    );
  }

  // Then replace the blue gradient header with an image
  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        {/* Ticket Header */}
        <div className="relative">
          <div className="h-32 relative">
            <img 
              src={ticket.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80'} 
              alt={ticket.eventName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-3 text-white">
                <h2 className="text-xl font-bold">{ticket.eventName}</h2>
              </div>
            </div>
          </div>
          
          {/* Verified Badge */}
          {ticket.verified && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Verified at entry
            </div>
          )}
        </div>
        
        {/* Ticket Details */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Date & Time</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{ticket.date}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Venue</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{ticket.venue}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Seat</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{ticket.seat}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">{ticket.price}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Ticket ID</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{ticket.id}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Purchased On</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{ticket.purchasedOn}</p>
          </div>
          
          {/* Divider */}
          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-4"></div>
          
          {/* QR Code */}
          <div className="flex justify-center my-4">
            <div className="p-2 bg-white rounded-md">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TIX${ticket.id}AID${ticket.aadharId.substring(0, 4)}`} 
                alt="Ticket QR Code" 
                className="w-40 h-40"
              />
              <p className="text-center text-xs text-gray-500 mt-1">Scan for entry</p>
            </div>
          </div>
          
          {/* Barcode */}
          <div className="flex justify-center my-4">
            <img 
              src={`https://barcodeapi.org/api/code128/${ticket.id}`} 
              alt="Ticket Barcode" 
              className="h-12"
            />
          </div>
          
          <p className="text-center text-xs text-gray-600 dark:text-gray-400 mt-2">
            This ticket is tied to Aadhar ID: {ticket.aadharId.substring(0, 4)}XXXXXXXX
          </p>
        </div>
        
        {/* Footer */}
        <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
          <Link to="/my-tickets" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            Back to My Tickets
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TicketView;