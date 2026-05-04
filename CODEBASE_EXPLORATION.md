# BlockMyShow - Decentralized Ticketing System
## Comprehensive Codebase Exploration

---

## 📋 Project Overview

**BlockMyShow** is a decentralized ticketing system built on blockchain (Ethereum) that addresses key issues in the ticketing industry:
- **No Fake Tickets**: All tickets are verifiable NFTs on-chain
- **No Reselling Scams**: Tickets are non-transferable, preventing unauthorized resale
- **Privacy-First**: Identity is hashed and never exposed directly on-chain
- **Trustless Verification**: Entry uses OTP + identity commitment verification

---

## 🏗️ System Architecture

### High-Level Flow

```
User/Admin → Web/Mobile Frontend → Express Backend → Smart Contract + Blockchain
                                        ↓
                                   Identity DB
                                   OTP Service (Twilio)
                                   JWT Auth
```

---

## 1️⃣ Smart Contract Layer (On-Chain)

**File**: `/contract/src/Ticket.sol`  
**Framework**: Solidity ^0.8.20 + OpenZeppelin ERC721  
**Network**: Ethereum (Currently Base Sepolia - Chain 84532)

### Core Components

#### Data Structures

```solidity
struct EventInfo {
    uint256 eventId;
    string  title;
    string  venue;
    uint256 date;
    uint256 price;         // in rupees (reference only)
    uint256 totalTickets;
    uint256 ticketsMinted;
    string  metadataURI;   // IPFS link
}

struct TicketInfo {
    uint256 eventId;
    bytes32 commitment;    // keccak256(secret + identity_id + eventId)
    bool    used;
}

mapping(uint256 => EventInfo)  public events;
mapping(uint256 => TicketInfo) public tickets;
```

#### Key Contract Functions

| Function | Purpose | Access | Notes |
|----------|---------|--------|-------|
| `createEvent(...)` | Create new event | `onlyOwner` | Assigns eventId, validates date > now |
| `updateEventMetadata(eventId, newURI)` | Update metadata URI | `onlyOwner` | Only IPFS URI can be updated |
| `getEvent(eventId)` | Fetch event details | Public | Used by backend |
| `mintTicket(to, eventId, commitment)` | Mint NFT ticket | `onlyOwner` | Non-transferable, checks sold out |
| `markUsed(tokenId, commitment)` | Mark ticket used at gate | `onlyOwner` | Verifies commitment, prevents reuse |
| `getTicketInfo(tokenId)` | Fetch ticket data | Public | Returns eventId, commitment, used status |
| `tokenURI(tokenId)` | Get metadata URI | Public | Returns event's metadataURI |

#### Critical Design Details

**Non-Transferability**:
```solidity
function _update(address to, uint256 tokenId, address auth)
    internal override returns (address) {
    address from = _ownerOf(tokenId);
    require(from == address(0), "Tickets are non-transferable");
    return super._update(to, tokenId, auth);
}
```
- Only allows minting (from == address(0))
- Transfers are explicitly blocked
- Prevents unauthorized reselling

**Important Note**: There is **NO direct on-chain mapping for**:
- `walletAddress → tokenIds[]`
- `eventId → tokenIds[]`

Ownership tracking relies on **ERC721 Transfer events**, which the backend queries.

---

## 2️⃣ Backend Architecture

**Framework**: Node.js + Express  
**Main File**: `/backend/app.js`  
**Database**: Appwrite (via node-appwrite)  
**Authentication**: JWT + Custom Middleware

### Folder Structure

```
backend/
├── app.js                    # Express app setup
├── server.js                 # Server entry point
├── package.json              # Dependencies
├── config/
│   ├── env.js               # Environment variables
│   └── appwrite.js          # Appwrite client config
├── controllers/             # Business logic
│   ├── userController.js    # User auth
│   ├── adminController.js   # Admin operations
│   ├── eventController.js   # Event CRUD
│   ├── ticketsController.js # Ticket minting
│   ├── gateController.js    # Gate entry verification
│   └── identityController.js # Identity management
├── routes/                  # API endpoints
├── middleware/              # Auth & role checks
├── models/                  # Data models
├── service/                 # Business services
└── utils/                   # Utilities (hash, response)
```

