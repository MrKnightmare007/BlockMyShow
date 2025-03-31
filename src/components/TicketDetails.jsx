import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlockchainContext } from '../App';
import TicketView from './TicketView';
import toast from 'react-hot-toast';

function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account } = useContext(BlockchainContext);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!account) {
      toast.error('Please connect your wallet');
      navigate('/');
      return;
    }

    // Load ticket data
    const allRequests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
    const approvedRequest = allRequests.find(
      req => req.status === 'approved' && 
      req.tokenId && 
      req.tokenId.toString() === id &&
      req.userAddress.toLowerCase() === account.toLowerCase()
    );

    if (approvedRequest) {
      // Find event details
      const events = JSON.parse(localStorage.getItem('events') || '[]');
      const event = events.find(e => e.id === approvedRequest.eventId);
      
      setTicket({
        ...approvedRequest,
        eventName: approvedRequest.eventName || (event ? event.name : 'Event'),
        eventImage: event ? event.image : null,
        venue: event ? event.location : 'Venue not specified',
        price: event ? event.price : '0.01',
        date: event ? event.date : 'Upcoming',
        purchaseDate: new Date(approvedRequest.timestamp).toLocaleDateString(),
        seatInfo: approvedRequest.seatId !== undefined ? 
          `Row ${Math.floor(approvedRequest.seatId / 10) + 1}, Seat ${(approvedRequest.seatId % 10) + 1}` : 
          "No seat assigned"
      });
      
      // Check if the ticket is verified
      const verifiedTickets = JSON.parse(localStorage.getItem('verifiedTickets') || '[]');
      setIsVerified(verifiedTickets.includes(id));
    } else {
      toast.error('Ticket not found or not authorized to view');
      navigate('/my-tickets');
    }
    
    setLoading(false);
  }, [id, account, navigate]);

  if (loading) {
    return <div className="text-center py-10">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="text-center py-10">Ticket not found</div>;
  }

  return (
    <div className="py-8">
      <TicketView ticket={ticket} isVerified={isVerified} />
    </div>
  );
}

export default TicketDetails;