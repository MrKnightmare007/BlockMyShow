const { ethers } = require('ethers')

// Updated ABI for ProofPass contract with resale support
const TICKET_ABI = [
  // ──── EVENTS ────
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'eventId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'title', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'date', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'totalTickets', type: 'uint256' }
    ],
    name: 'EventCreated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'eventId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'newPhotoUrl', type: 'string' }
    ],
    name: 'EventMetadataUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'eventId', type: 'uint256' },
      { indexed: false, internalType: 'bytes32', name: 'commitment', type: 'bytes32' }
    ],
    name: 'TicketMinted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'listPrice', type: 'uint256' }
    ],
    name: 'TicketListed',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'TicketUnlisted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'oldPrice', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'newPrice', type: 'uint256' }
    ],
    name: 'TicketListPriceUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'TicketUsed',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'price', type: 'uint256' }
    ],
    name: 'TicketResold',
    type: 'event'
  },
  // ──── FUNCTIONS ────
  {
    inputs: [
      { internalType: 'uint256', name: 'eventId', type: 'uint256' }
    ],
    name: 'getEvent',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'eventId', type: 'uint256' },
          { internalType: 'string', name: 'title', type: 'string' },
          { internalType: 'string', name: 'venue', type: 'string' },
          { internalType: 'uint256', name: 'date', type: 'uint256' },
          { internalType: 'uint256', name: 'price', type: 'uint256' },
          { internalType: 'string', name: 'photoUrl', type: 'string' },
          { internalType: 'uint256', name: 'totalTickets', type: 'uint256' },
          { internalType: 'uint256', name: 'ticketsMinted', type: 'uint256' }
        ],
        internalType: 'struct ProofPass.EventInfo',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'getTicketInfo',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'eventId', type: 'uint256' },
          { internalType: 'bytes32', name: 'commitment', type: 'bytes32' },
          { internalType: 'bool', name: 'used', type: 'bool' },
          { internalType: 'bool', name: 'isListed', type: 'bool' },
          { internalType: 'uint256', name: 'listPrice', type: 'uint256' },
          { internalType: 'uint256', name: 'salePrice', type: 'uint256' }
        ],
        internalType: 'struct ProofPass.TicketInfo',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' }
    ],
    name: 'getUserTickets',
    outputs: [
      { internalType: 'uint256[]', name: '', type: 'uint256[]' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getListedTokens',
    outputs: [
      { internalType: 'uint256[]', name: '', type: 'uint256[]' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'string', name: 'title', type: 'string' },
      { internalType: 'string', name: 'venue', type: 'string' },
      { internalType: 'uint256', name: 'date', type: 'uint256' },
      { internalType: 'uint256', name: 'price', type: 'uint256' },
      { internalType: 'string', name: 'photoUrl', type: 'string' },
      { internalType: 'uint256', name: 'totalTickets', type: 'uint256' }
    ],
    name: 'createEvent',
    outputs: [ { internalType: 'uint256', name: '', type: 'uint256' } ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'eventId', type: 'uint256' },
      { internalType: 'string', name: 'newPhotoUrl', type: 'string' }
    ],
    name: 'updateEventMetadata',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'eventId', type: 'uint256' },
      { internalType: 'bytes32', name: 'commitment', type: 'bytes32' }
    ],
    name: 'mintTicket',
    outputs: [ { internalType: 'uint256', name: '', type: 'uint256' } ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint256', name: 'price', type: 'uint256' }
    ],
    name: 'listForResale',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'cancelListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint256', name: 'newPrice', type: 'uint256' }
    ],
    name: 'updateListPrice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'address', name: 'buyer', type: 'address' },
      { internalType: 'bytes32', name: 'newCommitment', type: 'bytes32' }
    ],
    name: 'buyResale',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'bytes32', name: 'commitment', type: 'bytes32' }
    ],
    name: 'markUsed',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  }
]

const getProvider = () => {
  if (!process.env.RPC_URL) {
    throw new Error('RPC_URL is not configured')
  }

  return new ethers.JsonRpcProvider(process.env.RPC_URL)
}

const getContractAddress = () => {
  if (!process.env.CONTRACT_ADDRESS) {
    throw new Error('CONTRACT_ADDRESS is not configured')
  }

  const address = process.env.CONTRACT_ADDRESS.trim()
  if (!ethers.isAddress(address)) {
    throw new Error(`Invalid contract address: ${address}`)
  }
  return address
}