### Dependencies

```json
{
  "bcryptjs": "^3.0.3",      // Password hashing
  "cors": "^2.8.6",           // Cross-origin support
  "dotenv": "^17.4.2",        // Environment config
  "ethers": "^6.16.0",        // Web3 interaction
  "express": "^5.2.1",        // HTTP framework
  "jsonwebtoken": "^9.0.3",   // JWT auth
  "node-appwrite": "^24.0.0", // Database
  "nodemon": "^3.1.14",       // Dev auto-reload
  "twilio": "^6.0.0"          // SMS/OTP service
}
```

### API Routes & Controllers

#### User Authentication
**Route**: `POST /api/user/auth`  
**Controller**: `userController.js`

- Handles signup/login via OTP
- Generates JWT tokens
- Stores wallet address in token claims

#### Admin Authentication
**Route**: `POST /api/admin/login`  
**Controller**: `adminController.js`

- Username/password authentication
- Returns admin JWT token
- Includes role info (admin, super_admin)

#### Events Management
**Routes**:
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (admin only)
- `PUT /api/events/:id` - Update event metadata (admin only)

**Controller**: `eventController.js`

**Flow for event creation**:
```
POST /api/events
  → Validate input
  → Call smart contract createEvent()
  → Store metadata off-chain
  → Return eventId
```

#### Identity Management
**Route**: `POST /api/identity/add`  
**Controller**: `identityController.js`

**Request**:
```json
{
  "identity_id": "123456789012",  // Aadhaar or unique ID
  "phone_number": "+919876543210",
  "name": "John Doe",
  "profile_photo_url": "https://..."
}
```

**Backend Work**:
- Hash identity using `hashIdentity(identity_id)`
- Store hashed mapping: `hashedId → identity data`
- Enables privacy-preserving lookups

#### Tickets Management
**Routes**:
- `POST /api/tickets/request` - Start ticket purchase
- `POST /api/tickets/confirm` - Confirm + mint NFT
- `GET /api/tickets/my-tickets` - Fetch user's tickets

**Controller**: `ticketsController.js`

**Flow for ticket purchase**:

```
1. POST /api/tickets/request
   ├─ Validate identity exists
   ├─ Check event not sold out
   ├─ Generate OTP
   └─ Send OTP via Twilio SMS

2. User receives OTP, enters in UI

3. POST /api/tickets/confirm
   ├─ Verify OTP (from otpService)
   ├─ Create commitment: keccak256(secret + identity_id + eventId)
   ├─ Call contract.mintTicket(userWallet, eventId, commitment)
   ├─ Blockchain mints NFT, returns tokenId
   └─ Return tokenId to user
```

**Critical Issue** (from tobedone.md):
- `/api/tickets/my-tickets` is **SLOW**
- Cause: Scans blockchain events on each call
- Solution needed: Cache tokenIds in DB, maintain wallet → tokenIds mapping

#### Gate Entry Verification
**Routes**:
- `POST /api/gate/entry` - Start entry verification
- `POST /api/gate/verify-entry` - Final entry approval

**Controller**: `gateController.js`  
**Access**: Admin/Gatekeeper only (roleMiddleware)

**Flow for gate entry**:

```
1. POST /api/gate/entry
   ├─ Gatekeeper scans QR code → extract tokenId
   ├─ Get ticket info from blockchain
   ├─ Check not already used
   ├─ Hash identity from input
   ├─ Recreate expected commitment:
   │  keccak256(secret + identity_id + ticketInfo.eventId)
   ├─ Verify commitment matches blockchain
   ├─ If match: Generate OTP
   └─ Send OTP to identity's phone

2. Gatekeeper shows identity verification (photo comparison)

3. POST /api/gate/verify-entry
   ├─ Verify OTP
   ├─ Call contract.markUsed(tokenId, commitment)
   ├─ Blockchain sets used = true
   └─ Allow entry
```

