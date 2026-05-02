# ProofPass - Architecture Documentation

**Project:** Block My Show - NFT-based Event Ticketing Platform  
**Network:** Base Sepolia (L2)  
**Date:** May 2, 2026

---

## 📐 System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      PROOFPASS SYSTEM                       │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌───────▼────────┐   │   ┌─────────▼──────────┐
        │   Frontend     │   │   │    Smart Contract  │
        │  (React+Vite)  │   │   │   (TicketNFT)      │
        └────────────────┘   │   └────────────────────┘
                │            │            │
                │            │   ┌────────▼─────────┐
                │            │   │  Base Sepolia    │
                │            │   │  Blockchain      │
                │            │   └──────────────────┘
                │            │
        ┌───────▼────────────▼──────────┐
        │   Backend API (Express.js)     │
        │   (Port: 5000)                 │
        └────────┬───────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼───┐   ┌───▼────┐   ┌──▼──────┐
│MongoDB│   │Razorpay│   │ Pinata  │
│(Data) │   │(Payments)  │ (IPFS)  │
└───────┘   └────────┘   └─────────┘
```

---

## 🏗️ Project Structure

```
BlockMyShow/
├── contract/                    # Smart Contract
│   ├── contracts/
│   │   └── TicketNFT.sol       # ERC721 soulbound tickets
│   ├── scripts/
│   │   └── deploy.js           # Deployment script
│   ├── hardhat.config.cjs      # Hardhat configuration
│   ├── package.json            # Dependencies
│   └── README.md
│
├── backend/                     # Express.js API Server
│   ├── src/
│   │   ├── index.js            # Express app entry
│   │   ├── controllers/        # Business logic
│   │   │   ├── auth.js         # Authentication
│   │   │   ├── events.js       # Event management
│   │   │   ├── tickets.js      # Ticket operations
│   │   │   ├── payment.js      # Payment processing
│   │   │   ├── identity.js     # Identity verification
│   │   │   └── gate.js         # Gate entry checking
│   │   ├── routes/             # API endpoints
│   │   ├── middleware/         # JWT, auth, rate limiting
│   │   ├── models/             # MongoDB schemas
│   │   └── utils/              # Web3, blockchain utilities
│   ├── API_DOCUMENTATION.md    # Complete API reference
│   ├── SETUP_GUIDE.md          # Setup instructions
│   ├── IMPLEMENTATION_SUMMARY.md
│   └── package.json
│
└── frontend/                    # React + Vite
    ├── src/
    │   ├── components/         # React components
    │   ├── pages/             # Page components
    │   ├── contexts/          # React contexts
    │   └── styles/            # CSS files
    ├── vite.config.js         # Vite configuration
    ├── tailwind.config.js     # Tailwind CSS
    └── package.json
```

---

## 🔗 Smart Contract Architecture

### TicketNFT Contract

**Address (Base Sepolia):** `0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812`  
**Standard:** ERC721 (Non-Transferable)  
**Language:** Solidity 0.8.20

#### Key Features

1. **Event Management**
   - Create events with capacity limits
   - Cancel events with refund triggers
   - Track ticket sales per event

2. **Ticket Minting**
   - Mint NFT tickets after payment verification
   - Bind to ZK commitment (identity privacy)
   - Store IPFS metadata URI

3. **Gate Verification**
   - Mark tickets as used at entry
   - Prevent double entry (once used = locked)
   - Verify ZK commitment matches

4. **Soulbound Tokens**
   - Non-transferable (overridden `_beforeTokenTransfer`)
   - Prevents ticket resale
   - Identity stays with original buyer

#### Main Functions

```solidity
// Event Management
createEvent(title, venue, date, price, totalTickets, metadataURI)
  → returns eventId

cancelEvent(eventId)
  → sets event.active = false

getEvent(eventId) → EventInfo struct

remainingTickets(eventId) → uint256

// Ticket Minting
mintTicket(to, eventId, commitment, metadataURI)
  → returns tokenId
  → reverts if sold out or event inactive

