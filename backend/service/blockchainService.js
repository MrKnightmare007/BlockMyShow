const { ethers } = require('ethers')

// Updated ABI for ProofPass contract with resale support
const TICKET_ABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {
        "name": "to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "buyResale",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "buyer",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "newCommitment",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelListing",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createEvent",
    "inputs": [
      {
        "name": "title",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "venue",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "date",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "price",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "photoUrl",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "totalTickets",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "events",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "eventId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "title",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "venue",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "date",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "price",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "photoUrl",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "totalTickets",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "ticketsMinted",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getApproved",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEvent",
    "inputs": [
      {
        "name": "eventId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct ProofPass.EventInfo",
        "components": [
          {
            "name": "eventId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "title",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "venue",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "date",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "price",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "photoUrl",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "totalTickets",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "ticketsMinted",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getListedTokens",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTicketInfo",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct ProofPass.TicketInfo",
        "components": [
          {
            "name": "eventId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "commitment",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "used",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "isListed",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "listPrice",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "salePrice",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserTickets",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isApprovedForAll",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "operator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "listForResale",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "price",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "listedTokens",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "markUsed",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "commitment",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "mintTicket",
    "inputs": [
      {
        "name": "to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "eventId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "commitment",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextEventId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextTokenId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ownerOf",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "safeTransferFrom",
    "inputs": [
      {
        "name": "from",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "safeTransferFrom",
    "inputs": [
      {
        "name": "from",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setApprovalForAll",
    "inputs": [
      {
        "name": "operator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "approved",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "supportsInterface",
    "inputs": [
      {
        "name": "interfaceId",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tickets",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "eventId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "commitment",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "used",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "isListed",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "listPrice",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "salePrice",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokenURI",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferFrom",
    "inputs": [
      {
        "name": "from",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateEventMetadata",
    "inputs": [
      {
        "name": "eventId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "newPhotoUrl",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateListPrice",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "newPrice",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "usedCommitments",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Approval",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "approved",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ApprovalForAll",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "operator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "approved",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "EventCreated",
    "inputs": [
      {
        "name": "eventId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "title",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "date",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "totalTickets",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "EventMetadataUpdated",
    "inputs": [
      {
        "name": "eventId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "newPhotoUrl",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TicketListPriceUpdated",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "oldPrice",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newPrice",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TicketListed",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "listPrice",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TicketMinted",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "to",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "eventId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "commitment",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TicketResold",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "price",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TicketUnlisted",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TicketUsed",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      {
        "name": "from",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "to",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "ERC721IncorrectOwner",
    "inputs": [
      {
        "name": "sender",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC721InsufficientApproval",
    "inputs": [
      {
        "name": "operator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC721InvalidApprover",
    "inputs": [
      {
        "name": "approver",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC721InvalidOperator",
    "inputs": [
      {
        "name": "operator",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC721InvalidOwner",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC721InvalidReceiver",
    "inputs": [
      {
        "name": "receiver",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC721InvalidSender",
    "inputs": [
      {
        "name": "sender",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "ERC721NonexistentToken",
    "inputs": [
      {
        "name": "tokenId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
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
      used: ticket.used,
      isListed: ticket.isListed,
      listPrice: Number(ticket.listPrice)
    }
  } catch (err) {
    throw new Error(`Failed to fetch ticket info: ${err.message}`)
  }
}

const getTicketOwner = async (tokenId) => {
  const contract = getReadContract()
  try {
    const owner = await contract.ownerOf(tokenId)
    return owner
  } catch (err) {
    throw new Error(`Failed to fetch ticket owner: ${err.message}`)
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
    console.log(`[getUserTickets] Fetching tickets for wallet: ${walletAddress}`)
    
    // Call the smart contract's getUserTickets function directly
    // This is much faster than searching through blockchain blocks
    const tokenIds = await contract.getUserTickets(walletAddress)
    
    console.log(`[getUserTickets] Retrieved ${tokenIds.length} tickets`)
    
    return tokenIds.map(id => Number(id))
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
  getTicketOwner,
  getUserTickets,
  mintTicket,
  markUsed,
  getListedTokens,
  listForResale,
  cancelListing,
  updateListPrice,
  buyResale
}