### Service Layer

**Location**: `/backend/service/`

| Service | Purpose |
|---------|---------|
| `authService.js` | Auth logic (signup/login) |
| `blockchainService.js` | Smart contract interaction via ethers |
| `identityService.js` | Identity hashing & lookup |
| `jwtService.js` | JWT token creation/verification |
| `mailService.js` | Email notifications |
| `otpService.js` | In-memory OTP generation/verification |
| `smsService.js` | Twilio SMS integration |

### Middleware

**Authentication**: `authMiddleware.js`
- Extracts JWT from Authorization header
- Verifies signature and expiry
- Stores user data in `req.user`

**Role-Based Access**: `roleMiddleware.js`
- Checks `req.user.role` against allowed roles
- Returns 403 if unauthorized
- Used by admin/gatekeeper routes

---

## 3️⃣ Frontend: User Web App

**Framework**: React + Vite  
**Location**: `/frontend/user-web/`

### Structure

```
user-web/src/
├── App.jsx                      # Main router & layout
├── main.jsx                     # Entry point
├── App.css                      # Global styles
├── context/
│   └── AuthContext.jsx          # User auth state
├── pages/
│   ├── AuthPage.jsx             # Login/signup
│   ├── DashboardPage.jsx        # Browse events
│   ├── TicketsPage.jsx          # View purchased tickets
│   └── ManageEventsPage.jsx     # Admin event creation
├── components/
│   ├── Navbar.jsx               # Header navigation
│   ├── PaymentModal.jsx         # Test payment flow
│   └── AadhaarModal.jsx         # Identity input modal
└── index.css                    # Styling
```

### Key Pages

#### AuthPage
- Signup/login form
- OTP verification
- Sets JWT token in localStorage
- Redirects to dashboard on success

#### DashboardPage
- Fetches `GET /api/events`
- Displays event cards with:
  - Event title, venue, date
  - Available ticket count
  - Price
  - "Book Ticket" button
- Initiates ticket purchase flow

#### TicketsPage
- Fetches `GET /api/tickets/my-tickets`
- Displays user's purchased tickets
- Shows tokenId, event details, status (used/unused)
- QR code for entry

#### ManageEventsPage (Admin Only)
- Create new events
- Update event metadata
- View all created events
- Admin-only route check

### AuthContext
- Manages `isAuthenticated`, `userToken`, `isAdmin` state
- Stores/retrieves JWT from localStorage
- Provides user info globally
- Auto-login on page refresh

---

## 4️⃣ Frontend: Admin Mobile App (Gate Keeper)

**Framework**: React Native + Expo + TypeScript  
**Location**: `/frontend/admin-app/`

### Structure

```
admin-app/
├── app/
│   ├── _layout.tsx              # Root navigator
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigation
│   │   ├── gate.tsx             # QR scan & entry
│   │   ├── events.tsx           # View events
│   │   ├── explore.tsx          # Browse data
│   │   └── index.tsx            # Home screen
│   └── modal.tsx                # Modal screen
├── screens/
│   └── AdminLoginScreen.tsx     # Admin login
├── context/
│   └── AdminAuthContext.tsx     # Admin auth state
├── hooks/
├── components/
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── ui/
└── constants/
    └── theme.ts                 # Dark/light theme
```

### Authentication Flow (Admin App)

```tsx
1. App starts → RootLayout checks isAuthenticated
2. If not authenticated → Show AdminLoginScreen
3. Admin enters username/password
   → POST /api/admin/login
   → Backend returns JWT token
4. Store token in AsyncStorage/Context
5. If authenticated → Show TabNavigator (gate, events, explore)
```