// Gate Verification
markUsed(tokenId)
  → sets ticket.used = true
  → prevents double entry

verifyCommitment(tokenId, commitment)
  → returns bool
  → validates commitment matches stored hash

// Helpers
getTicketInfo(tokenId) → TicketInfo struct
isTicketUsed(tokenId) → bool
tokenURI(tokenId) → IPFS metadata URL
```

#### Data Structures

```solidity
struct EventInfo {
    uint256 eventId;
    string title;
    string venue;
    uint256 date;
    uint256 price;          // in paise (₹1 = 100 paise)
    uint256 totalTickets;   // capacity
    uint256 ticketsMinted;  // sold count
    address organizer;
    string metadataURI;     // IPFS event banner/details
    bool active;
}

struct TicketInfo {
    uint256 eventId;
    bytes32 commitment;     // ZK commitment hash
    bool used;              // entry status
    string metadataURI;     // IPFS ticket metadata
}
```

---

## 🚀 Backend API Architecture

### Server Setup
- **Framework:** Express.js 4.18.2
- **Port:** 5000
- **Environment:** Node.js 22.x
- **Database:** MongoDB (schemas defined)
- **Authentication:** JWT (7-day expiry)
- **Rate Limiting:** 100 requests per 15 minutes

### API Structure

```
BASE_URL: http://localhost:5000/api/v1
```

#### Authentication Middleware
```javascript
// JWT Token Management
Token Format: Bearer <jwt_token>
Payload: { userId, email, role, iat, exp }
Roles: user, organizer, admin
```

### 31 API Endpoints (6 Domains)

---

### 🔐 **DOMAIN 1: Authentication (6 endpoints)**

#### POST `/auth/login`
Login or register user with email/password

**Request:**
```json
{
  "email": "user@example.com",
  "password": "pass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "wallet": "0x...",
    "role": "user"
  }
}
```

---

#### POST `/auth/logout`
Client-side token removal (no server action needed)

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### GET `/auth/wallet`
Get authenticated user's wallet address

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "wallet": "0x1234567890abcdef..."
}
```

---

#### GET `/auth/profile`
Get authenticated user's profile

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "profile": {
    "userId": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+91-9999999999",
    "avatar": "ipfs://Qm...",
    "role": "user",
    "wallet": "0x...",
    "createdAt": "2024-05-01T10:00:00Z"
  }
}
```

---

#### PUT `/auth/profile`
Update user profile information

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Jane Doe",
  "phone": "+91-9999999999",
  "avatar": "ipfs://Qm..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": { ... }
}
```

---

#### POST `/auth/refresh-token`
Get new JWT token

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGc..."
}
```

---

### 📅 **DOMAIN 2: Events (6 endpoints)**

#### GET `/events`
List all events with pagination and filters

**Query Parameters:**
- `limit` (default: 10)
- `offset` (default: 0)
- `status` (active/cancelled)

**Response (200):**
```json
{
  "success": true,
  "events": [
    {
      "id": "evt-123",
      "title": "Summer Concert 2024",
      "venue": "Mumbai",
      "date": "2024-06-15T18:00:00Z",
      "price": 50000,
      "totalTickets": 500,
      "ticketsSold": 250,
      "percentageSold": 50,
      "organizer": "organizer-id",
      "status": "active",
      "metadataURI": "ipfs://Qm..."
    }
  ],
  "total": 50,
  "page": 1
}
```

---

#### GET `/events/:id`
Get single event details

**Response (200):**
```json
{
  "success": true,
  "event": { ... }
}
```

---

#### POST `/events`
Create new event (organizer/admin only)

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Concert Name",
  "venue": "Mumbai",
  "date": "2024-06-15T18:00:00Z",
  "price": 50000,
  "totalTickets": 500,
  "metadataURI": "ipfs://Qm..."
}
```

**Response (201):**
```json
{
  "success": true,
  "event": {
    "id": "evt-123",
    ...
  }
}
```

---

