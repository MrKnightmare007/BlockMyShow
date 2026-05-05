import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import TicketsPage from './pages/TicketsPage';
import MarketplacePage from './pages/MarketplacePage';
import ManageEventsPage from './pages/ManageEventsPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const ProtectedLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 dark-transition">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 dark-transition">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

const AppContent = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="text-center animate-fadeIn">
          <div className="text-5xl mb-4">🎫</div>
          <div className="text-gray-600 dark:text-gray-300 text-lg">Loading BlockMyShow...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth */}
      <Route path="/auth" element={
        isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />
      } />

      {/* Public routes with navbar */}
      <Route path="/events" element={
        <PublicLayout><EventsPage /></PublicLayout>
      } />
      <Route path="/event/:id" element={
        <PublicLayout><EventDetailsPage /></PublicLayout>
      } />
      <Route path="/marketplace" element={
        <PublicLayout><MarketplacePage /></PublicLayout>
      } />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedLayout><HomePage /></ProtectedLayout>
      } />
      <Route path="/tickets" element={
        <ProtectedLayout><TicketsPage /></ProtectedLayout>
      } />
      {isAdmin && (
        <Route path="/admin" element={
          <ProtectedLayout><ManageEventsPage /></ProtectedLayout>
        } />
      )}

      {/* Fallback */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/auth"} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
