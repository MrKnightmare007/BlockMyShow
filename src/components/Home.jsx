import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/bookMyShowStyles.css';

function Home() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch events and sort by popularity
    const fetchTopEvents = () => {
      try {
        // Get all events from localStorage
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        
        // Get all ticket requests from localStorage
        const allRequests = JSON.parse(localStorage.getItem('ticketRequests') || '[]');
        const approvedRequests = allRequests.filter(req => req.status === 'approved');
        
        // Count bookings per event
        const eventBookings = {};
        
        // Initialize booking counts for all events
        events.forEach(event => {
          eventBookings[event.id] = {
            count: 0,
            id: event.id,
            eventName: event.name,
            date: event.date,
            location: event.location,
            price: event.price || '0.05 ETH',
            image: event.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80'
          };
        });
        
        // Count approved bookings
        approvedRequests.forEach(req => {
          if (eventBookings[req.eventId]) {
            eventBookings[req.eventId].count += 1;
          }
        });
        
        // Convert to array and sort by booking count
        const sortedEvents = Object.values(eventBookings)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3); // Get top 3
        
        // If we have fewer than 3 events, use these defaults
        const defaultEvents = [
          {
            id: "coldplay-concert",
            eventName: "Coldplay Concert",
            date: "June 15, 2023",
            location: "Kolkata",
            price: "0.05 ETH",
            count: 0,
            image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
          },
          {
            id: "anubhabs-birthday",
            eventName: "Anubhab's Birthday Treat",
            date: "March 10, 2023",
            location: "State Bhavan",
            price: "0.05 ETH",
            count: 0,
            image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
          },
          {
            id: "tech-conference",
            eventName: "Tech Conference 2023",
            date: "July 10, 2023",
            location: "San Francisco, CA",
            price: "0.05 ETH",
            count: 0,
            image: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"
          }
        ];
        
        // Fill in with default events if needed
        while (sortedEvents.length < 3) {
          const nextDefault = defaultEvents[sortedEvents.length];
          if (!sortedEvents.find(e => e.eventName === nextDefault.eventName)) {
            sortedEvents.push(nextDefault);
          }
        }
        
        setFeaturedEvents(sortedEvents);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching top events:", error);
        setLoading(false);
      }
    };
    
    fetchTopEvents();
  }, []);

  return (
    <div className="animate-fadeIn">
      {/* Hero Section with Gradient */}
      <div className="hero-gradient text-center py-16 md:py-24 rounded-lg mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
          Welcome to BlockMyShow
        </h1>
        <p className="text-xl text-white opacity-90 mb-8 max-w-2xl mx-auto">
          Your secure blockchain-based platform for buying, selling, and verifying event tickets
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <Link 
            to="/events" 
            className="bms-button pulse-animation"
          >
            Browse Events
          </Link>
          <Link 
            to="/my-tickets" 
            className="bg-white text-pink-600 border border-pink-600 hover:bg-pink-50 px-8 py-3 rounded-md text-lg font-medium transition-all hover:shadow-lg"
          >
            My Tickets
          </Link>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">
            Why Choose BlockMyShow?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              }
              title="Secure Blockchain Technology"
              description="All tickets are minted as NFTs on the blockchain, ensuring authenticity and preventing counterfeiting."
            />
            
            <FeatureCard 
              icon={
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
              }
              title="Easy Transactions"
              description="Buy tickets with cryptocurrency in seconds, with no hidden fees or complicated processes."
            />
            
            <FeatureCard 
              icon={
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              }
              title="Verified Attendance"
              description="Event organizers can easily verify ticket authenticity at the venue using our QR code system."
            />
          </div>
        </div>
      </div>
      
      {/* Featured Events section */}
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Featured Events
            </h2>
            <Link 
              to="/events" 
              className="text-pink-600 dark:text-pink-400 hover:underline"
            >
              View all events →
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="shimmer h-64 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event, index) => (
                <Link to={`/event/${event.id}`} key={index}>
                  <div className="event-card bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                    <div className="relative h-48">
                      <img 
                        src={event.image} 
                        alt={event.eventName} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/70 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-4 text-white">
                        <h3 className="text-xl font-bold">{event.eventName}</h3>
                        <p className="text-sm opacity-90">{event.date}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">{event.location}</span>
                        <span className="font-bold text-pink-600 dark:text-pink-400">{event.price}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for feature cards
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md text-center">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

export default Home;