### Gate Scan Flow

**Expected in `app/(tabs)/gate.tsx`**:

```
1. Show camera/QR scanner
2. Scan QR code from ticket → extract tokenId
3. Admin enters identity (Aadhaar)
4. POST /api/gate/entry
   ├─ Backend validates ticket
   ├─ Sends OTP to user
   └─ Shows identity photo
5. Admin compares photo with person
6. Admin confirms OTP
7. POST /api/gate/verify-entry
   ├─ Backend marks ticket as used
   └─ Allow entry with success message
```

---

## 📊 Database Structure

### Appwrite Collections

Based on models in `/backend/models/`:

#### Users Collection
```
{
  email: string,
  password_hash: string,
  wallet_address: string,
  phone_number?: string,
  created_at: timestamp
}
```

#### Admins Collection
```
{
  username: string,
  password_hash: string,
  role: enum (admin, super_admin),
  created_at: timestamp
}
```

#### Identities Collection
```
{
  identity_id: string (raw Aadhaar),
  hashed_id: string (keccak256 hash),
  phone_number: string,
  name: string,
  profile_photo_url: string,
  created_at: timestamp
}
```

#### Events Collection
```
{
  event_id: number (from blockchain),
  title: string,
  venue: string,
  date: timestamp,
  price: number,
  total_tickets: number,
  metadata_uri: string,
  synced_from_blockchain: boolean,
  created_at: timestamp
}
```

#### Tickets Collection
```
{
  token_id: number (NFT tokenId),
  wallet_address: string,
  event_id: number,
  status: enum (pending, minted, used),
  created_at: timestamp,
  used_at?: timestamp
}
```

---

## 🔐 Security & Privacy Design

### Privacy-First Identity

**Problem**: Blockchain is public; identities must remain private

**Solution**:
1. Identity stored OFF-CHAIN only (in database)
2. On-chain, tickets store: `commitment = keccak256(secret + identity_id + eventId)`
3. Commitment never reveals identity
4. Gate keeper verifies by:
   - Getting identity_id from QR/input
   - Recreating commitment locally
   - Comparing with blockchain commitment

**Secret**: 
```javascript
const secret = process.env.OTP_SECRET || process.env.JWT_SECRET
const commitment = ethers.keccak256(
  ethers.toUtf8Bytes(secret + identity_id + ticketInfo.eventId)
)
```

### Non-Transferable Tickets

**Problem**: Tickets could be resold fraudulently

**Solution**: Smart contract blocks transfers
```solidity
require(from == address(0), "Tickets are non-transferable");
```
Only allows minting; transfers impossible.

### OTP for Verification

**Request Flow**:
1. SMS OTP sent to registered phone
2. Valid for ~5 minutes
3. In-memory storage (cleared on server restart)
4. Used for both ticket purchase & gate entry

---

## 🔄 Complete User Journey

### User Perspective

```
1. Visit /auth
   └─ Sign up / Log in
      ├─ Enter email & password
      ├─ Receive OTP via SMS
      └─ Verify OTP → JWT token stored

2. Dashboard (/
   └─ Browse all events
      ├─ See ticket availability
      └─ Click "Book Ticket"

3. Add Identity
   └─ Enter Aadhaar, phone, name, photo

4. Confirm Ticket Purchase
   ├─ POST /api/tickets/request
   │  └─ Receive OTP via SMS
   ├─ Enter OTP
   └─ POST /api/tickets/confirm
      ├─ Backend mints NFT
      ├─ Blockchain returns tokenId
      └─ User receives ticket

5. View Tickets (/tickets)
   └─ See all purchased tickets
      ├─ Event details
      ├─ Token ID
      └─ QR code for entry

6. Event Day - Gate Entry
   └─ Show QR code to gatekeeper
      ├─ Gatekeeper scans → tokenId
      ├─ Gatekeeper verifies identity
      └─ User enters event
```

