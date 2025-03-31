import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BlockchainContext } from '../App';
import { ThemeContext } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

function Header() {
  const { account } = useContext(BlockchainContext);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const location = useLocation();

  return (
    <header className="bg-blue-600 dark:bg-gray-800 text-white shadow-md transition-colors duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="text-2xl font-bold flex items-center">
              <span className="mr-2">🎟️</span>
              BlockMyShow
            </Link>
          </motion.div>
          
          <nav className="flex items-center space-x-6">
            <motion.div 
              className="hidden md:flex space-x-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <NavLink to="/" active={location.pathname === "/"}>
                Events
              </NavLink>
              <NavLink to="/my-tickets" active={location.pathname === "/my-tickets"}>
                My Tickets
              </NavLink>
              {account && (
                <NavLink to="/admin" active={location.pathname.startsWith("/admin")}>
                  Admin
                </NavLink>
              )}
            </motion.div>
            
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
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
              
              <div className="bg-blue-700 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
                {account ? (
                  <span>{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
                ) : (
                  <span>Not Connected</span>
                )}
              </div>
            </motion.div>
          </nav>
        </div>
        <div className="flex items-center">
          <img src="/logo.png" alt="BlockMyShow Logo" className="h-8 w-8 mr-2" />
          <span className="text-xl font-bold">BlockMyShow</span>
        </div>
      </div>
    </header>
  );
}

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
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
          layoutId="underline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </Link>
  );
}

export default Header;