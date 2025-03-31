import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BlockchainContext } from '../App';

function Navbar({ isAdmin }) {
  const { account } = useContext(BlockchainContext);
  const location = useLocation();
  
  // Truncate the account address for display
  const truncatedAccount = account 
    ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
    : '';
  
  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold">TickTicket</Link>
          
          <div className="flex items-center space-x-6">
            {isAdmin ? (
              // Admin Navigation
              <>
                <Link 
                  to="/admin" 
                  className={`hover:text-blue-200 ${location.pathname === '/admin' ? 'font-bold' : ''}`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/admin/add-event" 
                  className={`hover:text-blue-200 ${location.pathname === '/admin/add-event' ? 'font-bold' : ''}`}
                >
                  Add Event
                </Link>
                <Link 
                  to="/events" 
                  className={`hover:text-blue-200 ${location.pathname === '/events' ? 'font-bold' : ''}`}
                >
                  Events
                </Link>
              </>
            ) : (
              // User Navigation
              <>
                <Link 
                  to="/events" 
                  className={`hover:text-blue-200 ${location.pathname === '/events' ? 'font-bold' : ''}`}
                >
                  Events
                </Link>
                <Link 
                  to="/my-tickets" 
                  className={`hover:text-blue-200 ${location.pathname === '/my-tickets' ? 'font-bold' : ''}`}
                >
                  My Tickets
                </Link>
              </>
            )}
            
            {account ? (
              <div className="bg-blue-700 px-3 py-1 rounded-md">
                {truncatedAccount}
              </div>
            ) : (
              <button 
                onClick={async () => {
                  try {
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                  } catch (error) {
                    console.error('Error connecting to MetaMask:', error);
                  }
                }}
                className="bg-white text-blue-600 px-4 py-1 rounded-md hover:bg-blue-100"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;