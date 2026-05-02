import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Icons
const Icon = {
  Home: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
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
};

const Navbar = () => {
  const { user, walletAddress, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Events', icon: Icon.Home },
    { path: '/tickets', label: 'My Tickets', icon: Icon.Ticket },
  ];

  return (
    <nav style={{ 
      background: '#000', 
      color: '#fff', 
      padding: '0 2rem', 
      height: '56px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      borderBottom: '3px solid #000', 
      position: 'sticky', 
      top: 0, 
      zIndex: 50 
    }}>
      {/* Logo */}
      <Link 
        to="/" 
        style={{ 
          fontFamily: 'Syne, sans-serif', 
          fontSize: '1.25rem',
          color: '#fff',
          textDecoration: 'none'
        }}
      >
        BlockMyShow
      </Link>

      {/* Navigation Items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: isActive ? '#4a90e2' : '#fff',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? 'bold' : 'normal',
                padding: '8px 12px',
                borderRadius: '4px',
                background: isActive ? 'rgba(74, 144, 226, 0.1)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <item.icon />
              {item.label}
            </Link>
          );
        })}

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '6px 10px', 
            borderRadius: '4px', 
            fontSize: '11px' 
          }}>
            <div style={{ opacity: 0.7 }}>Wallet</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </div>
          </div>
          
          <button 
            onClick={logout} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '6px 12px', 
              background: 'rgba(255,255,255,0.1)', 
              color: '#fff', 
              border: '1px solid rgba(255,255,255,0.2)', 
              cursor: 'pointer', 
              fontFamily: 'monospace', 
              fontSize: '11px', 
              fontWeight: 'bold',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
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