### Admin Perspective

```
1. Admin Portal (/auth as admin)
   └─ Login with username/password

2. Create Event (/admin/events)
   ├─ Enter event details
   ├─ Set ticket price & supply
   └─ Smart contract stores event
      └─ Returns eventId

3. Gatekeeper App
   ├─ Login with same credentials
   └─ Open "Gate" tab
      ├─ Scan QR code from ticket
      ├─ Enter user's identity
      ├─ Verify identity photo
      ├─ Confirm OTP from user
      └─ Mark ticket as used on blockchain
```

---

## 📈 Data Flow Diagrams

### Ticket Minting Flow

```
User Frontend
    ↓
POST /api/tickets/request
    ↓
Backend: Generate OTP → Send SMS
    ↓
User enters OTP
    ↓
POST /api/tickets/confirm
    ↓
Backend: Verify OTP
    ↓
Create commitment = keccak256(secret + identity_id + eventId)
    ↓
Call contract.mintTicket(userWallet, eventId, commitment)
    ↓
Smart Contract
  ├─ Validate event exists
  ├─ Check ticketsMinted < totalTickets
  ├─ Generate tokenId (nextTokenId++)
  ├─ Call _safeMint(userWallet, tokenId)
  ├─ Store TicketInfo{eventId, commitment, used:false}
  └─ Emit TicketMinted event
    ↓
NFT Token Created (Non-transferable)
    ↓
Backend: Store tokenId in DB
    ↓
Return tokenId to user
```

### Gate Entry Verification Flow

```
Gatekeeper App
    ├─ Scan QR → Get tokenId
    ├─ Enter user's identity_id
    └─ POST /api/gate/entry
         ↓
Backend:
  ├─ Fetch ticketInfo from blockchain
  ├─ Check not already used
  ├─ Hash identity_id
  ├─ Lookup identity details (name, photo)
  ├─ Recreate commitment = keccak256(secret + identity_id + eventId)
  ├─ Verify: commitment == ticketInfo.commitment
  ├─ Generate OTP
  └─ Send OTP via SMS
         ↓
Gatekeeper sees identity photo
  ├─ Compares with person
  ├─ Gets OTP from user
  └─ POST /api/gate/verify-entry
       ↓
Backend:
  ├─ Verify OTP
  ├─ Call contract.markUsed(tokenId, commitment)
       ↓
Smart Contract:
  ├─ Check ticketInfo.commitment == provided commitment
  ├─ Set ticketInfo.used = true
  ├─ Emit TicketUsed event
       ↓
Return success
  └─ Allow entry
```

---

## ⚠️ Known Issues & TODOs

From `tobedone.md`:

### Critical
**Ticket Optimization** (CRITICAL)
- `/api/tickets/my-tickets` is SLOW
- **Problem**: Scans blockchain events each time
- **Solution**: 
  - Cache tokenIds in database
  - Maintain mapping: `wallet → [tokenIds]`
  - Update on mint + transfer
  - Avoid full chain scan

### High Priority
1. **Admin UI Polish**: Remove unnecessary tabs, keep only Gate Scan flow
2. **Payment Gateway**: Integrate test payment flow before mint
3. **User Web UI Polish**: Better UX, loading states, clean ticket view

### Medium Priority
1. **Authentication Upgrade**:
   - Google Sign-in
   - MetaMask login
   - Use Clerk for auth management

---

## 🛠️ Environment Variables

**Backend `.env`**:
```
OTP_SECRET=<random-secret-for-commitment>
TWILIO_SID=<twilio-account-sid>
TWILIO_TOKEN=<twilio-auth-token>
RPC_URL=https://sepolia.base.org  # or Ethereum RPC
PRIVATE_KEY=<contract-owner-private-key>
JWT_SECRET=<jwt-signing-secret>
APPWRITE_API_KEY=<appwrite-key>
APPWRITE_ENDPOINT=<appwrite-url>
APPWRITE_DATABASE_ID=<database-id>
```