#### PUT `/events/:id`
Update event (organizer only)

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Updated Title",
  "venue": "New Venue"
}
```

**Response (200):**
```json
{
  "success": true,
  "event": { ... }
}
```

---

#### DELETE `/events/:id`
Cancel event (organizer only)

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Event cancelled",
  "refundsTriggered": 250
}
```

---

#### GET `/events/:id/tickets`
Get remaining ticket count for event

**Response (200):**
```json
{
  "success": true,
  "eventId": "evt-123",
  "totalTickets": 500,
  "ticketsSold": 250,
  "remaining": 250
}
```

---

### 🎫 **DOMAIN 3: Tickets (5 endpoints)**

#### GET `/tickets/my-tickets`
Get authenticated user's tickets

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (active/used)
- `eventId` (filter by event)

**Response (200):**
```json
{
  "success": true,
  "tickets": [
    {
      "tokenId": 123,
      "eventId": "evt-123",
      "eventTitle": "Concert",
      "eventDate": "2024-06-15T18:00:00Z",
      "used": false,
      "purchasedAt": "2024-05-01T10:00:00Z",
      "commitment": "0x1234..."
    }
  ]
}
```

---

#### GET `/tickets/:id`
Get ticket details

**Response (200):**
```json
{
  "success": true,
  "ticket": {
    "tokenId": 123,
    "eventId": "evt-123",
    "owner": "0x...",
    "used": false,
    "metadataURI": "ipfs://Qm...",
    "commitment": "0x1234..."
  }
}
```

---

#### POST `/tickets/mint`
Mint NFT ticket after payment verification

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "eventId": "evt-123",
  "paymentId": "pay-123",
  "aadhaarId": "111111111111",
  "secret": "random-secret"
}
```

**Response (201):**
```json
{
  "success": true,
  "ticket": {
    "tokenId": 123,
    "eventId": "evt-123",
    "transactionHash": "0xabc...",
    "metadataURI": "ipfs://Qm..."
  }
}
```

---

#### GET `/tickets/verify/:tokenId`
Verify ticket on-chain

**Response (200):**
```json
{
  "success": true,
  "valid": true,
  "tokenId": 123,
  "owner": "0x...",
  "used": false,
  "commitment": "0x1234..."
}
```

---

#### GET `/tickets/:tokenId/qr`
Get QR code for ticket scanning

**Response (200):**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,...",
  "qrData": {
    "tokenId": 123,
    "eventId": "evt-123",
    "aadhaarId": "111111111111",
    "userAddress": "0x..."
  }
}
```

---

### 💳 **DOMAIN 4: Payment (5 endpoints)**

#### POST `/payment/create-order`
Create Razorpay payment order

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "eventId": "evt-123",
  "quantity": 2,
  "totalAmount": 100000,
  "currency": "INR"
}
```

**Response (201):**
```json
{
  "success": true,
  "order": {
    "orderId": "order-123",
    "razorpayOrderId": "order_1234567890",
    "amount": 100000,
    "currency": "INR"
  }
}
```

---

#### POST `/payment/verify`
Verify Razorpay payment signature

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "orderId": "order_1234567890",
  "paymentId": "pay_1234567890",
  "signature": "signature_hash"
}
```

**Response (200):**
```json
{
  "success": true,
  "verified": true,
  "message": "Payment verified",
  "ticketsMinted": 2
}
```

---

#### POST `/payment/webhook`
Razorpay webhook handler (called by Razorpay)

**Headers:**
- `X-Razorpay-Signature: <signature>`

**Events Handled:**
- `payment.authorized` → Trigger minting
- `payment.captured` → Confirm payment
- `payment.failed` → Log failure
- `order.paid` → Update status

**Response (200):**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

---

#### GET `/payment/history`
Get payment history for user

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (default: 10)
- `offset` (default: 0)

**Response (200):**
```json
{
  "success": true,
  "payments": [
    {
      "paymentId": "pay-123",
      "orderId": "order-123",
      "amount": 50000,
      "status": "captured",
      "eventId": "evt-123",
      "createdAt": "2024-05-01T10:00:00Z"
    }
  ],
  "total": 5
}
```

