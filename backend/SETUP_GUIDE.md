# ProofPass Backend - Complete Setup & Deployment Guide

## Project Overview

ProofPass is an NFT-based ticketing platform with:
- **Smart Contract:** ERC721 non-transferable (soulbound) ticket NFTs on Base Sepolia
- **Backend:** Express.js REST API with 31 endpoints
- **Identity:** Aadhaar-based verification with Zero-Knowledge commitments
- **Payments:** Razorpay integration for Indian payment methods
- **Gate Verification:** QR code scanning with multi-factor verification

## Quick Start

### 1. Installation

```bash
cd backend
npm install
```

### 2. Configuration

Create a `.env` file in the backend directory with all required variables:

```bash
# Server
PORT=5000
NODE_ENV=development
API_VERSION=v1

# Blockchain (Base Sepolia)
BLOCKCHAIN_NETWORK=baseSepolia
CHAIN_ID=84532
NETWORK_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
CONTRACT_ADDRESS=0x<deployed-contract-address>
CONTRACT_OWNER_PRIVATE_KEY=0x<private-key>

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=7d

# Database (MongoDB)
DATABASE_URL=mongodb://localhost:27017/proofpass
MONGODB_USER=admin
MONGODB_PASS=password

# Razorpay
RAZORPAY_KEY_ID=rzp_test_<key>
RAZORPAY_KEY_SECRET=<secret>
RAZORPAY_WEBHOOK_SECRET=<webhook-secret>

# IPFS/Pinata
PINATA_API_KEY=<key>
PINATA_API_SECRET=<secret>

# Email/OTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
OTP_VALIDITY_DURATION=600000

# CORS
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# Feature Flags
ENABLE_IDENTITY_VERIFICATION=true
ENABLE_PAYMENT_PROCESSING=true
ENABLE_EMAIL_NOTIFICATIONS=false
```

### 3. Start Development Server

```bash
npm start
```

Or with watch mode:

```bash
npm run dev
```

Server will be available at `http://localhost:5000`

## API Endpoints Summary

Total: **31 endpoints** across 6 modules

### Authentication (6 endpoints)
- `POST /auth/login` - Login/register
- `POST /auth/logout` - Logout
- `GET /auth/wallet` - Get Web3 wallet
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update profile
- `POST /auth/refresh-token` - Refresh JWT

### Events (6 endpoints)
- `GET /events` - List events
- `GET /events/:id` - Event details
- `POST /events` - Create event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Cancel event
- `GET /events/:id/tickets` - Remaining tickets

### Tickets (5 endpoints)
- `GET /tickets/my-tickets` - User's tickets
- `GET /tickets/:id` - Ticket details
- `POST /tickets/mint` - Mint NFT ticket
- `GET /tickets/verify/:tokenId` - Verify ticket
- `GET /tickets/:tokenId/qr` - Generate QR code

### Payment (5 endpoints)
- `POST /payment/create-order` - Create Razorpay order
- `POST /payment/verify` - Verify payment signature
- `POST /payment/webhook` - Razorpay webhook
- `GET /payment/history` - Payment history
- `GET /payment/status` - Payment status

### Identity (5 endpoints)
- `POST /identity/send-otp` - Send OTP to Aadhaar
- `POST /identity/verify-otp` - Verify OTP
- `POST /identity/commitment` - Generate ZK commitment
- `GET /identity/:aadhaarId` - Get identity info
- `POST /identity/verify-commitment` - Verify commitment

### Gate Verification (4 endpoints)
- `POST /gate/verify` - Verify at gate
- `POST /gate/mark-used` - Mark ticket used
- `GET /gate/stats` - Gate statistics
- `POST /gate/verify-qr` - Verify via QR
- `GET /gate/operator-stats` - Operator stats

## Authentication

### JWT Token Flow

1. **Login:** `POST /auth/login`
   - Returns JWT token valid for 7 days
   - Token contains user ID, email, wallet address, role

2. **Usage:** Include in all protected endpoints
   ```
   Authorization: Bearer <token>
   ```

3. **Refresh:** `POST /auth/refresh-token`
   - Issues new token when current one expires

