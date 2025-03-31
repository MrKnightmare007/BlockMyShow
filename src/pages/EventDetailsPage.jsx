import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { Calendar, Clock, MapPin, Ticket, ArrowLeft } from 'lucide-react';
import { BlockchainContext } from '../App';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, contract, connectWallet } = useContext(BlockchainContext);
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState('');
  const [availableSeats, setAvailableSeats] = useState([]);
  const [takenSeats, setTakenSeats] = useState([]);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (contract) loadEventDetails();
  }, [contract, id]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const eventData = await contract.getOccasion(id);
      const formattedEvent = {
        id: eventData.id.toNumber(),
        name: eventData.name,
        cost: eventData.cost,
        tickets: eventData.tickets.toNumber(),
        maxTickets: eventData.maxTickets.toNumber(),
        date: eventData.date,
        time: eventData.time,
        location: eventData.location
      };
      setEvent(formattedEvent);
      const takenSeatsData = await contract.getSeatsTaken(id);
      const takenSeatsNumbers = takenSeatsData.map(seat => seat.toNumber());
      setTakenSeats(takenSeatsNumbers);
      const seats = [];
      for (let i = 1; i <= formattedEvent.maxTickets; i++) {
        if (!takenSeatsNumbers.includes(i)) seats.push(i);
      }
      setAvailableSeats(seats);
    } catch (error) {
      console.error("Error loading event details:", error);
      toast.error("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!account) {
      toast.error("Please connect your wallet to purchase tickets");
      return;
    }
    if (!selectedSeat) {
      toast.error("Please select a seat to purchase");
      return;
    }
    try {
      setPurchasing(true);
      const transaction = await contract.mint(id, selectedSeat, { value: event.cost });
      toast.loading("Purchasing your ticket...");
      await transaction.wait();
      toast.success("Ticket purchased successfully!");
      navigate('/my-tickets');
    } catch (error) {
      console.error("Error purchasing ticket:", error);
      toast.error(error.message || "Failed to purchase ticket");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Event not found</h2>
        <p className="mt-2 text-gray-600">The event you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 bg-indigo-600 text-white py-2 px-4 border-4 border-black shadow-[5px_5px_0px_0px_black] rounded-md transition-all hover:bg-indigo-700"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="font-mono">
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to events
      </button>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left panel */}
        <div className="brutalist-bg rounded-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.name}</h1>
          <div className="space-y-4 mt-6">
            <div className="flex items-center text-gray-700">
              <Calendar className="h-5 w-5 mr-3 text-indigo-600" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Clock className="h-5 w-5 mr-3 text-indigo-600" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <MapPin className="h-5 w-5 mr-3 text-indigo-600" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Ticket className="h-5 w-5 mr-3 text-indigo-600" />
              <span>{event.tickets} out of {event.maxTickets} tickets remaining</span>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <p className="text-lg font-semibold text-gray-900">
              Cost per ticket: {ethers.utils.formatEther(event.cost)} ETH
            </p>
          </div>
        </div>
        {/* Right panel */}
        <div className="brutalist-bg rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Select a Seat</h2>
          {event.tickets > 0 ? (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Seats</label>
                <select
                  value={selectedSeat}
                  onChange={(e) => setSelectedSeat(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a seat</option>
                  {availableSeats.map((seat) => (
                    <option key={seat} value={seat}>Seat {seat}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Seat Map</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: event.maxTickets }, (_, i) => i + 1).map((seat) => (
                    <div
                      key={seat}
                      className={`
                        p-2 text-center rounded cursor-pointer
                        ${takenSeats.includes(seat)
                          ? 'bg-red-100 text-red-800 cursor-not-allowed'
                          : parseInt(selectedSeat) === seat
                            ? 'bg-green-100 text-green-800 border-2 border-green-500'
                            : 'bg-gray-100 hover:bg-indigo-100 text-gray-800'
                        }
                      `}
                      onClick={() => {
                        if (!takenSeats.includes(seat)) setSelectedSeat(seat.toString());
                      }}
                    >
                      {seat}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  <span className="inline-block w-3 h-3 bg-red-100 mr-1"></span>Taken
                  <span className="inline-block w-3 h-3 bg-gray-100 mr-1 ml-3"></span>Available
                  <span className="inline-block w-3 h-3 bg-green-100 mr-1 ml-3"></span>Selected
                </p>
              </div>
              {account ? (
                <button
                  onClick={handlePurchase}
                  disabled={!selectedSeat || purchasing}
                  className={`
                    w-full py-2 px-4 rounded-md text-white font-medium transition-all
                    ${!selectedSeat || purchasing
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 border-4 border-black shadow-[5px_5px_0px_0px_black]'
                    }
                  `}
                >
                  {purchasing ? 'Processing...' : `Purchase for ${ethers.utils.formatEther(event.cost)} ETH`}
                </button>
              ) : (
                <button
                  onClick={connectWallet}
                  className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md transition-all hover:bg-indigo-700 border-4 border-black shadow-[5px_5px_0px_0px_black]"
                >
                  Connect Wallet to Purchase
                </button>
              )}
            </>
          ) : (
            <div className="p-4 bg-red-50 text-red-800 rounded-md text-center">
              <p className="font-medium">Sold Out</p>
              <p className="text-sm mt-1">There are no more tickets available for this event.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;