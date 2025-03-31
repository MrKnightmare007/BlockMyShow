import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { DollarSign } from 'lucide-react';
import { BlockchainContext } from '../App';
import CreateEvent from '../components/CreateEvent';

const AdminPage = () => {
  const navigate = useNavigate();
  const { account, contract, isOwner, provider } = useContext(BlockchainContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contractBalance, setContractBalance] = useState('0');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!account) {
      navigate('/');
      return;
    }
    if (!isOwner) {
      toast.error("Only the contract owner can access this page");
      navigate('/');
      return;
    }
    loadEvents();
    loadContractBalance();
  }, [account, isOwner, contract]);

  const loadEvents = async () => {
    if (!contract) return;
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const loadContractBalance = async () => {
    if (!contract || !provider) return;
    try {
      const balance = await provider.getBalance(contract.address);
      setContractBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error("Error loading contract balance:", error);
    }
  };

  const createEvent = async (eventData) => {
    if (!contract) {
      toast.error("Contract not loaded");
      return;
    }
    try {
      const { name, cost, maxTickets, date, time, location } = eventData;
      const costInWei = ethers.utils.parseEther(cost.toString());
      const transaction = await contract.list(
        name,
        costInWei,
        maxTickets,
        date,
        time,
        location
      );
      toast("Creating event...");
      await transaction.wait();
      toast.success("Event created successfully!");
      loadEvents();
      loadContractBalance();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event: " + error.message);
    }
  };

  const withdrawFunds = async () => {
    if (!contract) {
      toast.error("Contract not loaded");
      return;
    }
    try {
      setWithdrawing(true);
      const transaction = await contract.withdraw();
      toast("Withdrawing funds...");
      await transaction.wait();
      toast.success("Funds withdrawn successfully!");
      loadContractBalance();
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      toast.error("Failed to withdraw funds: " + error.message);
    } finally {
      setWithdrawing(false);
    }
  };

  if (!account || !isOwner) return null;

  return (
    <div className="container mx-auto px-4 py-8 brute-bg"> 
      <h1 className="text-3xl font-bold mb-8 font-mono">Admin Dashboard</h1>

      <div className="brutalist-bg">
        <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
        <CreateEvent createEvent={createEvent} />
      </div>

      <div className="brutalist-bg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Contract Balance</h2>
          <button
            onClick={withdrawFunds}
            disabled={withdrawing || parseFloat(contractBalance) === 0}
            className="flex items-center text-white bg-indigo-600 py-2 px-4 border-4 border-black shadow-[5px_5px_0px_0px_black] transition-all hover:bg-indigo-700 disabled:bg-gray-400 font-mono"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            {withdrawing ? "Withdrawing..." : "Withdraw Funds"}
          </button>
        </div>
        <p className="text-2xl font-bold">{contractBalance} ETH</p>
      </div>

      <div className="brutalist-bg">
        <h2 className="text-xl font-semibold mb-4">All Events</h2>
        {loading ? (
          <p className="text-center py-4">Loading events...</p>
        ) : events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{event.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{event.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{event.date} at {event.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{event.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{ethers.utils.formatEther(event.cost)} ETH</td>
                    <td className="px-6 py-4 whitespace-nowrap">{event.tickets}/{event.maxTickets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-4">No events created yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminPage;