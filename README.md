# ProofPass - Identity-Bound NFT Ticketing Platform

A blockchain-based event ticketing platform combining **Web2 simplicity** with **Web3 trust and security**.

> ProofPass is a fiat-powered NFT ticketing system with identity-bound verification, zero-knowledge-inspired commitments, automatic wallet creation, and immutable on-chain event storage.

---

## 🎯 Core Concept

ProofPass eliminates traditional ticketing fraud by:
- **Wallet-free Web3 UX**: Users never see blockchain complexity
- **Fiat Payments**: Pay in ₹ via Razorpay (no crypto needed)
- **Non-Transferable NFTs**: Prevents ticket resale/scalping
- **Identity-Bound Tickets**: Tickets linked to Aadhaar identity
- **ZK-Inspired Verification**: Privacy-preserving commitment proofs
- **Immutable Records**: On-chain audit trail for every ticket

---

## 🏗️ Architecture

```
Frontend (React)
    ↓
Backend API (Express)
    ↓
Smart Contract (ERC721)
    ↓
Blockchain (Ethereum)
```

### System Flow

```
1. Login              →  Backend creates hidden wallet
2. Browse Events      →  IPFS-hosted event images
3. Buy Ticket         →  Razorpay payment
4. Identity Check     →  OTP verification
5. NFT Minting        →  Smart contract creation
6. Gate Entry         →  QR scan + identity verification
7. Mark Used          →  On-chain ticket usage
```

### Data Layers

**Frontend**: React + Vite + Tailwind CSS
- Event browsing
- Ticket booking UI
- Organizer dashboard
- Gate scanner interface

**Backend**: Express.js API
- User authentication & wallet management
- Event CRUD operations
- Razorpay payment processing
- OTP-based identity verification
- Smart contract interaction
- Ticket state management

**Smart Contract**: Non-Transferable ERC721
- Ticket minting with commitment proof
- Identity binding (Aadhaar)
- Usage tracking
- Transfer restrictions
- IPFS metadata references

---

## ✨ Core Features

### 1. **Account Abstraction (Invisible Wallet Creation)**
- User logs in with Google/email
- Backend auto-generates blockchain wallet
- No MetaMask or crypto knowledge required
- Wallet stored securely backend-side

### 2. **Fiat Payment Integration**
- Users pay using ₹ (normal currency)
- Payment through Razorpay
- No crypto purchase required
- NFT minted only after successful payment

### 3. **NFT-Based Ticket Ownership**
- Every ticket is an NFT
- Ticket exists permanently on blockchain
- Unique ownership proof
- Immutable ticket history

### 4. **Non-Transferable NFT Tickets**
- Ticket NFT cannot be transferred
- Prevents resale abuse and scalping
- Identity remains bound to original buyer
- Smart contract enforces transfer restrictions

### 5. **Identity-Bound Ticketing**
- Ticket linked to Aadhaar-based identity mapping
- Mock Aadhaar registry for MVP
- Prevents unauthorized sharing

### 6. **OTP-Based Identity Verification**
- OTP sent to registered phone
- Used during booking
- Used again during gate verification
- Possession-based authentication

### 7. **Basic ZK Commitment Proof**
- Identity not stored directly on-chain
- Cryptographic commitment generated:
  ```
  commitment = SHA256(secret + ticketId + identityHash)
  ```
- Privacy-preserving identity validation

### 8. **On-Chain Event & Ticket Storage**
- Event metadata tied to blockchain
- Immutable event ownership
- Ticket status stored on-chain (used/unused)
- No duplicate usage possible

### 9. **QR-Based Entry Pass**
- Each ticket generates unique QR
- QR used at gate for scanning
- Fast verification process

### 10. **Gate Verification System**
- QR scan validation
- Aadhaar re-check
- OTP verification
- Photo retrieval
- Entry allow/reject with face matching

### 11. **Face Verification Layer**
- Profile photo linked to identity mapping
- Gate staff compares face manually
- Extra anti-fraud security layer

### 12. **IPFS Metadata Storage**
- Event image stored in IPFS
- NFT metadata references IPFS CID
- Decentralized permanent storage

### 13. **Escrow-Based Payment Flow**
- Money held temporarily in escrow
- Organizer paid after event completion
- Refund-friendly model for cancellations

### 14. **Anti-Fraud Ticketing**
- Prevent fake tickets
- Prevent screenshot sharing
- Prevent duplicate entry
- Prevent manual database tampering

### 15. **Organizer Dashboard**
- Create events
- Manage ticket limits
- Revenue tracking
- Event analytics

### 16. **Gate Scanner Application**
- Separate verifier interface
- Security-focused workflow
- Ticket validation terminal

---

## 🗂️ Project Structure

```
BlockMyShow/
├── contract/                    # Smart Contracts (Hardhat)
│   ├── contracts/
│   │   └── TicketNFT.sol       # ERC721 non-transferable NFT
│   ├── scripts/
│   │   └── deploy.js           # Deployment automation
│   ├── hardhat.config.cjs
│   └── package.json
│
├── backend/                     # Express API Server
│   ├── src/
│   │   ├── controllers/        # Business logic (auth, events, tickets, payment, identity, gate)
│   │   ├── routes/             # API route definitions
│   │   ├── middleware/         # JWT authentication
│   │   ├── models/             # Data models
│   │   ├── utils/              # Helpers (wallet, blockchain)
│   │   └── index.js            # Server entry point
│   ├── .env.example            # Environment template
│   └── package.json
│
├── frontend/                    # React + Vite UI
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page-level components
│   │   ├── contexts/           # Theme context
│   │   ├── contracts/          # Smart contract ABI
│   │   ├── styles/             # CSS files
│   │   ├── config.js           # Configuration
│   │   └── App.jsx
│   ├── public/                 # Static assets
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── feature.md                  # Feature list
├── target.md                   # Project specification
├── package.json                # Monorepo root
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Ganache (for local development)

### Installation

```bash
# Install root dependencies
npm install