**Contract `.env`**:
```
PRIVATE_KEY=<deployer-wallet-key>
RPC_URL=https://sepolia.base.org
```

---

## 📚 Postman Collection

API endpoints documented in `Blockmyshow.postman_collection.json`:

**Variables Setup**:
- `baseUrl`: http://localhost:5000
- `userEmail`, `userPassword`, `userOtp`
- `adminUsername`, `adminPassword`, `adminToken`
- `eventId`, `identityId`, `phoneNumber`
- `tokenId`, `ticketOtp`

**Available Requests**:
- Health Check: GET /
- User Auth (Login, Signup, Verify OTP)
- Admin Login: POST /api/admin/login
- Events (List, Get One, Create, Update Metadata)
- Identity (Add Identity)
- Tickets (Request, Confirm, Get My Tickets)
- Gate (Entry, Verify Entry)

---

## 🚀 Next Steps / Recommendations

1. **Fix Critical Performance Issue**
   - Implement ticket caching for `/api/tickets/my-tickets`
   - Add wallet → tokenIds mapping in database

2. **Enhance Security**
   - Add rate limiting on OTP endpoints
   - Implement transaction signing with wallet

3. **Improve UX**
   - Add loading indicators
   - Better error messages
   - Confirmation dialogs

4. **Blockchain Optimization**
   - Consider event-to-tokenIds mapping for scalability
   - Add event indexing

5. **Testing**
   - Unit tests for controllers
   - Integration tests for blockchain interactions
   - E2E tests for user flows

---

## 📝 Key Files Reference

| Component | Key Files |
|-----------|-----------|
| Smart Contract | `/contract/src/Ticket.sol` |
| Backend API | `/backend/app.js`, `/backend/routes/*`, `/backend/controllers/*` |
| User Web | `/frontend/user-web/src/App.jsx`, `pages/*` |
| Admin Mobile | `/frontend/admin-app/app/_layout.tsx`, `screens/AdminLoginScreen.tsx` |
| Documentation | `/architecture.md`, `/README.md`, `/tobedone.md` |
| API Docs | `/Blockmyshow.postman_collection.json` |

---

## 🎯 Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        BlockMyShow System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────┐       │
│  │   User Web (React)   │      │  Admin App (React    │       │
│  │  - Browse Events     │      │  Native + Expo)      │       │
│  │  - Buy Tickets       │      │  - Gate Scanning     │       │
│  │  - View Tickets      │      │  - Identity Verify   │       │
│  └──────────┬───────────┘      └──────────┬───────────┘       │
│             │                             │                    │
│             └─────────────────┬───────────┘                    │
│                               │                                │
│                    ┌──────────▼──────────┐                     │
│                    │   Express Backend   │                     │
│                    │   (Node.js)         │                     │
│                    │                     │                     │
│   ┌────────────────┼────────────────┬────────────────┐         │
│   │                │                │                │         │
│   ▼                ▼                ▼                ▼         │
│ Routes:         Services:       Middleware:    Database:      │
│ - /user/auth    - authService    - auth         - Appwrite    │
│ - /admin/*      - blockchain     - roleCheck    - Users       │
│ - /events       - identity       - errorHandle  - Events      │
│ - /tickets      - otpService                    - Tickets     │
│ - /gate         - smsService                    - Identities  │
│                 - jwtService                                  │
│                                                                 │
│                    ┌──────────────────────┐                    │
│                    │  Smart Contract      │                    │
│                    │  (Solidity/Ethereum) │                    │
│                    │                      │                    │
│                    │ - Events Mapping     │                    │
│                    │ - Tickets Mapping    │                    │
│                    │ - mintTicket()       │                    │
│                    │ - markUsed()         │                    │
│                    │ - Non-transferable   │                    │
│                    └──────────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

Generated: May 4, 2026
Status: Fully Explored & Documented
