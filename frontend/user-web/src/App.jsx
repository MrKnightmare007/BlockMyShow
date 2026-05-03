import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LocationProvider } from './context/LocationContext';
import { CurrencyProvider } from './context/CurrencyContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import TicketsPage from './pages/TicketsPage';
import Navbar from './components/Navbar';
import Loader from './components/Loader';
import { useAuth } from './context/AuthContext';
import './App.css';

// Main App Content with Routing
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loader fullScreen text="Loading BlockMyShow..." />;
  }

  return (
    <div style={{ 
      fontFamily: 'Space Mono, monospace', 
      minHeight: '100vh', 
      background: 'var(--bg)', 
      color: 'var(--text)' 
    }}>
      {isAuthenticated ? (
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      ) : (
        <Routes>
          <Route path="*" element={<AuthPage />} />
        </Routes>
      )}
    </div>
  );
};

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', fontFamily: 'monospace' }}>
          <h1>React Error:</h1>
          <h2>{this.state.error?.toString()}</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {this.state.error?.stack}
            <br />
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LocationProvider>
          <CurrencyProvider>
            <AuthProvider>
            <Router>
              <Toaster 
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#000',
                    color: '#fff',
                    borderRadius: '4px',
                    border: '2px solid #31bbaf',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '4px 4px 0px #000',
                  },
                  success: {
                    style: {
                      border: '2px solid #31bbaf',
                    },
                    iconTheme: {
                      primary: '#31bbaf',
                      secondary: '#000',
                    },
                  },
                  error: {
                    style: {
                      border: '2px solid #ef4444',
                    },
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#000',
                    },
                  },
                }}
              />
              <AppContent />
            </Router>
          </AuthProvider>
        </CurrencyProvider>
      </LocationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
