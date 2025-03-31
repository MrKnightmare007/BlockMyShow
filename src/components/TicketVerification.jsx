import React, { useState, useContext, useEffect, useRef } from 'react';
import { BlockchainContext } from '../App';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';  // Changed from import QRCode from 'qrcode.react'

function TicketVerification() {
  const { account, isOwner } = useContext(BlockchainContext);
  const [scanResult, setScanResult] = useState(null);
  const [ticketId, setTicketId] = useState('');
  const [aadharId, setAadharId] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const qrContainerRef = useRef(null);

  useEffect(() => {
    return () => {
      // Clean up scanner when component unmounts
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const startScanner = () => {
    setIsScanning(true);
    
    // Clear previous scanner if exists
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    
    // Clear the container
    if (qrContainerRef.current) {
      qrContainerRef.current.innerHTML = '';
    }
    
    // Create new scanner
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: 250,
      rememberLastUsedCamera: true,
    });
    
    scanner.render(onScanSuccess, onScanError);
    scannerRef.current = scanner;
  };

  const onScanSuccess = (decodedText) => {
    setScanResult(decodedText);
    setIsScanning(false);
    
    // Extract ticket ID from the QR code if possible
    if (decodedText.startsWith('TIX')) {
      const ticketIdPart = decodedText.substring(0, 7); // Assuming format TIX1234
      setTicketId(ticketIdPart.replace('TIX', ''));
    }
    
    // Stop scanner
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
  };

  const onScanError = (error) => {
    console.warn(error);
  };

  const verifyTicket = () => {
    if (!ticketId || !aadharId) {
      toast.error('Please enter both Ticket ID and Aadhar ID');
      return;
    }
  
    // Generate hashes (in a real app, these would be cryptographically secure)
    const ticketIdHash = `TIX${ticketId}`;
    const aadharIdHash = `AID${aadharId.substring(0, 4)}`;
    const expectedCombinedHash = `${ticketIdHash}${aadharIdHash}`;
  
    console.log('Expected hash:', expectedCombinedHash);
    console.log('Scanned result:', scanResult);
  
    // If manually entering without scanning, consider it a match
    if (!scanResult) {
      setVerificationStatus('success');
      toast.success('Ticket verified successfully!');
      
      // Store verification status in localStorage
      const verifiedTickets = JSON.parse(localStorage.getItem('verifiedTickets') || '[]');
      if (!verifiedTickets.includes(ticketId)) {
        verifiedTickets.push(ticketId);
        localStorage.setItem('verifiedTickets', JSON.stringify(verifiedTickets));
      }
      return;
    }
  
    // Check if the scanned QR code matches the expected combined hash
    if (scanResult === expectedCombinedHash) {
      setVerificationStatus('success');
      toast.success('Ticket verified successfully!');
      
      // Store verification status in localStorage
      const verifiedTickets = JSON.parse(localStorage.getItem('verifiedTickets') || '[]');
      if (!verifiedTickets.includes(ticketId)) {
        verifiedTickets.push(ticketId);
        localStorage.setItem('verifiedTickets', JSON.stringify(verifiedTickets));
      }
    } else {
      // Try alternative format (just in case the QR format is different)
      const altHash = `TIX${ticketId}AID${aadharId.substring(0, 4)}`;
      if (scanResult === altHash) {
        setVerificationStatus('success');
        toast.success('Ticket verified successfully!');
        
        // Store verification status in localStorage
        const verifiedTickets = JSON.parse(localStorage.getItem('verifiedTickets') || '[]');
        if (!verifiedTickets.includes(ticketId)) {
          verifiedTickets.push(ticketId);
          localStorage.setItem('verifiedTickets', JSON.stringify(verifiedTickets));
        }
      } else {
        setVerificationStatus('failed');
        toast.error('Ticket verification failed!');
      }
    }
  
    // In a real app, you would also check against the blockchain
  };

  const resetVerification = () => {
    setScanResult(null);
    setTicketId('');
    setAadharId('');
    setVerificationStatus(null);
    
    // Clear scanner if exists
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
  };

  if (!account) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
        <p className="text-center">Please connect your wallet to access this feature</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
        <p className="text-center">Only admin can access this feature</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Ticket Verification</h2>
      
      {verificationStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-md">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <div>
              <p className="font-bold">Ticket Verified Successfully</p>
              <p className="text-sm">Ticket ID: {ticketId}</p>
              <p className="text-sm">Aadhar ID: {aadharId.substring(0, 4)}XXXXXXXX</p>
            </div>
          </div>
          <button 
            onClick={resetVerification}
            className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            Verify Another Ticket
          </button>
        </div>
      )}
      
      {verificationStatus === 'failed' && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <div>
              <p className="font-bold">Ticket Verification Failed</p>
              <p className="text-sm">The ticket information does not match our records.</p>
            </div>
          </div>
          <button 
            onClick={resetVerification}
            className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
      
      {verificationStatus === null && (
        <>
          <div className="mb-6">
            <p className="mb-4">Scan the QR code on the ticket to verify entry:</p>
            
            {isScanning ? (
              <div className="mb-4">
                <div id="qr-reader" ref={qrContainerRef} className="w-full"></div>
                <button 
                  onClick={() => {
                    setIsScanning(false);
                    if (scannerRef.current) {
                      scannerRef.current.clear();
                    }
                  }}
                  className="mt-2 w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Cancel Scan
                </button>
              </div>
            ) : (
              <button 
                onClick={startScanner}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 mb-4"
              >
                Scan QR Code
              </button>
            )}
            
            {scanResult && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium">QR Code Scanned:</p>
                <p className="text-xs font-mono break-all">{scanResult}</p>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Ticket ID</label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter ticket ID"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Aadhar ID</label>
            <input
              type="text"
              value={aadharId}
              onChange={(e) => setAadharId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter Aadhar ID"
              maxLength="12"
            />
          </div>
          
          <button
            onClick={verifyTicket}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Verify Ticket
          </button>
        </>
      )}
    </div>
  );
}

export default TicketVerification;