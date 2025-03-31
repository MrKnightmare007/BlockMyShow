import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BlockchainContext } from '../App';
import { ThemeContext } from '../contexts/ThemeContext';

function Navbar() {
  const { account, isOwner } = useContext(BlockchainContext);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const location = useLocation();

  return (
    <nav className="bg-gray-900 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
          <span className="mr-2">🎟️</span>
            <span className="font-bold text-xl">BlockMyShow</span>
          </Link>
          
          <div className="ml-10 space-x-4">
            {/* Hide Events tab for admin users */}
            {!isOwner && (
              <Link 
                to="/events" 
                className={`${location.pathname === '/events' ? 'border-b-2 border-blue-500' : ''} hover:text-blue-400`}
              >
                Events
              </Link>
            )}
            
            <Link 
              to="/my-tickets" 
              className={`${location.pathname === '/my-tickets' ? 'border-b-2 border-blue-500' : ''} hover:text-blue-400`}
            >
              My Tickets
            </Link>
            
            {isOwner && (
              <Link 
                to="/admin" 
                className={`${location.pathname === '/admin' ? 'border-b-2 border-blue-500' : ''} hover:text-blue-400`}
              >
                Admin
              </Link>
            )}
          </div>
        </div>
        
        {/* Right side items - Dark Mode Toggle and Account Display */}
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-blue-700 dark:hover:bg-gray-700 transition-colors"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
              </svg>
            )}
          </button>
          
          {/* Account Display */}
          <div className="bg-blue-700 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
            {account ? (
              <span>{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
            ) : (
              <span>Connect Wallet</span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Helper component for navigation links
function NavLink({ to, active, children }) {
  return (
    <Link 
      to={to} 
      className={`relative px-1 py-2 transition-colors ${
        active ? 'text-white' : 'text-blue-100 dark:text-gray-300 hover:text-white'
      }`}
    >
      {children}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
      )}
    </Link>
  );
}

export default Navbar;