const getPrivateKey = () => {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY is not configured')
  }

  const key = process.env.PRIVATE_KEY.trim()
  if (!key.startsWith('0x') || key.length !== 66) {
    throw new Error(`Invalid private key format. Expected 0x + 64 hex chars, got: ${key.length} chars`)
  }
  return key
}

const getReadContract = () => {
  try {
    const address = getContractAddress()
    const provider = getProvider()
    const contract = new ethers.Contract(address, TICKET_ABI, provider)
    return contract
  } catch (err) {
    console.error('[getReadContract] Error:', err.message)
    throw err
  }
}

const getWriteContract = () => {
  try {
    const address = getContractAddress()
    const privateKey = getPrivateKey()
    const provider = getProvider()
    const wallet = new ethers.Wallet(privateKey, provider)
    const contract = new ethers.Contract(address, TICKET_ABI, wallet)
    return contract
  } catch (err) {
    console.error('[getWriteContract] Error:', err.message)
    throw err
  }
}

const getEvent = async (eventId) => {
  try {
    console.log(`[getEvent] Fetching event ${eventId} from chain`)
    const provider = getProvider()
    const address = getContractAddress()
    
    // Test basic contract connection
    const code = await provider.getCode(address)
    if (code === '0x') {
      throw new Error('No contract found at address')
    }
    console.log('[getEvent] Contract code verified at address')
    
    // Try calling directly with ethers call
    const contract = getReadContract()
    console.log('[getEvent] Calling getEvent on contract...')
    
    // Use simpler approach - call directly
    const result = await provider.call({
      to: address,
      data: contract.interface.encodeFunctionData('getEvent', [eventId])
    })
    
    const decoded = contract.interface.decodeFunctionResult('getEvent', result)
    console.log('[getEvent] Raw result:', decoded)
    
    const event = decoded[0]
    return {
      eventId: Number(event.eventId),
      title: event.title,
      venue: event.venue,
      date: Number(event.date),
      price: event.price.toString(),
      totalTickets: Number(event.totalTickets),
      ticketsMinted: Number(event.ticketsMinted),
      metadataURI: event.metadataURI
    }
  } catch (err) {
    console.error('[getEvent] Error:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    })
    throw new Error(`Failed to fetch event: ${err.message}`)
  }
}

const getTicketInfo = async (tokenId) => {
  const contract = getReadContract()
  try {
    const ticket = await contract.getTicketInfo(tokenId)
    return {
      eventId: Number(ticket.eventId),
      commitment: ticket.commitment,
      used: ticket.used
    }
  } catch (err) {
    throw new Error(`Failed to fetch ticket info: ${err.message}`)
  }
}

const mintTicket = async (toAddress, eventId, commitment) => {
  const contract = getWriteContract()
  try {
    const tx = await contract.mintTicket(toAddress, eventId, commitment)
    const receipt = await tx.wait()
    
    // Extract token ID from transaction receipt
    const iface = new ethers.Interface(TICKET_ABI)
    let tokenId = null
    
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log)
        if (parsed && parsed.name === 'Transfer') {
          tokenId = Number(parsed.args[2])
          break
        }
      } catch (e) {
        // Continue if parsing fails
      }
    }

    return {
      transactionHash: receipt.hash,
      tokenId,
      blockNumber: receipt.blockNumber
    }
  } catch (err) {
    throw new Error(`Failed to mint ticket: ${err.message}`)
  }
}

const markUsed = async (tokenId, commitment) => {
  const contract = getWriteContract()
  try {
    const tx = await contract.markUsed(tokenId, commitment)
    const receipt = await tx.wait()
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    }
  } catch (err) {
    throw new Error(`Failed to mark ticket used: ${err.message}`)
  }
}

