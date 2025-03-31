import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { BlockchainContext } from '../App';

function Home() {
  const { account, connectWallet } = useContext(BlockchainContext);

  return (
    <div className="bg-white shadow-md rounded-lg p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to TickTicket</h1>
        <p className="text-lg text-gray-600">
          A secure blockchain-based ticketing system with identity verification
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
            <h3 className="font-medium mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-gray-600">
              Connect your Ethereum wallet to access the platform
            </p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
            <h3 className="font-medium mb-2">Verify Your Identity</h3>
            <p className="text-sm text-gray-600">
              Provide your Aadhar ID and picture for verification
            </p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
            <h3 className="font-medium mb-2">Get Your NFT Ticket</h3>
            <p className="text-sm text-gray-600">
              Receive a non-transferable NFT ticket linked to your identity
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Features</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Secure NFT-based tickets that cannot be transferred to others</li>
          <li>Identity verification using Aadhar ID and picture</li>
          <li>Option to sell back tickets to the organizer</li>
          <li>Transparent and tamper-proof blockchain technology</li>
        </ul>
      </div>

      <div className="flex flex-col md:flex-row justify-center gap-4">
        {!account ? (
          <button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md text-lg font-medium"
          >
            Connect Wallet to Get Started
          </button>
        ) : (
          <>
            <Link
              to="/buy"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md text-lg font-medium text-center"
            >
              Buy Tickets
            </Link>
            <Link
              to="/my-tickets"
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-md text-lg font-medium text-center"
            >
              View My Tickets
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;