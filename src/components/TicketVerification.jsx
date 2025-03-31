import React, { useState } from 'react';
import toast from 'react-hot-toast';

function TicketVerification() {
  const [ticketId, setTicketId] = useState('');
  const [aadharId, setAadharId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleScanQR = () => {
    // In a real app, this would open a QR code scanner
    toast.info('QR scanning functionality would be implemented here');
    // For demo purposes, you could set a sample ticket ID
    setTicketId('956763');
  };

  const verifyTicket = async () => {
    if (!ticketId || !aadharId) {
      toast.error('Please enter both Ticket ID and Aadhar ID');
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get tickets from ticketRequests in localStorage
      const tickets = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
      
      console.log("All tickets in localStorage:", tickets);
      console.log("Looking for ticket with tokenId:", ticketId);
      
      // Manual search to debug the issue
      let foundTicket = null;
      for (const ticket of tickets) {
        console.log(`Checking ticket ${ticket.id}:`, ticket);
        // Convert both to strings and trim whitespace
        const ticketTokenId = ticket.tokenId ? String(ticket.tokenId).trim() : '';
        const searchTokenId = String(ticketId).trim();
        
        console.log(`Comparing: "${ticketTokenId}" === "${searchTokenId}"`);
        
        if (ticketTokenId === searchTokenId) {
          console.log("MATCH FOUND:", ticket);
          foundTicket = ticket;
          break;
        }
      }
      
      if (foundTicket) {
        console.log("Found ticket manually:", foundTicket);
        
        // Check if Aadhar ID matches
        if (foundTicket.aadharId === aadharId) {
          setVerificationResult({
            valid: true,
            message: 'Ticket verified successfully!',
            ticketDetails: {
              eventName: foundTicket.eventName,
              date: foundTicket.date || 'N/A',
              seatId: foundTicket.seatId,
              owner: foundTicket.userAddress.substring(0, 6) + '...' + foundTicket.userAddress.substring(foundTicket.userAddress.length - 4)
            }
          });
          toast.success('Ticket verified successfully!');
        } else {
          setVerificationResult({
            valid: false,
            message: 'Aadhar ID does not match for this ticket.'
          });
          toast.error('Aadhar ID verification failed');
        }
      } else {
        // Try finding by ID as fallback
        console.log("No ticket found by tokenId, trying by id");
        
        // Manual search by ID
        for (const ticket of tickets) {
          const ticketId1 = ticket.id ? String(ticket.id).trim() : '';
          const searchId = String(ticketId).trim();
          
          if (ticketId1 === searchId) {
            console.log("Found ticket by id:", ticket);
            
            if (ticket.aadharId === aadharId) {
              setVerificationResult({
                valid: true,
                message: 'Ticket verified successfully!',
                ticketDetails: {
                  eventName: ticket.eventName,
                  date: ticket.date || 'N/A',
                  seatId: ticket.seatId,
                  owner: ticket.userAddress.substring(0, 6) + '...' + ticket.userAddress.substring(ticket.userAddress.length - 4)
                }
              });
              toast.success('Ticket verified successfully!');
            } else {
              setVerificationResult({
                valid: false,
                message: 'Aadhar ID does not match for this ticket.'
              });
              toast.error('Aadhar ID verification failed');
            }
            setVerifying(false);
            return;
          }
        }
        
        setVerificationResult({
          valid: false,
          message: 'Invalid ticket ID. No ticket found with this ID.'
        });
        toast.error('Ticket not found');
      }
    } catch (error) {
      console.error('Error verifying ticket:', error);
      setVerificationResult({
        valid: false,
        message: 'Error verifying ticket: ' + error.message
      });
      toast.error('Verification error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Verify Tickets</h3>
      
      <div className="bg-gray-800 rounded-lg p-6 shadow-md max-w-md mx-auto transition-colors">
        <div className="mb-6">
          <button 
            onClick={handleScanQR}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors"
          >
            Scan QR Code
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Ticket ID</label>
          <input
            type="text"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="Enter ticket ID"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 border-gray-600 text-white"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-300 mb-1">Aadhar ID</label>
          <input
            type="text"
            value={aadharId}
            onChange={(e) => setAadharId(e.target.value)}
            placeholder="Enter Aadhar ID"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 border-gray-600 text-white"
          />
        </div>
        
        <button
          onClick={verifyTicket}
          disabled={verifying}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {verifying ? 'Verifying...' : 'Verify Ticket'}
        </button>
        
        {verificationResult && (
          <div className={`mt-4 p-3 rounded-md ${
            verificationResult.valid 
              ? 'bg-green-900 text-green-200' 
              : 'bg-red-900 text-red-200'
          }`}>
            <p className="font-medium">{verificationResult.message}</p>
            {verificationResult.valid && verificationResult.ticketDetails && (
              <div className="mt-2">
                <p><span className="font-medium">Event:</span> {verificationResult.ticketDetails.eventName}</p>
                <p><span className="font-medium">Date:</span> {verificationResult.ticketDetails.date}</p>
                <p><span className="font-medium">Seat:</span> {verificationResult.ticketDetails.seatId}</p>
                <p><span className="font-medium">Owner:</span> {verificationResult.ticketDetails.owner}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketVerification;