const { ethers } = require('ethers')

const EVENT_INFO_COMPONENTS = [
  { name: 'eventId', type: 'uint256' },
  { name: 'title', type: 'string' },
  { name: 'venue', type: 'string' },
  { name: 'date', type: 'uint256' },
  { name: 'price', type: 'uint256' },
  { name: 'totalTickets', type: 'uint256' },
  { name: 'ticketsMinted', type: 'uint256' },
  { name: 'metadataURI', type: 'string' }
]

const TICKET_ABI = [
  {
    type: 'function',
    name: 'createEvent',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'venue', type: 'string' },
      { name: 'date', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'totalTickets', type: 'uint256' },
      { name: 'metadataURI', type: 'string' }
    ],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  },
  {
    type: 'function',
    name: 'updateEventMetadata',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'newURI', type: 'string' }
    ],
    outputs: []
  },
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
        components: EVENT_INFO_COMPONENTS
      }
    ]
  },
  {
    type: 'function',
    name: 'nextEventId',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256' }
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

const normalizeEvent = (eventInfo) => {
  return {
    eventId: Number(eventInfo.eventId ?? eventInfo[0]),
    title: eventInfo.title ?? eventInfo[1],
    venue: eventInfo.venue ?? eventInfo[2],
    date: Number(eventInfo.date ?? eventInfo[3]),
    price: Number(eventInfo.price ?? eventInfo[4]),
    totalTickets: Number(eventInfo.totalTickets ?? eventInfo[5]),
    ticketsMinted: Number(eventInfo.ticketsMinted ?? eventInfo[6]),
    metadataURI: eventInfo.metadataURI ?? eventInfo[7]
  }
}

const createEventOnChain = async (data) => {
  const contract = getWriteContract()
  const eventId = await contract.createEvent.staticCall(
    data.title,
    data.venue,
    data.date,
    data.price,
    data.totalTickets,
    data.metadataURI
  )

  const tx = await contract.createEvent(
    data.title,
    data.venue,
    data.date,
    data.price,
    data.totalTickets,
    data.metadataURI
  )
  const receipt = await tx.wait()

  return {
    eventId: Number(eventId),
    transactionHash: receipt.hash
  }
}

const updateEventMetadataOnChain = async (eventId, metadataURI) => {
  const contract = getWriteContract()
  const tx = await contract.updateEventMetadata(eventId, metadataURI)
  const receipt = await tx.wait()

  return {
    eventId: Number(eventId),
    metadataURI,
    transactionHash: receipt.hash
  }
}

const getEventFromChain = async (eventId) => {
  const contract = getReadContract()
  const getEvent = contract.getFunction('getEvent')
  const eventInfo = await getEvent(eventId)

  return normalizeEvent(eventInfo)
}

const listEventsFromChain = async () => {
  const contract = getReadContract()
  const totalEvents = Number(await contract.nextEventId())
  const getEvent = contract.getFunction('getEvent')
  const events = []

  for (let eventId = 0; eventId < totalEvents; eventId += 1) {
    const eventInfo = await getEvent(eventId)
    events.push(normalizeEvent(eventInfo))
  }

  return events
}

module.exports = {
  createEventOnChain,
  updateEventMetadataOnChain,
  getEventFromChain,
  listEventsFromChain
}
