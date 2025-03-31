import React, { useState, useEffect, createContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Events from './components/Events';
import BuyTicket from './components/BuyTicket';
import MyTickets from './components/MyTickets';
import Admin from './components/Admin';
import AddEvent from './components/AddEvent';
import EventDetails from './components/EventDetails';
import TicketDetails from './components/TicketDetails';
import TicketABI from './contracts/TicketABI.json';

// Create a context to share blockchain data
export const BlockchainContext = createContext();

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const adminAddress = "0x18D167CdC47E125F564C2BaF2d6FB54bE62c5b61";

  useEffect(() => {
    const init = async () => {
      // Check if MetaMask is installed
      if (window.ethereum) {
        try {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = accounts[0];
          setAccount(account);
          
          // Create a provider
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          
          // Create contract instance
          const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with your contract address
          const ticketContract = new ethers.Contract(contractAddress, TicketABI, signer);
          setContract(ticketContract);
          
          // Check if the connected account is the contract owner
          const isAdmin = account.toLowerCase() === adminAddress.toLowerCase();
          setIsOwner(isAdmin);
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0]);
            setIsOwner(accounts[0].toLowerCase() === adminAddress.toLowerCase());
          });
        } catch (error) {
          console.error('Error connecting to MetaMask:', error);
        }
      } else {
        console.log('Please install MetaMask to use this application');
      }
    };
    
    init();
  }, []);

  // Redirect to admin if user is admin
  const RedirectIfAdmin = ({ children }) => {
    if (isOwner) {
      return <Navigate to="/admin" />;
    }
    return children;
  };

  // Redirect to events if user is not admin
  const RedirectIfNotAdmin = ({ children }) => {
    if (!isOwner && account) {
      return <Navigate to="/events" />;
    }
    return children;
  };

  return (
    <BlockchainContext.Provider value={{ account, contract, isOwner }}>
      <div className="min-h-screen bg-gray-100">
        <Navbar isAdmin={isOwner} />
        <div className="container mx-auto py-8 px-4">
          <Routes>
            <Route path="/" element={
              <RedirectIfAdmin>
                <Home />
              </RedirectIfAdmin>
            } />
            <Route path="/events" element={<Events />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="/my-tickets" element={<MyTickets />} />
            <Route path="/ticket/:id" element={<TicketDetails />} />
            <Route path="/admin" element={
              <RedirectIfNotAdmin>
                <Admin />
              </RedirectIfNotAdmin>
            } />
            <Route path="/admin/add-event" element={
              <RedirectIfNotAdmin>
                <AddEvent />
              </RedirectIfNotAdmin>
            } />
            <Route path="/admin/edit-event/:id" element={
              <RedirectIfNotAdmin>
                <AddEvent isEditing={true} />
              </RedirectIfNotAdmin>
            } />
          </Routes>
        </div>
        <Toaster position="bottom-right" />
      </div>
    </BlockchainContext.Provider>
  );
}

export default App;