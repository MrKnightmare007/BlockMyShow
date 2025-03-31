import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react';
import { BlockchainContext } from '../App';

const MyTicketsPage = () => {
  const { account, contract, connectWallet } = useContext(BlockchainContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contract && account) {
      loadUserTickets();
    } else {
      setLoading(false);
    }
  }, [contract, account]);

  const loadUserTickets = async () => {
    try {
      setLoading(true);
      const totalEvents = await contract.totalOccasions();
      const userTickets = [];
      
      for (let eventId = 1; eventId <= totalEvents.toNumber(); eventId++) {
        const event = await contract.getOccasion(eventId);
        const seatsTaken = await contract.getSeatsTaken(eventId);
        for (let i = 0; i < seatsTaken.length; i++) {
          const seat = seatsTaken[i].toNumber();
          const seatOwner = await contract.seatTaken(eventId, seat);
          if (seatOwner.toLowerCase() === account.toLowerCase()) {
            userTickets.push({
              eventId,
              eventName: event.name,
              date: event.date,
              time: event.time,
              location: event.location,
              seat,
              cost: event.cost
            });
          }
        }
      }
      setTickets(userTickets);
    } catch (error) {
      console.error("Error loading user tickets:", error);
      toast.error("Failed to load your tickets");
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="brutalist-bg text-center py-12 rounded-lg">
        <Ticket className="h-16 w-16 mx-auto text-gray-400" />
        <h2 className="mt-4 text-xl font-semibold">Connect your wallet to view your tickets</h2>
        <button 
          onClick={connectWallet}
          className="mt-6 bg-indigo-600 text-white py-2 px-4 border-4 border-black shadow-[5px_5px_0px_0px_black] rounded-md transition-all hover:bg-indigo-700 font-mono"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div className="font-mono brute-bg">
      <h1 className="text-3xl font-bold mb-8">My Tickets</h1>
      {tickets.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket, index) => (
            <div key={index} className="bg-white border-4 border-black shadow-[5px_5px_0px_0px_black] rounded-lg overflow-hidden font-mono">
              <div className="bg-indigo-600 text-white p-4">
                <h3 className="text-xl font-semibold">{ticket.eventName}</h3>
                <p className="mt-1 text-sm opacity-90">Ticket #{index + 1}</p>
              </div>
              <div className="p-6">
                <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  Seat {ticket.seat}
                </div>
                <div className="space-y-3 text-gray-700 mt-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>{ticket.date}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>{ticket.time}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{ticket.location}</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-gray-600">
                    Price paid: {ethers.utils.formatEther(ticket.cost)} ETH
                  </p>
                </div>
                <Link 
                  to={`/events/${ticket.eventId}`}
                  className="mt-4 block w-full text-center bg-gray-100 text-gray-800 py-2 px-4 rounded-md transition-all hover:bg-gray-200 font-mono"
                >
                  View Event
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="brutalist-bg text-center py-12 rounded-lg">
          <Ticket className="h-16 w-16 mx-auto text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold">You don’t have any tickets yet</h2>
          <p className="mt-2 text-gray-500">Browse available events and purchase tickets</p>
          <Link 
            to="/"
            className="mt-6 inline-block bg-indigo-600 text-white py-2 px-4 rounded-md transition-all hover:bg-indigo-700 font-mono"
          >
            Browse Events
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;