### Token Example
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXJfMTIzIiwi
ZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwid2FsbGV0QWRkcmVzcyI6IjB4I
jE3ZiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzAzMDAwLCJleHAiOjE3MDMyMDAwfQ
```

## Key Workflows

### 1. Event Creation Flow
```
Organizer logs in
  ↓
Create event: POST /events
  ↓
Event stored in DB
  ↓
Smart contract called to register on-chain
  ↓
Event available for ticket sales
```

### 2. Ticket Purchase Flow
```
User logs in
  ↓
Create payment order: POST /payment/create-order
  ↓
User completes Razorpay payment
  ↓
Razorpay webhook: POST /payment/webhook
  ↓
Verify payment: POST /payment/verify
  ↓
Mint NFT ticket: POST /tickets/mint
  ↓
User receives tokenId and QR code
```

### 3. Identity Verification Flow
```
Send OTP: POST /identity/send-otp (aadhaarId)
  ↓
User receives SMS with 6-digit OTP
  ↓
Verify OTP: POST /identity/verify-otp
  ↓
Generate commitment: POST /identity/commitment
  ↓
Commitment stored on-chain for gate verification
```

### 4. Gate Entry Flow
```
Scanner app scans QR code
  ↓
Verify at gate: POST /gate/verify (tokenId, eventId, OTP)
  ↓
System verifies:
    - Ticket exists and valid
    - Not already used
    - OTP matches Aadhaar phone
  ↓
Mark as used: POST /gate/mark-used
  ↓
Entry granted to user
```

## Testing

### Test Aadhaar Numbers (Mock Registry)
```
111111111111 → Rajesh Kumar (+91-9876543210)
222222222222 → Priya Singh (+91-8765432109)
```

### Sample cURL Tests

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Create Event:**
```bash
curl -X POST http://localhost:5000/api/v1/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "date": "2024-06-15T10:00:00Z",
    "venue": "Mumbai",
    "price": 500,
    "totalTickets": 100
  }'
```

**Send OTP:**
```bash
curl -X POST http://localhost:5000/api/v1/identity/send-otp \
  -H "Content-Type: application/json" \
  -d '{"aadhaarId": "111111111111"}'
```

## Project Structure

```
backend/
├── src/
│   ├── index.js                 # Main server entry point
│   ├── controllers/             # Business logic (6 files)
│   │   ├── auth.js             # Authentication logic
│   │   ├── events.js           # Event management
│   │   ├── tickets.js          # NFT ticket operations
│   │   ├── payment.js          # Razorpay integration
│   │   ├── identity.js         # Aadhaar & ZK proofs
│   │   └── gate.js             # Gate verification
│   ├── routes/                  # API endpoint definitions (6 files)
│   │   ├── auth.js             # Auth endpoints
│   │   ├── events.js           # Event endpoints
│   │   ├── tickets.js          # Ticket endpoints
│   │   ├── payment.js          # Payment endpoints
│   │   ├── identity.js         # Identity endpoints
│   │   └── gate.js             # Gate endpoints
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   └── models/                  # Database schemas (to implement)
│       ├── User.js
│       ├── Event.js
│       ├── Ticket.js
│       ├── Payment.js
│       ├── OTP.js
│       └── AadhaarRegistry.js
├── .env                         # Configuration
├── package.json
├── API_DOCUMENTATION.md         # Complete API reference
└── README.md
```

## Middleware

### JWT Authentication
```javascript
// Import in routes
import { authenticateToken } from '../middleware/auth.js';

