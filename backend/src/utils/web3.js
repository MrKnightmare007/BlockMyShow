/**
 * Web3/Blockchain Utilities
 * Helper functions for Ethers.js interactions with TicketNFT contract
 */

import { ethers } from 'ethers';

/**
 * Initialize Web3 provider and contract instance
 */
export const initializeWeb3 = () => {
  const rpcUrl = process.env.BLOCKCHAIN_NETWORK_URL || 'https://base-sepolia.g.alchemy.com/v2/';
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const contractAddress = process.env.CONTRACT_ADDRESS;
  const contractABI = [
    // Minimal ABI for contract interactions - full ABI from artifacts
    'function createEvent(string title, string venue, uint256 date, uint256 price, uint256 totalTickets, string metadataURI) returns (uint256)',
    'function mintTicket(address to, uint256 eventId, bytes32 commitment, string metadataURI) returns (uint256)',
    'function markUsed(uint256 tokenId) returns (bool)',
    'function isUsed(uint256 tokenId) view returns (bool)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'event EventCreated(uint256 indexed eventId, string title, uint256 date, address organizer)',
    'event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address indexed owner)',
    'event TicketUsed(uint256 indexed tokenId, uint256 blockTimestamp)',
  ];

  const contract = new ethers.Contract(contractAddress, contractABI, provider);

  return { provider, contract };
};

/**
 * Create event on-chain
 */
export const createEventOnChain = async (eventData) => {
  try {
    const { provider, contract } = initializeWeb3();
    const privateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY;
    const signer = new ethers.Wallet(privateKey, provider);
    const contractWithSigner = contract.connect(signer);

    const { title, venue, date, price, totalTickets, metadataURI } = eventData;

    const tx = await contractWithSigner.createEvent(
      title,
      venue,
      Math.floor(new Date(date).getTime() / 1000), // Convert to Unix timestamp
      ethers.utils.parseUnits(price.toString(), 'wei'),
      totalTickets,
      metadataURI
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find((e) => e.event === 'EventCreated');

    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      eventId: event?.args?.eventId?.toString(),
      success: receipt.status === 1,
    };
  } catch (error) {
    console.error('[WEB3] Create event failed:', error);
    throw error;
  }
};

/**
 * Mint NFT ticket
 */
export const mintTicketOnChain = async (ticketData) => {
  try {
    const { provider, contract } = initializeWeb3();
    const privateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY;
    const signer = new ethers.Wallet(privateKey, provider);
    const contractWithSigner = contract.connect(signer);

    const { to, eventId, commitment, metadataURI } = ticketData;

    // Validate inputs
    if (!ethers.utils.isAddress(to)) {
      throw new Error('Invalid recipient address');
    }

    const commitmentBytes = commitment || ethers.utils.zeroPad('0x00', 32);

    const tx = await contractWithSigner.mintTicket(to, eventId, commitmentBytes, metadataURI);
    const receipt = await tx.wait();

    const mintEvent = receipt.events?.find((e) => e.event === 'TicketMinted');

    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      tokenId: mintEvent?.args?.tokenId?.toString(),
      success: receipt.status === 1,
    };
  } catch (error) {
    console.error('[WEB3] Mint ticket failed:', error);
    throw error;
  }
};

/**
 * Mark ticket as used at gate
 */
export const markTicketUsedOnChain = async (tokenId) => {
  try {
    const { provider, contract } = initializeWeb3();
    const privateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY;
    const signer = new ethers.Wallet(privateKey, provider);
    const contractWithSigner = contract.connect(signer);

    const tx = await contractWithSigner.markUsed(tokenId);
    const receipt = await tx.wait();

    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      success: receipt.status === 1,
    };
  } catch (error) {
    console.error('[WEB3] Mark used failed:', error);
    throw error;
  }
};

/**
 * Verify ticket ownership on-chain
 */
export const verifyTicketOwnership = async (tokenId, expectedOwner) => {
  try {
    const { contract } = initializeWeb3();

    const owner = await contract.ownerOf(tokenId);
    const isUsed = await contract.isUsed(tokenId);

    return {
      tokenId,
      owner,
      expectedOwner,
      ownershipValid: owner.toLowerCase() === expectedOwner.toLowerCase(),
      used: isUsed,
    };
  } catch (error) {
    console.error('[WEB3] Verify ownership failed:', error);
    throw error;
  }
};

/**
 * Get contract details
 */
export const getContractInfo = async () => {
  try {
    const { contract } = initializeWeb3();

    // Call read-only functions
    const name = await contract.name?.();
    const symbol = await contract.symbol?.();
    const owner = await contract.owner?.();

    return {
      address: contract.address,
      name,
      symbol,
      owner,
      chainId: parseInt(process.env.CHAIN_ID || '84532'),
      network: process.env.BLOCKCHAIN_NETWORK || 'baseSepolia',
    };
  } catch (error) {
    console.error('[WEB3] Get contract info failed:', error);
    return { error: error.message };
  }
};

/**
 * Convert IPFS hash to gateway URL
 */
export const getIPFSURL = (ipfsHash) => {
  if (!ipfsHash) return null;

  // Already a full URL
  if (ipfsHash.startsWith('http')) return ipfsHash;

  // IPFS hash format: ipfs://QmXxx
  if (ipfsHash.startsWith('ipfs://')) {
    const hash = ipfsHash.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  // Raw hash
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
};

/**
 * Validate Ethereum address format
 */
export const isValidAddress = (address) => {
  return ethers.utils.isAddress(address);
};

/**
 * Validate amount is non-negative number
 */
export const isValidAmount = (amount) => {
  return !isNaN(amount) && amount >= 0;
};

/**
 * Convert Wei to Ether
 */
export const weiToEther = (wei) => {
  return ethers.utils.formatEther(wei);
};

/**
 * Convert Ether to Wei
 */
export const etherToWei = (ether) => {
  return ethers.utils.parseEther(ether.toString());
};

/**
 * Generate commitment hash for identity verification
 * Commitment = keccak256(aadhaarId, secret, userAddress)
 */
export const generateCommitmentHash = (aadhaarId, secret, userAddress) => {
  return ethers.utils.soliditySha3(
    { type: 'string', value: aadhaarId },
    { type: 'bytes32', value: ethers.utils.id(secret) },
    { type: 'address', value: userAddress }
  );
};

export default {
  initializeWeb3,
  createEventOnChain,
  mintTicketOnChain,
  markTicketUsedOnChain,
  verifyTicketOwnership,
  getContractInfo,
  getIPFSURL,
  isValidAddress,
  isValidAmount,
  weiToEther,
  etherToWei,
  generateCommitmentHash,
};
