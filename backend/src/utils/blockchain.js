import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

/**
 * Smart Contract Integration for TicketNFT
 * Connected to Base Sepolia testnet
 * Contract: 0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812
 */

let provider = null;
let contract = null;
let contractAddress = null;

/**
 * Initialize smart contract connection
 */
export const initializeContract = async () => {
  try {
    const rpcUrl = process.env.NETWORK_URL || 'https://sepolia.base.org';
    const address = process.env.CONTRACT_ADDRESS || '0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812';
    contractAddress = address;

    console.log('[BLOCKCHAIN] Initializing contract...');
    console.log('[BLOCKCHAIN] RPC URL:', rpcUrl);
    console.log('[BLOCKCHAIN] Contract Address:', address);

    // Initialize provider
    provider = new ethers.JsonRpcProvider(rpcUrl);

    // Verify provider connection
    const network = await provider.getNetwork();
    console.log('✓ Connected to network:', network.name, `(chainId: ${network.chainId})`);

    // Load contract ABI - fallback minimal ABI
    const abi = [
      'function mintTicket(address to, string tokenURI) public returns (uint256)',
      'function ownerOf(uint256 tokenId) public view returns (address)',
      'function tokenURI(uint256 tokenId) public view returns (string)',
      'function balanceOf(address owner) public view returns (uint256)',
      'function totalSupply() public view returns (uint256)',
      'function markUsed(uint256 tokenId) public',
      'function isUsed(uint256 tokenId) public view returns (bool)',
    ];

    // Create contract instance (read-only without signer)
    contract = new ethers.Contract(address, abi, provider);
    console.log('✓ Smart contract initialized (read-only mode)');

    return { provider, contract, contractAddress };
  } catch (error) {
    console.error('✗ Contract initialization failed:', error.message);
    throw error;
  }
};

/**
 * Get provider instance
 */
export const getProvider = () => {
  if (!provider) {
    throw new Error('Contract not initialized. Call initializeContract() first.');
  }
  return provider;
};

/**
 * Get contract instance
 */
export const getContract = () => {
  if (!contract) {
    throw new Error('Contract not initialized. Call initializeContract() first.');
  }
  return contract;
};

/**
 * Get contract address
 */
export const getContractAddress = () => {
  return contractAddress || process.env.CONTRACT_ADDRESS || '0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812';
};

/**
 * Mint ticket NFT
 */
export const mintTicketNFT = async (to, eventId, commitment, metadataURI) => {
  try {
    console.log('[BLOCKCHAIN] Minting ticket for:', to);

    if (!process.env.CONTRACT_OWNER_PRIVATE_KEY) {
      // Return mock result for testing
      console.warn('[BLOCKCHAIN] No private key - returning mock mint');
      return {
        hash: `0xmock_${Date.now()}`,
        tokenId: `token_${Date.now()}`,
        to,
        eventId,
        mock: true,
        message: 'Mock mint (requires CONTRACT_OWNER_PRIVATE_KEY for production)',
      };
    }

    const signer = new ethers.Wallet(process.env.CONTRACT_OWNER_PRIVATE_KEY, provider);
    const contractWithSigner = contract.connect(signer);

    const tx = await contractWithSigner.mintTicket(to, metadataURI || '');
    const receipt = await tx.wait();

    console.log('[BLOCKCHAIN] Ticket minted:', receipt.hash);

    return {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      from: receipt.from,
      to: receipt.to,
      gasUsed: receipt.gasUsed.toString(),
      eventId,
      commitment,
    };
  } catch (error) {
    console.error('[BLOCKCHAIN] Mint error:', error.message);
    return {
      hash: `0xmock_${Date.now()}`,
      tokenId: `token_${Date.now()}`,
      mock: true,
      error: error.message,
    };
  }
};

/**
 * Mark ticket as used
 */
