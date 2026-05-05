import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocation as useAppLocation } from '../context/LocationContext';

// Icons
const Icon = {
  Home: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Ticket: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Sun: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
};

const Navbar = () => {
  const { user, walletAddress, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { selectedCity, setSelectedCity, cities, detectLocation, isAutoDetecting } = useAppLocation();
  const location = useLocation();

  const Tag = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );

  const navItems = isAdmin
    ? [{ path: '/', label: 'Manage Events', icon: Icon.Home }]
    : [
        { path: '/', label: 'Events', icon: Icon.Home },
        { path: '/marketplace', label: 'Marketplace', icon: Tag },
        { path: '/tickets', label: 'My Tickets', icon: Icon.Ticket },
        { path: '/profile', label: 'Profile', icon: Icon.User },
      ];

  return (
    <nav style={{ 
      background: 'var(--surface)', 
      color: 'var(--text)', 
      padding: '0 2rem', 
      height: '60px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      borderBottom: '3px solid var(--border)', 
      position: 'sticky', 
      top: 0, 
      zIndex: 50 
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link 
          to="/" 
          style={{ 
            fontFamily: 'Syne, sans-serif', 
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: 'var(--text)',
            textDecoration: 'none',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}
        >
          BlockMyShow
        </Link>

        {/* Location Selector - only for users */}
        {!isAdmin && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '6px 12px', 
              border: '2px solid var(--border)',
              background: 'var(--input-bg)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              <Icon.MapPin />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  outline: 'none',
                  cursor: 'pointer',
                  paddingRight: '4px',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                {cities.map(city => (
                  <option 
                    key={city} 
                    value={city}
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      padding: '10px'
                    }}
                  >
                    {city}
                  </option>
                ))}
              </select>
              <div style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                <Icon.ChevronDown />
              </div>
              <button 
                onClick={detectLocation} 
                title="Auto-detect location"
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: isAutoDetecting ? 'var(--primary)' : 'var(--muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '8px',
                  fontSize: '14px'
                }}
              >
                {isAutoDetecting ? '⌛' : '🎯'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {navItems.map(item => {
          // Note: profile?tab=tickets will show active for profile if we just use startsWith
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: isActive ? 'var(--primary)' : 'var(--text)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? 'bold' : 'normal',
                padding: '8px 12px',
                border: isActive ? '2px solid var(--border)' : '2px solid transparent',
                borderRadius: '0px',
                background: isActive ? 'var(--surface)' : 'transparent',
                boxShadow: isActive ? '2px 2px 0 var(--border)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <item.icon />
              {item.label}
            </Link>
          );
        })}

        {/* User Info & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <button onClick={toggleTheme} style={{
            background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '8px'
          }}>
            {theme === 'dark' ? <Icon.Sun /> : <Icon.Moon />}
          </button>

          <div style={{ 
            border: '2px solid var(--border)', 
            padding: '6px 10px', 
            background: 'var(--input-bg)', 
            fontSize: '11px' 
          }}>
            <div style={{ opacity: 0.7, color: 'var(--muted)' }}>Wallet</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </div>
          </div>
          
          <button 
            onClick={logout} 
            className="brutal-btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 12px', 
              fontSize: '11px', 
            }}
          >
            <Icon.LogOut /> 
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;