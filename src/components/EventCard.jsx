import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react';
import { ethers } from 'ethers';

const EventCard = ({ event }) => {
  return (
    <div className="brutalist-card overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-black font-mono">{event.name}</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center text-gray-800">
            <Calendar className="h-5 w-5 mr-2" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center text-gray-800">
            <Clock className="h-5 w-5 mr-2" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center text-gray-800">
            <MapPin className="h-5 w-5 mr-2" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center text-gray-800">
            <Ticket className="h-5 w-5 mr-2" />
            <span>{event.tickets} tickets available</span>
          </div>
          <div className="mt-4">
            <p className="text-lg font-medium text-black">
              Cost: {ethers.utils.formatEther(event.cost)} ETH
            </p>
          </div>
          
          <Link 
            to={`/events/${event.id}`}
            className="mt-4 block w-full text-center brutalist-button"
          >
            VIEW DETAILS
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;