// Use on protected routes
router.get('/my-tickets', authenticateToken, controller.getMyTickets);
```

### Available Middleware
- `authenticateToken` - Requires valid JWT
- `optionalAuth` - JWT verification if provided
- `authorize(...roles)` - Role-based access control
- `isAdmin` - Admin/organizer check only
- `rateLimit(requests, window)` - Rate limiting

## Smart Contract Integration

### Contract Deployment (Base Sepolia)

```bash
cd ../contract
npm run deploy:baseSepolia
```

After deployment, update `.env`:
```
CONTRACT_ADDRESS=0x<deployed-address>
```

### Smart Contract Functions Called

**When creating event:**
```solidity
function createEvent(
  string title,
  string venue,
  uint256 date,
  uint256 price,
  uint256 totalTickets,
  string metadataURI
)
```

**When minting ticket:**
```solidity
function mintTicket(
  address to,
  uint256 eventId,
  bytes32 commitment,
  string metadataURI
)
```

**When gate entry:**
```solidity
function markUsed(uint256 tokenId)
```

## Database Schema (TODO - Implement with MongoDB)

### User Collection
```javascript
{
  _id: ObjectId,
  email: String,
  passwordHash: String,
  walletAddress: String,
  encryptedPrivateKey: String,
  role: String (user/organizer/admin),
  profile: {
    name: String,
    phone: String,
    avatar: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Event Collection
```javascript
{
  _id: ObjectId,
  onChainId: String,
  title: String,
  date: Date,
  venue: String,
  price: Number,
  totalTickets: Number,
  ticketsMinted: Number,
  organizer: ObjectId (User ref),
  metadataURI: String,
  image: String,
  description: String,
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Ticket Collection
```javascript
{
  _id: ObjectId,
  tokenId: String,
  eventId: String,
  userId: ObjectId (User ref),
  orderId: String (Payment ref),
  aadhaarId: String,
  commitment: String (0x...),
  used: Boolean,
  usedAt: Date,
  qrCode: String (data URL),
  createdAt: Date
}
```

## Monitoring & Logging

### Log Levels
- `[ERRORS]` - Critical errors
- `[AUTH]` - Authentication events
- `[EVENTS]` - Event operations
- `[TICKETS]` - Ticket operations
- `[PAYMENT]` - Payment processing
- `[IDENTITY]` - Identity verification
- `[GATE]` - Gate verification

### Example Log Format
```
[2024-01-15T10:30:00Z] [AUTH/LOGIN] User logged in: user_123
[2024-01-15T10:31:00Z] [EVENTS] Created: event_1
[2024-01-15T10:32:00Z] [PAYMENT] Order created: order_123
[2024-01-15T10:33:00Z] [TICKETS] Minted: token_001
[2024-01-15T10:34:00Z] [GATE] Verified: token_001
```

## Troubleshooting

### Port Already in Use
```bash
lsof -i :5000
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check MongoDB is running
mongosh

# Verify connection string in .env
# Format: mongodb://user:pass@localhost:27017/proofpass
```

### CORS Errors
- Check `CORS_ORIGIN` in `.env` matches frontend URL
- Default: `http://localhost:5173`

### JWT Token Issues
- Ensure `JWT_SECRET` is same in all environments
- Check token expiry with `JWT_EXPIRY`
- Clear localStorage on frontend after secret change

## Production Deployment

### Environment Variables for Production
```bash
NODE_ENV=production
JWT_SECRET=<generate-strong-random-secret>
DATABASE_URL=<production-mongodb-uri>
RAZORPAY_KEY_ID=<live-key>
RAZORPAY_KEY_SECRET=<live-secret>
NETWORK_URL=<production-alchemy-key>
CORS_ORIGIN=https://yourdomain.com
```

### Deployment Checklist
- [ ] MongoDB running on production
- [ ] All environment variables set
- [ ] Smart contract deployed to mainnet/testnet
- [ ] Razorpay live credentials configured
- [ ] SMTP email service configured
- [ ] IPFS/Pinata credentials set
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Error monitoring (Sentry/LogRocket) setup
- [ ] Database backups configured
- [ ] Performance monitoring active

### Docker Deployment
```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/index.js"]
```

## Performance Tips

1. **Database:** Add indexes on frequently queried fields
2. **Caching:** Implement Redis for OTP and rate limiting
3. **CDN:** Host images on IPFS/CDN not database
4. **Rate Limiting:** Production should use Redis-based solution
5. **Compression:** Enable gzip middleware
6. **Monitoring:** Set up application performance monitoring

## Support & Documentation

- API Docs: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Architecture: See [/target.md](../target.md)
- Features: See [/feature.md](../feature.md)
- Smart Contract: [contract/contracts/TicketNFT.sol](../contract/contracts/TicketNFT.sol)