---

#### GET `/payment/status`
Get single payment status

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `orderId` or `paymentId`

**Response (200):**
```json
{
  "success": true,
  "status": "captured",
  "amount": 50000,
  "orderId": "order-123",
  "paymentId": "pay-123"
}
```

---

### 🆔 **DOMAIN 5: Identity (5 endpoints)**

#### POST `/identity/send-otp`
Send OTP to Aadhaar-linked phone

**Request:**
```json
{
  "aadhaarId": "111111111111"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to registered phone",
  "expiry": 600
}
```

---

#### POST `/identity/verify-otp`
Verify OTP and retrieve identity

**Request:**
```json
{
  "aadhaarId": "111111111111",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "identity": {
    "aadhaarId": "111111111111",
    "name": "JOHN DOE",
    "phone": "+91-9999999999",
    "photo": "base64_image",
    "verified": true
  }
}
```

---

#### POST `/identity/commitment`
Generate ZK commitment hash

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "aadhaarId": "111111111111",
  "secret": "random-secret",
  "userAddress": "0x..."
}
```

**Response (201):**
```json
{
  "success": true,
  "commitment": "0x1234567890abcdef...",
  "hash": "sha256_hash"
}
```

---

#### GET `/identity/:aadhaarId`
Get public identity information

**Response (200):**
```json
{
  "success": true,
  "identity": {
    "aadhaarId": "111111111111",
    "verified": true,
    "verificationDate": "2024-05-01T10:00:00Z"
  }
}
```

---

#### POST `/identity/verify-commitment`
Verify commitment matches stored value

**Request:**
```json
{
  "aadhaarId": "111111111111",
  "commitment": "0x1234567890abcdef..."
}
```

**Response (200):**
```json
{
  "success": true,
  "valid": true,
  "message": "Commitment verified"
}
```

---

### 🚪 **DOMAIN 6: Gate (5 endpoints)**

#### POST `/gate/verify`
Multi-step verification for gate entry

**Headers:** `Authorization: Bearer <token>`

**Request (Step 1 - QR):**
```json
{
  "qrData": "base64_qr_data",
  "step": 1
}
```

**Request (Step 2 - OTP):**
```json
{
  "aadhaarId": "111111111111",
  "otp": "123456",
  "step": 2
}
```

**Request (Step 3 - Commitment):**
```json
{
  "commitment": "0x1234...",
  "step": 3
}
```

**Request (Step 4 - Face):**
```json
{
  "facePhotoBase64": "data:image/jpeg;base64,...",
  "step": 4
}
```

**Response (200):**
```json
{
  "success": true,
  "verified": true,
  "message": "Entry allowed",
  "ticketId": 123
}
```

---

#### POST `/gate/mark-used`
Mark ticket as used after entry

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "tokenId": 123,
  "timestamp": "2024-06-15T18:30:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Ticket marked as used",
  "transactionHash": "0xabc..."
}
```

---

#### GET `/gate/stats`
Event-level verification statistics

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `eventId` (required)

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "eventId": "evt-123",
    "totalVerified": 150,
    "totalUsed": 145,
    "verificationFailed": 5,
    "duplicateAttempts": 2,
    "efficiency": 96.7
  }
}
```

---

#### POST `/gate/verify-qr`
Direct QR code verification

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "qrData": "base64_qr_data"
}
```

**Response (200):**
```json
{
  "success": true,
  "tokenId": 123,
  "valid": true,
  "message": "QR valid and ticket ready for entry"
}
```

---

#### GET `/gate/operator-stats`
Individual scanner operator metrics

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `eventId` (required)
- `operatorId` (optional)

**Response (200):**
```json
{
  "success": true,
  "operators": [
    {
      "operatorId": "op-123",
      "name": "Operator Name",
      "totalScanned": 50,
      "successfulVerifications": 48,
      "failedVerifications": 2,
      "efficiency": 96.0
    }
  ]
}
```

---

## 👥 User Flow

