import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { useNavigate } from 'react-router-dom';

function TicketView({ ticket, isVerified }) {
  const navigate = useNavigate();

  // Generate hashes (in a real app, these would be cryptographically secure)
  const ticketIdHash = `TIX${ticket.tokenId}`;
  const aadharIdHash = `AID${ticket.aadharId.substring(0, 4)}`;
  const combinedHash = `${ticketIdHash}${aadharIdHash}`;

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg overflow-hidden shadow-lg relative">
      {/* Verification Badge */}
      {isVerified && (
        <div className="absolute top-2 right-2 z-10 bg-green-500 text-white px-3 py-1 rounded-full flex items-center text-sm font-bold shadow-md">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Verified at entry
        </div>
      )}
      
      {/* Ticket Header with Event Banner */}
      <div className="relative">
        <img 
          src={ticket.eventImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'} 
          alt={ticket.eventName} 
          className="w-full h-32 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
          <div className="p-4 text-white">
            <h3 className="text-xl font-bold">{ticket.eventName}</h3>
          </div>
        </div>
      </div>
      
      {/* Ticket Body */}
      <div className="p-4">
        <div className="flex justify-between mb-4 border-b pb-4">
          <div>
            <p className="text-sm text-gray-500">Date & Time</p>
            <p className="font-medium">{ticket.date}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Venue</p>
            <p className="font-medium">{ticket.venue || 'Venue not specified'}</p>
          </div>
        </div>
        
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Seat</p>
            <p className="font-medium">{ticket.seatInfo || 'Not assigned'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Price</p>
            <p className="font-medium">{ticket.price || '0.01'} ETH</p>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">Ticket ID</p>
          <p className="font-medium">#{ticket.tokenId}</p>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">Purchased On</p>
          <p className="font-medium">{ticket.purchaseDate || new Date().toLocaleDateString()}</p>
        </div>
        
        {/* Dotted line separator */}
        <div className="relative py-2">
          <div className="absolute left-0 w-4 h-4 rounded-full bg-gray-100 -ml-6 top-1/2 transform -translate-y-1/2"></div>
          <div className="border-t-2 border-dashed"></div>
          <div className="absolute right-0 w-4 h-4 rounded-full bg-gray-100 -mr-6 top-1/2 transform -translate-y-1/2"></div>
        </div>
        
        {/* QR Code and Barcode */}
        <div className="pt-4 flex flex-col items-center">
          <div className="mb-4">
            <QRCodeSVG value={combinedHash} size={120} />
            <p className="text-xs text-center mt-1 text-gray-500">Scan for entry</p>
          </div>
          
          <div className="mb-2">
            <Barcode value={ticketIdHash} width={1.5} height={40} fontSize={12} />
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            This ticket is linked to Aadhar ID: {ticket.aadharId.substring(0, 4)}XXXXXXXX
          </p>
        </div>
      </div>
      
      {/* Ticket Footer */}
      <div className="bg-gray-50 p-4 text-center">
        <button 
          onClick={() => navigate(-1)} 
          className="text-blue-600 font-medium"
        >
          Back to My Tickets
        </button>
      </div>
    </div>
  );
}

export default TicketView;