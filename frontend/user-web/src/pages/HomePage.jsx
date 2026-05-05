import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md text-center dark-transition">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
    </div>
  );
}

function HomePage() {
  const { isAuthenticated } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/events`);
        const data = await res.json();
        if (data.success && data.events?.length) {
          setFeaturedEvents(data.events.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <div className="hero-gradient text-center py-20 md:py-28 px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow">
          Welcome to BlockMyShow
        </h1>
        <p className="text-xl text-white opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed">
          Your secure blockchain-based platform for buying, selling, and verifying event tickets with identity-backed NFTs.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/events" className="bms-button pulse-animation text-lg px-8 py-3">
            Browse Events
          </Link>
          <Link
            to="/marketplace"
            className="bg-white text-pink-600 border-2 border-pink-600 hover:bg-pink-50 px-8 py-3 rounded-md text-lg font-semibold transition-all hover:shadow-lg"
          >
            Resale Marketplace
          </Link>
          {isAuthenticated && (
            <Link
              to="/tickets"
              className="bg-white/20 text-white border-2 border-white/50 hover:bg-white/30 px-8 py-3 rounded-md text-lg font-semibold transition-all"
            >
              My Tickets
            </Link>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800 dark-transition">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">
            Why Choose BlockMyShow?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
              title="NFT-Backed Tickets"
              description="Every ticket is minted as a unique NFT on the blockchain, preventing counterfeiting and fraud."
            />
            <FeatureCard
              icon={<svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              title="Identity Verification"
              description="Aadhaar-backed identity ensures each ticket is tied to a real person. OTP-secured checkout."
            />
            <FeatureCard
              icon={<svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
              title="Safe Resale Marketplace"
              description="List tickets for resale with price control. 2-step OTP verification protects every transaction."
            />
          </div>
        </div>
      </div>

      {/* Featured Events */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Featured Events</h2>
            <Link to="/events" className="text-pink-600 dark:text-pink-400 hover:underline font-medium">
              View all events →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="shimmer h-64 rounded-xl" />
              ))}
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event, index) => {
                const eventDate = Number(event.date);
                const dateStr = Number.isFinite(eventDate)
                  ? new Date(eventDate * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'TBA';
                const colors = ['#4a90e2', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];
                const bgColor = colors[index % colors.length];

                return (
                  <Link to={`/event/${event.eventId}`} key={event.eventId}>
                    <div className="event-card bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                      <div
                        className="relative h-48 flex items-end"
                        style={{ background: `linear-gradient(135deg, ${bgColor}99, ${bgColor})` }}
                      >
                        {event.photoUrl ? (
                          <img src={event.photoUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="relative p-4 text-white">
                          <h3 className="text-xl font-bold">{event.title}</h3>
                          <p className="text-sm opacity-90">{dateStr}</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-300 text-sm">📍 {event.venue}</span>
                          <span className="font-bold text-pink-600 dark:text-pink-400">₹{Number(event.price)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-5xl mb-4">🎪</div>
              <p>No events available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