### 1. **Sign Up / Login**
```
User → Frontend → POST /auth/login
                  ↓
              Backend validates credentials
                  ↓
           Returns JWT token
                  ↓
        Frontend stores token (localStorage)
```

**Key Actions:**
- Enter email/password
- Account auto-created if new
- Wallet generated automatically
- JWT token issued (7-day expiry)

---

### 2. **Update Profile**
```
User → Frontend → GET /auth/profile (with JWT)
                  ↓
          Display current profile
                  ↓
          User edits name, phone, avatar
                  ↓
          PUT /auth/profile (with JWT)
                  ↓
          Backend updates MongoDB
                  ↓
          Success confirmation
```

---

### 3. **Browse Events**
```
User → Frontend → GET /events (with pagination)
                  ↓
          Display all active events
                  ↓
          Click event for details
                  ↓
          GET /events/:id
                  ↓
          Show event details, remaining tickets
```

---

### 4. **Buy Ticket (Payment Flow)**
```
User → Frontend → POST /payment/create-order
                  ↓
          Razorpay order created
                  ↓
          User redirected to Razorpay checkout
                  ↓
          User enters payment details
                  ↓
          Razorpay processes payment
                  ↓
          Webhook → POST /payment/webhook
                  ↓
          Backend verifies signature
                  ↓
          Mint NFT ticket on-chain
                  ↓
          User sees ticket in "My Tickets"
```

**Flow Diagram:**
```
┌──────────────┐
│  Create Order│ POST /payment/create-order
└────────┬─────┘
         │
    ┌────▼──────────┐
    │ Razorpay Form │ (User enters card)
    └────┬──────────┘
         │
    ┌────▼────────────┐
    │ Payment Success │ (Razorpay)
    └────┬────────────┘
         │
    ┌────▼──────────────────┐
    │ Webhook Notification  │ (Razorpay → Backend)
    │ POST /payment/webhook │
    └────┬──────────────────┘
         │
    ┌────▼──────────────┐
    │ Verify Signature  │
    │ Signature valid?  │
    └────┬──────────────┘
         │
    ┌────▼─────────────────┐
    │ Mint NFT on-chain    │ (TicketNFT.mintTicket)
    └────┬─────────────────┘
         │
    ┌────▼────────────┐
    │ Ticket Created  │ (User can now see in My Tickets)
    └─────────────────┘
```

---

### 5. **View Tickets**
```
User → Frontend → GET /tickets/my-tickets (with JWT)
                  ↓
          Display user's tickets
                  ↓
          Click ticket for QR code
                  ↓
          GET /tickets/:tokenId/qr
                  ↓
          Show QR code image
```

---

### 6. **Gate Entry (Multi-step)**
```
User arrives at gate ↓
Scan QR code → POST /gate/verify-qr
                  ↓
         QR valid? Yes
                  ↓
         Display "Enter OTP"
                  ↓
         User enters OTP → POST /gate/verify (step 2)
                  ↓
         OTP valid? Yes
                  ↓
         Verify ZK commitment → POST /gate/verify (step 3)
                  ↓
         Commitment matches? Yes
                  ↓
         Face recognition → POST /gate/verify (step 4)
                  ↓
         Face matches identity? Yes
                  ↓
         Mark ticket as used → POST /gate/mark-used
                  ↓
         markUsed(tokenId) on blockchain
                  ↓
         "ENTRY ALLOWED" ✅
```

---

## 👨‍💼 Admin / Organizer Flow

### 1. **Create Event**
```
Organizer → Frontend → POST /events (with JWT, role=organizer)
                       ↓
                Fill event form
                (title, venue, date, price, capacity, banner)
                       ↓
                Backend validates
                       ↓
                Event created in MongoDB
                       ↓
                Event appears in listings
```

**Required Fields:**
- Title (string)
- Venue (string)
- Date (ISO timestamp, future date)
- Price (number in paise)
- Total Tickets (number > 0)
- Metadata URI (IPFS hash)

---

