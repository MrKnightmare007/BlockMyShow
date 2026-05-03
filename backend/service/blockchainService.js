const { ethers } = require('ethers')

const TICKET_ABI = [
  {
    type: 'function',
    name: 'getEvent',
    stateMutability: 'view',
    inputs: [
      { name: 'eventId', type: 'uint256' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'eventId', type: 'uint256' },
          { name: 'title', type: 'string' },
          { name: 'venue', type: 'string' },
          { name: 'date', type: 'uint256' },
          { name: 'price', type: 'uint256' },
          { name: 'totalTickets', type: 'uint256' },
          { name: 'ticketsMinted', type: 'uint256' },
          { name: 'metadataURI', type: 'string' }
        ]
      }
    ]
  },
  {
    type: 'function',
    name: 'mintTicket',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'eventId', type: 'uint256' },
      { name: 'commitment', type: 'bytes32' }
    ],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  },
  {
    type: 'function',
    name: 'markUsed',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'commitment', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'getTicketInfo',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'eventId', type: 'uint256' },
          { name: 'commitment', type: 'bytes32' },
          { name: 'used', type: 'bool' }
        ]
      }
    ]
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true }
    ]
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

  return process.env.CONTRACT_ADDRESS.trim()
}

const getPrivateKey = () => {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY is not configured')
  }

  return process.env.PRIVATE_KEY.trim()
}

const getReadContract = () => {
  return new ethers.Contract(getContractAddress(), TICKET_ABI, getProvider())
}

const getWriteContract = () => {
  const wallet = new ethers.Wallet(getPrivateKey(), getProvider())
  return new ethers.Contract(getContractAddress(), TICKET_ABI, wallet)
}

const getEvent = async (eventId) => {
  const contract = getReadContract()
  try {
    const event = await contract.getEvent(eventId)
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
    const filter = contract.filters.Transfer(null, walletAddress)
    const events = await contract.queryFilter(filter)
    
    const tokenIds = []
    for (const event of events) {
      // event.args[2] is the tokenId
      tokenIds.push(Number(event.args[2]))
    }

    return tokenIds
  } catch (err) {
    throw new Error(`Failed to fetch user tickets: ${err.message}`)
  }
}

module.exports = {
  getEvent,
  getTicketInfo,
  mintTicket,
  markUsed,
  getUserTickets
}
