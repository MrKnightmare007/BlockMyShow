import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TicketsPage from './pages/TicketsPage';
import ManageEventsPage from './pages/ManageEventsPage';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';
import './App.css';

// Main App Content with Routing
const AppContent = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'Space Mono, monospace'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎫</div>
          <div>Loading BlockMyShow...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Space Mono, monospace' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Protected Routes with Navbar */}
        {isAuthenticated ? (
          <>
            <Route path="/" element={
              <>
                <Navbar />
                <DashboardPage />
              </>
            } />
            <Route path="/tickets" element={
              <>
                <Navbar />
                <TicketsPage />
              </>
            } />
            {isAdmin && (
              <Route path="/admin/events" element={
                <>
                  <Navbar />
                  <ManageEventsPage />
                </>
              } />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </>
        )}
      </Routes>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