### 2. **Edit Event**
```
Organizer → Frontend → GET /events/:id (retrieve current)
                       ↓
                Display event form
                       ↓
                Update fields
                       ↓
                PUT /events/:id (with JWT)
                       ↓
                Backend validates
                       ↓
                MongoDB updated
                       ↓
                Frontend shows success
```

**Editable Fields:**
- Title
- Venue
- Date
- Price
- Metadata URI

**Cannot Edit Once Tickets Sold:**
- Capacity

---

### 3. **Monitor Sales**
```
Organizer → Frontend → GET /events/:id
                       ↓
                Display event dashboard
                       ↓
                Show:
                - Total tickets: 500
                - Sold: 250
                - Remaining: 250
                - Percentage: 50%
                       ↓
                GET /payment/history
                       ↓
                Show all payments for event
```

---

### 4. **Cancel Event**
```
Organizer → Frontend → DELETE /events/:id (with JWT)
                       ↓
                Confirmation popup
                "Are you sure? Will trigger refunds."
                       ↓
                Backend:
                1. Set event.active = false
                2. Query all payments for event
                3. Mark as refundable
                4. Return count of refunds to issue
                       ↓
                Frontend shows:
                "Event cancelled. 250 refunds triggered."
```

---

### 5. **Gate Entry Monitoring**
```
Operator → Frontend → GET /gate/stats (with JWT, eventId)
                      ↓
              Display event statistics:
              - Total Verified: 150
              - Total Used: 145
              - Failed: 5
              - Duplicate Attempts: 2
              - Efficiency: 96.7%
                      ↓
              GET /gate/operator-stats
                      ↓
              Display per-operator metrics:
              - Op-1: 50 scans, 96% efficiency
              - Op-2: 48 scans, 98% efficiency
              - Op-3: 52 scans, 94% efficiency
```

---

## 🔄 Data Flow Sequences

### Ticket Minting Sequence

```
1. User buys ticket
   POST /payment/create-order → Razorpay Order ID returned

2. User pays via Razorpay

3. Razorpay sends webhook
   POST /payment/webhook
   Background: verify signature → valid ✓

4. Backend calls blockchain
   TicketNFT.mintTicket(
       to: userWallet,
       eventId: 123,
       commitment: hash(aadhaar + secret + userAddress),
       metadataURI: ipfs://...
   )

5. Transaction confirmed on-chain
   tokenId = 1000 (auto-incremented)

6. Backend stores in MongoDB:
   - Payment record
   - Ticket record with tokenId
   - User's ticket reference

7. Frontend updates
   - "My Tickets" shows new ticket
   - QR code available for scan
```

---

### Gate Verification Sequence

```
1. Scanner opens gate app
   Scans QR code from ticket

2. QR decoded → tokenId, eventId, aadhaarId

3. POST /gate/verify-qr
   Backend checks:
   - Token exists? ✓
   - Not already used? ✓
   - Event active? ✓

4. If QR valid → User enters phone → Receives OTP

5. User enters OTP
   POST /gate/verify (step 2)
   Backend checks:
   - OTP valid? ✓
   - Not expired (10 min)? ✓

6. If OTP valid → Display commitment verification

7. Backend queries ZK commitment from smart contract
   User enters with their secret
   Backend hashes: hash(aadhaar + secret + userAddress)
   Compares with on-chain commitment

8. If match → Request face photo

9. Operator takes photo
   Face recognition API validates
   (Compares with identity photo from Aadhaar mock)

10. If all 4 steps pass → Call blockchain
    TicketNFT.markUsed(tokenId)
    Backend logs verification in MongoDB

11. Display: "✅ ENTRY ALLOWED"
    Barrier opens
    Ticket status: USED
```

---

## 🔐 Security Architecture

### Authentication
- **JWT Tokens:** Signed with secret, 7-day expiry
- **Role-based Access:** user, organizer, admin
- **Rate Limiting:** 100 requests per 15 min per IP

### Smart Contract
- **Soulbound Tokens:** No transfers, only minting
- **Capacity Enforcement:** On-chain capacity checks prevent overselling
- **Event Status:** Only active events allow minting