# Install contract dependencies
cd contract && npm install

# Install backend dependencies
cd ../backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Development

**Terminal 1 - Backend API (port 5000)**
```bash
cd backend
cp .env.example .env  # Configure environment variables
npm run dev
```

**Terminal 2 - Frontend (port 5173)**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Smart Contract**
```bash
cd contract
npm run compile
npm run deploy:ganache  # Or deploy:sepolia
```

**Terminal 4 - Ganache (Local Blockchain)**
```bash
ganache-cli
```

### Configuration

**Backend** (`backend/.env`):
```env
PORT=5000
JWT_SECRET=your_secret
DATABASE_URL=mongodb://localhost:27017/proofpass
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
CONTRACT_ADDRESS=0x...
NETWORK_URL=http://127.0.0.1:7545
```

**Frontend** (`frontend/src/config.js`):
- Update `CONTRACT_ADDRESS` after deployment
- Update `BACKEND_API_URL` to your API endpoint

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login/register user
- `GET /api/auth/wallet` - Get user's wallet address

### Events
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create new event (organizer)

### Tickets
- `GET /api/tickets/my-tickets` - User's tickets
- `GET /api/tickets/:id` - Ticket details
- `POST /api/tickets/mint` - Mint NFT ticket

### Payment
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/webhook` - Razorpay webhook handler

### Identity
- `POST /api/identity/send-otp` - Send OTP
- `POST /api/identity/verify-otp` - Verify OTP
- `POST /api/identity/commitment` - Generate commitment proof

### Gate Verification
- `POST /api/gate/verify` - Verify ticket at entry
- `POST /api/gate/mark-used` - Mark ticket as used

---

## 🔐 Security Features

- **Private Key Encryption**: Wallet keys encrypted in database
- **ZK Commitments**: Identity proofs don't expose sensitive data
- **JWT Authentication**: API requests require valid tokens
- **OTP Verification**: Two-factor authentication for sensitive operations
- **Transfer Restrictions**: Smart contract prevents ticket transfers
- **Immutable Records**: All tickets recorded on-chain

---

## 💾 Database Schema

**users**: id, email, wallet_address, encrypted_private_key
**events**: id, title, description, price, ipfs_image, organizer_id, date, venue
**tickets**: id, user_id, event_id, token_id, commitment, used, purchase_date
**aadhaar_registry**: aadhaar_id, phone, photo_url, name (mock)
**payments**: id, user_id, event_id, razorpay_order_id, amount, status

---

## 🛠️ Smart Contract

**TicketNFT.sol** (ERC721 + Ownable)

```solidity
struct Ticket {
    uint256 eventId;
    bytes32 commitment;    // ZK proof hash
    bool used;
    string metadataURI;    // IPFS reference
}

// Key functions:
- mintTicket()           // Create NFT ticket
- markUsed()             // Mark ticket as used
- _beforeTokenTransfer() // Block transfers
```

---

## 📦 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Smart Contract | Solidity | 0.8.17 |
| Contract Framework | Hardhat | 2.17.0 |
| Backend | Express.js | 4.18.2 |
| Frontend | React | 18.2.0 |
| Build Tool | Vite | 4.4.5 |
| Styling | Tailwind CSS | 3.4.17 |
| Web3 Library | Ethers.js | 5.7.2 |
| Payment Gateway | Razorpay | 2.9.0 |
| Authentication | JWT | 9.0.2 |

---

## 🚢 Deployment

### Local (Ganache)
```bash
cd contract
npm run deploy:ganache
```

### Testnet (Sepolia)
```bash
cd contract
npm run deploy:sepolia
# Update CONTRACT_ADDRESS in backend/.env and frontend/config.js
```

### Production
- **Contract**: Ethereum Mainnet
- **Backend**: AWS/GCP/Railway
- **Frontend**: Vercel/Netlify
- **Database**: MongoDB Atlas or RDS
- **Storage**: Pinata IPFS

---

## 👥 Team Roles

1. **Frontend Developer** - UI, components, organizer dashboard, QR display
2. **Backend Developer** - APIs, payment, identity, ticket management
3. **Blockchain Developer** - Smart contract, NFT minting, IPFS, Web3
4. **Verification Engineer** - Gate scanner, QR parsing, commitment verification

---

## 📝 Key Features Checklist

- ✅ Account abstraction (auto wallet creation)
- ✅ Fiat payment integration (Razorpay)
- ✅ NFT-based tickets (ERC721)
- ✅ Non-transferable NFTs
- ✅ Identity binding (Aadhaar)
- ✅ OTP verification
- ✅ ZK commitments
- ✅ On-chain event storage
- ✅ On-chain ticket tracking
- ✅ QR-based entry
- ✅ Gate verification system
- ✅ Face verification
- ✅ IPFS metadata storage
- ✅ Escrow payments
- ✅ Anti-fraud measures

---

## 📚 Documentation

- **feature.md** - Detailed feature list
- **target.md** - Full project specification

Each package contains its own README:
- [contract/README.md](contract/README.md)
- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)

---

## 🤝 Contributing

1. Create feature branch from respective package
2. Make changes and test locally
3. Submit pull request with clear description

---

## 📄 License

MIT

---

## 📞 Support

For detailed information, refer to:
- Individual package READMEs
- feature.md for feature descriptions
- target.md for technical specifications
