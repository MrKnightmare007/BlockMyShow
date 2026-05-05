import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <nav className="bg-gray-900 text-white py-4 shadow-lg sticky top-0 z-50 dark-transition">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-xl">🎟️</span>
          <span className="font-bold text-xl tracking-tight">BlockMyShow</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center space-x-6">
          <NavLink to="/events" active={isActive('/events')}>Events</NavLink>
          <NavLink to="/marketplace" active={isActive('/marketplace')}>Marketplace</NavLink>
          {isAuthenticated && (
            <NavLink to="/tickets" active={isActive('/tickets')}>My Tickets</NavLink>
          )}
          {isAuthenticated && isAdmin && (
            <NavLink to="/admin" active={isActive('/admin')}>Admin</NavLink>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* Auth */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="bg-blue-700 px-3 py-1 rounded-full text-sm hidden sm:block">
                {user?.email
                  ? user.email.split('@')[0]
                  : user?.wallet_address
                  ? `${user.wallet_address.substring(0, 6)}...${user.wallet_address.slice(-4)}`
                  : 'User'}
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center justify-center gap-4 pt-3 border-t border-gray-700 mt-3">
        <Link to="/events" className={`text-sm ${isActive('/events') ? 'text-blue-400 border-b border-blue-400' : 'text-gray-300'}`}>Events</Link>
        <Link to="/marketplace" className={`text-sm ${isActive('/marketplace') ? 'text-blue-400 border-b border-blue-400' : 'text-gray-300'}`}>Marketplace</Link>
        {isAuthenticated && <Link to="/tickets" className={`text-sm ${isActive('/tickets') ? 'text-blue-400 border-b border-blue-400' : 'text-gray-300'}`}>My Tickets</Link>}
        {isAuthenticated && isAdmin && <Link to="/admin" className={`text-sm ${isActive('/admin') ? 'text-blue-400 border-b border-blue-400' : 'text-gray-300'}`}>Admin</Link>}
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`relative px-1 py-2 text-sm font-medium transition-colors ${
        active ? 'text-white' : 'text-gray-300 hover:text-white'
      }`}
    >
      {children}
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />}
    </Link>
  );
}

export default Navbar;