export const markTicketUsed = async (tokenId) => {
  try {
    console.log('[BLOCKCHAIN] Marking ticket as used:', tokenId);

    if (!process.env.CONTRACT_OWNER_PRIVATE_KEY) {
      // Return mock result
      return {
        success: true,
        tokenId,
        usedAt: new Date(),
        mock: true,
      };
    }

    const signer = new ethers.Wallet(process.env.CONTRACT_OWNER_PRIVATE_KEY, provider);
    const contractWithSigner = contract.connect(signer);

    const tx = await contractWithSigner.markUsed(tokenId);
    const receipt = await tx.wait();

    console.log('[BLOCKCHAIN] Ticket marked as used:', receipt.hash);

    return {
      success: true,
      hash: receipt.hash,
      tokenId,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error('[BLOCKCHAIN] Mark used error:', error.message);
    return {
      success: false,
      tokenId,
      error: error.message,
    };
  }
};

/**
 * Get ticket status on blockchain
 */
export const getTicketStatus = async (tokenId) => {
  try {
    console.log('[BLOCKCHAIN] Checking ticket status:', tokenId);

    // Try to get owner
    let owner = null;
    try {
      owner = await contract.ownerOf(tokenId);
    } catch (err) {
      // Ticket doesn't exist
      return { exists: false, tokenId };
    }

    // Check if used
    let used = false;
    try {
      used = await contract.isUsed(tokenId);
    } catch (err) {
      // Function might not exist
      used = false;
    }

    return {
      exists: true,
      tokenId,
      owner,
      used,
      blockchainVerified: true,
    };
  } catch (error) {
    console.error('[BLOCKCHAIN] Status check error:', error.message);
    return {
      exists: false,
      tokenId,
      error: error.message,
    };
  }
};

/**
 * Verify ticket ownership
 */
export const verifyTicketOwnership = async (tokenId, expectedOwner) => {
  try {
    const owner = await contract.ownerOf(tokenId);
    const isOwned = owner.toLowerCase() === expectedOwner.toLowerCase();

    console.log('[BLOCKCHAIN] Verified ownership:', {
      tokenId,
      owner,
      expectedOwner,
      matches: isOwned,
    });

    return {
      valid: isOwned,
      owner,
      expectedOwner,
    };
  } catch (error) {
    console.error('[BLOCKCHAIN] Verification error:', error.message);
    return {
      valid: false,
      error: error.message,
    };
  }
};

/**
 * Get user's ticket balance
 */
export const getUserTicketBalance = async (userAddress) => {
  try {
    const balance = await contract.balanceOf(userAddress);
    console.log('[BLOCKCHAIN] User balance:', userAddress, '=', balance.toString());
    return balance.toString();
  } catch (error) {
    console.error('[BLOCKCHAIN] Balance check error:', error.message);
    return '0';
  }
};

/**
 * Get total tickets minted
 */
export const getTotalSupply = async () => {
  try {
    const total = await contract.totalSupply();
    console.log('[BLOCKCHAIN] Total tickets:', total.toString());
    return total.toString();
  } catch (error) {
    console.error('[BLOCKCHAIN] Supply check error:', error.message);
    return '0';
  }
};

/**
 * Get blockchain info
 */
export const getBlockchainInfo = async () => {
  try {
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    // In ethers.js v6, use getFeeData() instead of getGasPrice()
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.toBigInt('0');

    return {
      network: network.name,
      chainId: network.chainId,
      blockNumber,
      gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
      contractAddress,
      rpcUrl: process.env.NETWORK_URL,
    };
  } catch (error) {
    console.error('[BLOCKCHAIN] Info fetch error:', error.message);
    return null;
  }
};

export default {
  initializeContract,
  getProvider,
  getContract,
  getContractAddress,
  mintTicketNFT,
  markTicketUsed,
  getTicketStatus,
  verifyTicketOwnership,
  getUserTicketBalance,
  getTotalSupply,
  getBlockchainInfo,
};
