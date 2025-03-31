import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react';
import { ethers } from 'ethers';
import { BlockchainContext } from '../App';

const HomePage = () => {
  const { contract, loading } = useContext(BlockchainContext);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    if (contract) {
      loadEvents();
    } else if (!loading) {
      setLoadingEvents(false);
    }
  }, [contract, loading]);

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      const totalEvents = await contract.totalOccasions();
      const eventsArray = [];
      for (let i = 1; i <= totalEvents.toNumber(); i++) {
        const event = await contract.getOccasion(i);
        eventsArray.push({
          id: event.id.toNumber(),
          name: event.name,
          cost: event.cost,
          tickets: event.tickets.toNumber(),
          maxTickets: event.maxTickets.toNumber(),
          date: event.date,
          time: event.time,
          location: event.location
        });
      }
      setEvents(eventsArray);
    } catch (error) {
      console.error("Error loading events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoadingEvents(false);
    }
  };

  if (loadingEvents) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="font-mono">
      <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="brutalist-bg rounded-lg overflow-hidden transition-shadow duration-300">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900">{event.name}</h3>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Ticket className="h-5 w-5 mr-2" />
                    <span>{event.tickets} / {event.maxTickets} tickets available</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-lg font-medium text-gray-900">
                      Cost: {ethers.utils.formatEther(event.cost)} ETH
                    </p>
                  </div>
                  <Link 
                    to={`/events/${event.id}`}
                    className="mt-4 block w-full text-center bg-indigo-600 text-white py-2 px-4 rounded-md transition-all hover:bg-indigo-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="brutalist-bg text-center py-10 rounded-lg">
          <Ticket className="h-16 w-16 mx-auto text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-600">No events available</h2>
          <p className="mt-2 text-gray-500">Check back later for upcoming events</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;