const getUserTickets = async (walletAddress) => {
  const contract = getReadContract()
  try {
    const provider = getProvider()
    const currentBlock = await provider.getBlockNumber()
    
    console.log(`[getUserTickets] Querying for wallet: ${walletAddress}`)
    console.log(`[getUserTickets] Current block: ${currentBlock}`)
    
    // Query recent blocks only - Alchemy free tier is aggressive
    // Search last 5000 blocks (~18 hours) with delays to avoid rate limiting
    const fromBlock = Math.max(currentBlock - 5000, 0)
    const toBlock = currentBlock
    
    console.log(`[getUserTickets] Searching blocks ${fromBlock} to ${toBlock}`)
    
    const allTokenIds = new Set()
    let chunksProcessed = 0
    let eventsFound = 0
    const chunkSize = 10
    
    // Helper to add delay between requests
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
    
    for (let start = fromBlock; start <= toBlock; start += chunkSize) {
      const end = Math.min(start + chunkSize - 1, toBlock)
      try {
        const filter = contract.filters.Transfer(null, walletAddress)
        const events = await contract.queryFilter(filter, start, end)
        
        chunksProcessed++
        eventsFound += events.length
        
        for (const event of events) {
          allTokenIds.add(Number(event.args[2]))
        }
        
        // Add 100ms delay between requests to avoid rate limiting
        // This makes queries slower but prevents 429 errors
        if (start + chunkSize <= toBlock) {
          await delay(100)
        }
      } catch (err) {
        // If rate limited, add longer delay and retry once
        if (err.code === 429 || err.message.includes('429')) {
          console.warn(`[getUserTickets] Rate limited on block range ${start}-${end}, waiting 2s before retry...`)
          await delay(2000)
          try {
            const filter = contract.filters.Transfer(null, walletAddress)
            const events = await contract.queryFilter(filter, start, end)
            
            chunksProcessed++
            eventsFound += events.length
            
            for (const event of events) {
              allTokenIds.add(Number(event.args[2]))
            }
          } catch (retryErr) {
            console.warn(`[getUserTickets] Retry failed for ${start}-${end}:`, retryErr.message)
          }
        } else {
          console.warn(`[getUserTickets] Failed to query block range ${start}-${end}:`, err.message)
        }
      }
    }
    
    console.log(`[getUserTickets] Completed: ${chunksProcessed} chunks, ${eventsFound} events, ${allTokenIds.size} unique tokens`)
    
    return Array.from(allTokenIds)
  } catch (err) {
    throw new Error(`Failed to fetch user tickets: ${err.message}`)
  }
}

// ═══════════════════════════════════════════════════════════════
// ║               RESALE MARKETPLACE FUNCTIONS                 ║
// ═══════════════════════════════════════════════════════════════

const getListedTokens = async () => {
  const contract = getReadContract()
  try {
    console.log('[getListedTokens] Fetching listed tokens from chain')
    const tokens = await contract.getListedTokens()
    return tokens.map(t => Number(t))
  } catch (err) {
    throw new Error(`Failed to fetch listed tokens: ${err.message}`)
  }
}

const listForResale = async (tokenId, price) => {
  const contract = getWriteContract()
  try {
    console.log(`[listForResale] Listing token ${tokenId} for price ${price}`)
    const tx = await contract.listForResale(tokenId, price)
    const receipt = await tx.wait()
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    }
  } catch (err) {
    throw new Error(`Failed to list ticket for resale: ${err.message}`)
  }
}

const cancelListing = async (tokenId) => {
  const contract = getWriteContract()
  try {
    console.log(`[cancelListing] Cancelling listing for token ${tokenId}`)
    const tx = await contract.cancelListing(tokenId)
    const receipt = await tx.wait()
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    }
  } catch (err) {
    throw new Error(`Failed to cancel listing: ${err.message}`)
  }
}

const updateListPrice = async (tokenId, newPrice) => {
  const contract = getWriteContract()
  try {
    console.log(`[updateListPrice] Updating price for token ${tokenId} to ${newPrice}`)
    const tx = await contract.updateListPrice(tokenId, newPrice)
    const receipt = await tx.wait()
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    }
  } catch (err) {
    throw new Error(`Failed to update list price: ${err.message}`)
  }
}

const buyResale = async (tokenId, buyerAddress, newCommitment) => {
  const contract = getWriteContract()
  try {
    console.log(`[buyResale] Processing resale for token ${tokenId} to ${buyerAddress}`)
    const tx = await contract.buyResale(tokenId, buyerAddress, newCommitment)
    const receipt = await tx.wait()
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    }
  } catch (err) {
    throw new Error(`Failed to process resale: ${err.message}`)
  }
}

module.exports = {
  getEvent,
  getTicketInfo,
  getUserTickets,
  mintTicket,
  markUsed,
  getListedTokens,
  listForResale,
  cancelListing,
  updateListPrice,
  buyResale
}
