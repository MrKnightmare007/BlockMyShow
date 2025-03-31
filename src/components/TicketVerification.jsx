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
    setTicketId('123456');
  };

  const verifyTicket = async () => {
    if (!ticketId || !aadharId) {
      toast.error('Please enter both Ticket ID and Aadhar ID');
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      // In a real app, this would verify against the blockchain
      // For demo purposes, we'll simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Get tickets from localStorage for demo
      const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
      const ticket = tickets.find(t => t.id === ticketId);
      
      if (ticket && ticket.aadharId === aadharId) {
        setVerificationResult({
          valid: true,
          message: 'Ticket verified successfully!',
          ticketDetails: {
            eventName: ticket.eventName,
            owner: ticket.owner
          }
        });
      } else {
        setVerificationResult({
          valid: false,
          message: 'Invalid ticket or Aadhar ID does not match.'
        });
      }
    } catch (error) {
      console.error('Error verifying ticket:', error);
      setVerificationResult({
        valid: false,
        message: 'Error verifying ticket: ' + error.message
      });
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