### Identity
- **Aadhaar Privacy:** Not stored directly (mock system)
- **ZK Commitment:** Hash of (aadhaar + secret + address)
- **OTP Verification:** Time-limited, attempt-limited

### Payment
- **Signature Verification:** HMAC-SHA256 for Razorpay webhooks
- **Idempotency:** Webhook processed only once

---

## 📊 Database Schema

### Collections

**User**
```javascript
{
  userId: UUID,
  email: String (unique),
  passwordHash: String,
  name: String,
  phone: String,
  avatar: String (IPFS),
  wallet: String (Ethereum address),
  role: String (user/organizer/admin),
  createdAt: Date,
  updatedAt: Date
}
```

**Event**
```javascript
{
  eventId: UUID,
  title: String,
  venue: String,
  date: Date,
  price: Number (paise),
  totalTickets: Number,
  ticketsMinted: Number,
  organizer: ObjectId (ref: User),
  metadataURI: String (IPFS),
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Ticket**
```javascript
{
  tokenId: Number,
  eventId: UUID (ref: Event),
  owner: String (wallet address),
  commitment: String (bytes32 hash),
  used: Boolean,
  usedAt: Date,
  metadataURI: String (IPFS),
  createdAt: Date
}
```

**Payment**
```javascript
{
  paymentId: String (Razorpay),
  orderId: String (Razorpay),
  userId: ObjectId (ref: User),
  eventId: UUID (ref: Event),
  amount: Number,
  currency: String,
  status: String (created/authorized/captured/failed/refunded),
  webhookEvents: Array,
  createdAt: Date,
  updatedAt: Date
}
```

**Identity**
```javascript
{
  aadhaarId: String,
  userId: ObjectId (ref: User),
  verified: Boolean,
  otpAttempts: Number,
  otpExpiry: Date,
  commitment: String,
  verifiedAt: Date
}
```

---

## 🚀 Deployment Architecture

### Network
- **Blockchain:** Base Sepolia (L2, chainId: 84532)
- **Smart Contract:** TicketNFT at 0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812

### Backend
- **Hosting:** Node.js (port 5000)
- **Database:** MongoDB
- **External APIs:**
  - Alchemy (RPC for Base Sepolia)
  - Razorpay (Payment processing)
  - Pinata (IPFS storage)

### Frontend
- **Build:** Vite
- **Deployment:** Static hosting (Vercel/Netlify)
- **Chain:** Connected to Base Sepolia via MetaMask

---

## 📋 Environment Variables

```env
# Backend
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key
DATABASE_URL=mongodb://...
BLOCKCHAIN_NETWORK_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812
CONTRACT_OWNER_PRIVATE_KEY=0x...
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
CORS_ORIGIN=http://localhost:5173

# Frontend
VITE_CONTRACT_ADDRESS=0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 🎯 Testing

### Test Aadhaar Numbers (Mock System)
```
111111111111 → JOHN DOE
222222222222 → JANE SMITH
```

### OTP (Mock)
```
All OTPs return: 123456
Expiry: 10 minutes
```

### Integration Testing
```bash
bash test-integration.sh
```

Tests all 31 endpoints with mock data.

---

## 🔍 Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes
- `INVALID_CREDENTIALS` - Login failed
- `EVENT_SOLD_OUT` - No tickets available
- `PAYMENT_FAILED` - Razorpay error
- `INVALID_OTP` - OTP verification failed
- `ALREADY_USED` - Ticket already used at gate
- `UNAUTHORIZED` - Missing/invalid JWT token
- `FORBIDDEN` - User lacks permission

---

## 📞 Support & Documentation

- **API Docs:** `/backend/API_DOCUMENTATION.md`
- **Setup Guide:** `/backend/SETUP_GUIDE.md`
- **Smart Contract:** `/contract/contracts/TicketNFT.sol`
- **Basescan:** https://sepolia.basescan.org/address/0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812

---

**Last Updated:** May 2, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
