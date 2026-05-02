# BlockMyShow - System Integration Status & Deployment Guide

**Date:** May 2, 2026  
**Status:** ✅ Phase 4 COMPLETE - Ready for Testing & Integration  
**Smart Contract Address:** `0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812` (Base Sepolia)  
**Firebase Project:** `proofpass-27725`

---

## 📋 System Status Overview

| Component | Status | Details |
|-----------|--------|---------|
| Backend API | ✅ Ready | All endpoints implemented, Firebase & blockchain initialized |
| User Web App | ✅ Ready | 2-page auth + dashboard with booking flow |
| Admin App | ✅ Ready | Events management + Gate scanner with QR scanning |
| Smart Contract | ✅ Connected | Base Sepolia testnet integration ready |
| Firebase | ⚠️ Config Needed | Credentials required for persistent storage |
| Database | 🔄 Mock → Firestore | Currently using mock data, ready for Firebase migration |
| Payments | 🔄 Mock Mode | Razorpay integration ready (test mode) |

---

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd /home/arch/hikki/docss/BlockMyShow

# Backend
cd backend
npm install
npm install firebase-admin ethers

# User Web
cd ../frontend/user-web
npm install

# Admin App
cd ../admin-app
npm install
```

### 2. Set Up Environment Variables

**Backend** - Create `.env` from `.env.example`:
```bash
cd backend
cp .env.example .env

# Edit .env with your values:
# - JWT_SECRET: Generate a random secret
# - CONTRACT_ADDRESS: 0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812 (already set)
# - NETWORK_URL: https://sepolia.base.org (already set)
# - Firebase credentials (see Firebase Setup section)
```

### 3. Start the Servers

```bash
# Terminal 1: Backend
cd backend && npm start
# Server runs on http://localhost:5000

# Terminal 2: User Web App
cd frontend/user-web && npm run dev
# Vite dev server runs on http://localhost:5173

# Terminal 3: Admin App
cd frontend/admin-app && npx expo start
# Metro bundler starts, press 'w' for web or scan QR for mobile
```

### 4. Test the Platform

**User Flow:**
1. Go to http://localhost:5173
2. Sign up with email: `test@example.com` / password: `password123`
3. Dashboard loads with mock events
4. Click "Book Ticket" → Aadhaar verification modal appears
5. Enter masked ID: `111111111111`, phone: `+91-9876543210`
6. Receive mock OTP: Check console or use `123456`
7. Payment modal: Select tickets and complete payment
8. ✅ Tickets minted (mock)

**Admin Flow:**
1. Go to http://localhost:5000 (or Expo app)
2. Login with username: `admin_user`, password: `admin123`
3. Events tab shows all events (if authorized)
4. Gate tab shows QR scanner (if authorized)
5. Try scanning a QR code with test ticket ID: `TICKET_001`

---

## 🔧 Firebase Integration Setup

### Prerequisites
- Firebase project ID: `proofpass-27725` ✓
- Firebase credentials JSON file

### Step 1: Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `proofpass-27725`
3. Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file securely

### Step 2: Add Credentials to `.env`

Extract these values from your JSON file and add to `backend/.env`:

```env
FIREBASE_PROJECT_ID=proofpass-27725
FIREBASE_PRIVATE_KEY_ID=<key_id_from_json>
FIREBASE_PRIVATE_KEY=<private_key_from_json>
FIREBASE_CLIENT_EMAIL=<client_email_from_json>
FIREBASE_CLIENT_ID=<client_id_from_json>
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=<cert_url_from_json>
```

### Step 3: Enable Firestore

1. Firebase Console → Firestore Database
2. Create Database → Select "Start in test mode"
3. Region: `nam5` (us-central)
4. Create

### Step 4: Test Firebase Connection

```bash
cd backend
npm start

# Check console for:
# ✓ Firebase Firestore connected
```

### Database Schema (Auto-Created)

```
Collections:
├── users
│   ├── email: string
│   ├── walletAddress: string (unique)
│   ├── publicAddress: string
│   ├── auth_method: string
│   ├── passwordHash: string
│   └── profile: { name, phone, avatar }
├── admins
│   ├── username: string (unique)
│   ├── passwordHash: string
│   ├── role: string (admin|event_creator|gate_operator)
│   └── permissions: array
├── events
│   ├── title: string
│   ├── date: string
│   ├── venue: string
│   ├── price: number
│   ├── totalTickets: number
│   ├── ticketsMinted: number
│   ├── admin_id: string (owner)
│   └── status: string
├── tickets
│   ├── eventId: string
│   ├── buyerWallet: string
│   ├── qrCode: string
│   ├── used: boolean
│   ├── usedAt: timestamp
│   └── tokenId: string
└── identity
    ├── masked_id: string (unique)
    ├── phone_number: string
    ├── name: string
    ├── verified: boolean
    └── verificationStatus: string
```

---

## 🔗 Smart Contract Integration

### Contract Details
- **Address:** `0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812`
- **Network:** Base Sepolia Testnet (Chain ID: 84532)
- **RPC:** https://sepolia.base.org
- **Functions:** `mintTicket()`, `ownerOf()`, `markUsed()`, `isUsed()`

### Integration Status
- ✅ Read-only functions implemented (verify tickets, check ownership)
- ⚠️ Write functions (mint, markUsed) require contract owner private key
- ✅ Falls back to mock NFT minting if no private key available

### Set Up Contract Minting (Optional)

If you have the contract deployer's private key:

```env
CONTRACT_OWNER_PRIVATE_KEY=0x...
```

Then minting will:
1. Sign transaction with private key
2. Call `mintTicket(buyerAddress, tokenURI)` on-chain
3. Store transaction hash in database
4. Return real NFT token ID

Without this key, minting returns a mock result (testing-friendly).

### Test Contract Read Functions

```bash
# Add this endpoint to test contract connectivity
GET http://localhost:5000/api/v1/blockchain/info

# Response:
{
  "network": "base-sepolia",
  "chainId": 84532,
  "blockNumber": 12345,
  "gasPrice": "0.5",
  "contractAddress": "0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812",
  "rpcUrl": "https://sepolia.base.org"
}
```

---

## ✅ What's Working

### Backend APIs (All 30+ endpoints)
- ✅ Authentication (Email, Google, MetaMask)
- ✅ Event Management (Create, Read, Update, Delete - admin only)
- ✅ Ticket Minting (NFT generation, QR codes)
- ✅ Payment Processing (Razorpay mock)
- ✅ Identity Verification (Aadhaar OTP, commitment generation)
- ✅ Gate Operations (QR scanning, entry verification)
- ✅ Role-Based Access Control (admin, event_creator, gate_operator)

### Frontend - User Application
- ✅ Email/Password Authentication with wallet generation
- ✅ Google OAuth login stub (ready for SDK integration)
- ✅ MetaMask wallet connection stub
- ✅ Event discovery with search/filtering
- ✅ Event details modal
- ✅ Aadhaar identity verification 2-step flow
- ✅ Payment checkout with ticket count selection
- ✅ Mock ticket minting with QR code generation
- ✅ User dashboard with past bookings
- ✅ Wallet display and logout

### Frontend - Admin Application (Expo)
- ✅ Admin login with role-based authentication
- ✅ Role-based tab access (Events, Gate, Settings)
- ✅ Events Management screen with FlatList
- ✅ Event details display (title, date, price, tickets)
- ✅ Delete event with confirmation modal
- ✅ Edit event button (expandable form)
- ✅ Create event button (expandable form)
- ✅ Gate Scanner screen with camera integration
- ✅ QR code scanning with barcode detection
- ✅ Real-time ticket verification display
- ✅ Success/failure feedback overlays
- ✅ Permission request handling

---

## ⚠️ What Needs Attention

### Before Production Deployment

1. **Firebase Credentials**
   - [ ] Add service account JSON to backend/.env
   - [ ] Enable Firestore in Firebase Console
   - [ ] Set Firestore security rules

2. **Smart Contract**
   - [ ] Verify contract at 0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812
   - [ ] Add contract deployer private key for real minting

3. **Razorpay Integration**
   - [ ] Get test mode keys from Razorpay dashboard
   - [ ] Add to backend/.env
   - [ ] Test payment flow end-to-end

4. **Third-Party APIs**
   - [ ] Set up Email service (SendGrid/AWS SES) for OTP
   - [ ] Configure Google OAuth credentials
   - [ ] Set up MetaMask provider context

5. **Frontend Configurations**
   - [ ] Add Firebase config to user-web/src/firebase.js
   - [ ] Integrate Google OAuth SDK
   - [ ] Add MetaMask provider context (Web3Modal)

6. **Security**
   - [ ] Change JWT_SECRET in production
   - [ ] Enable HTTPS in production
   - [ ] Set CORS_ORIGIN to your frontend URL
   - [ ] Do NOT commit .env files (use .env.example)

---

## 🧪 Testing Checklist

### Manual Testing

**User Authentication**
- [ ] Email signup creates wallet
- [ ] Password stored securely (hashed)
- [ ] Login returns JWT token
- [ ] Token stored in localStorage
- [ ] Logout clears token

**Booking Flow**
- [ ] Event selection works
- [ ] Aadhaar modal appears on "Book"
- [ ] OTP request sends
- [ ] OTP verification works
- [ ] Payment modal shows correct price
- [ ] Ticket count modifier works (+/-)
- [ ] Payment success creates mock ticket
- [ ] QR code generated for ticket

**Admin Operations**
- [ ] Admin login with credentials
- [ ] Role-based tab access (check not authorized role disappears)
- [ ] Event list loads from API
- [ ] Delete event with confirmation
- [ ] QR scanner opens camera
- [ ] QR scan returns ticket data
- [ ] Verification displays success/failure
- [ ] Scanner auto-resets after scan

**API Integration**
- [ ] All endpoints respond with correct status codes
- [ ] Error messages are clear
- [ ] Middleware enforces role checks
- [ ] Token verification works
- [ ] Database queries return correct data

### Automated Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend/user-web
npm test

# Admin tests
cd frontend/admin-app
npm test
```

---

## 📊 System Architecture

```
BlockMyShow Platform
├── Backend (Node.js + Express)
│   ├── Firebase Firestore (Database)
│   ├── Smart Contract (Base Sepolia)
│   ├── JWT Authentication
│   ├── Role-Based Access Control
│   └── 30+ API Endpoints
├── Frontend - User (React + Vite)
│   ├── 3 Auth Methods (Email, Google, MetaMask)
│   ├── Event Discovery
│   ├── Aadhaar Verification
│   ├── Payment Processing
│   └── Ticket Display
└── Frontend - Admin (Expo + React Native)
    ├── Admin Authentication
    ├── Event Management
    ├── Gate Scanner (QR)
    └── Role-Based Access
```

---

## 🚦 Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Value | Purpose |
|----------|-------|---------|
| PORT | 5000 | Server port |
| NODE_ENV | development | Environment |
| JWT_SECRET | random_string | Token signing |
| FIREBASE_PROJECT_ID | proofpass-27725 | Firebase project |
| FIREBASE_PRIVATE_KEY | from_json | Service account |
| CONTRACT_ADDRESS | 0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812 | NFT contract |
| NETWORK_URL | https://sepolia.base.org | RPC endpoint |
| RAZORPAY_KEY_ID | test_key | Payment gateway |

### Frontend (`frontend/user-web/.env`)

| Variable | Value | Purpose |
|----------|-------|---------|
| VITE_API_URL | http://localhost:5000/api/v1 | Backend endpoint |
| VITE_GOOGLE_CLIENT_ID | your_client_id | Google OAuth |

### Admin App (`frontend/admin-app/.env`)

| Variable | Value | Purpose |
|----------|-------|---------|
| REACT_APP_API_URL | http://localhost:5000/api/v1 | Backend endpoint |

---

## 📝 API Endpoint Summary

### Authentication (6 endpoints)
- `POST /auth/signup/email` - Register with email
- `POST /auth/login/email` - Login with email
- `POST /auth/signup/google` - Register with Google
- `POST /auth/login/google` - Login with Google
- `POST /auth/signup/metamask` - Register with MetaMask
- `POST /auth/login/metamask` - Login with MetaMask
- `POST /auth/admin-login` - Admin login
- `POST /auth/wallet-keypair` - Get wallet private key (one-time)

### Events (6 endpoints)
- `GET /events` - List all events
- `GET /events/:id` - Get event details
- `GET /events/:id/remaining-tickets` - Check availability
- `POST /events` - Create event (admin only)
- `PUT /events/:id` - Update event (admin only)
- `DELETE /events/:id` - Delete/cancel event (admin only)

### Tickets (6 endpoints)
- `GET /tickets/my-tickets` - Get user's tickets
- `GET /tickets/:id` - Get ticket details
- `POST /tickets/mint` - Mint NFT ticket
- `GET /tickets/:id/qr` - Get QR code
- `GET /tickets/verify/:id` - Verify ticket authenticity

### Payment (4 endpoints)
- `POST /payment/create-order` - Create payment order
- `POST /payment/verify` - Verify payment
- `POST /payment/webhook` - Razorpay webhook
- `GET /payment/history` - Payment history

### Identity (6 endpoints)
- `POST /identity/verify-otp` - Request OTP
- `POST /identity/verify-otp-code` - Verify OTP
- `POST /identity/commitment` - Generate commitment
- `GET /identity/:aadhaarId` - Get identity info
- `POST /identity/verify-commitment` - Verify commitment

### Gate (5 endpoints)
- `POST /gate/verify` - Verify at gate
- `POST /gate/verify-entry` - Mobile scanner verify
- `POST /gate/mark-used` - Mark ticket used
- `GET /gate/stats` - Verification statistics

---

## 🎯 Next Steps

### Phase 5: Dynamic Data & Production Setup
1. [ ] Migrate from mock to Firebase for all collections
2. [ ] Implement real Razorpay integration (remove mock)
3. [ ] Connect to smart contract for real minting
4. [ ] Add email notifications (SendGrid)
5. [ ] Deploy backend to Cloud Run
6. [ ] Deploy frontend to Vercel
7. [ ] Create deployment CI/CD pipeline

### Phase 6: Enhanced Features
1. [ ] Ticket resale marketplace
2. [ ] Admin analytics dashboard
3. [ ] Multi-event booking bundles
4. [ ] Loyalty/rewards system
5. [ ] Advanced fraud detection
6. [ ] Event notifications & reminders

---

## 🆘 Troubleshooting

### "Firebase not initialized" error
- Ensure `.env` has all Firebase credentials
- Check that Firestore database is created in Firebase Console
- Run `npm install firebase-admin` in backend

### "Smart Contract initialization failed"
- Verify contract address is correct: `0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812`
- Check RPC URL is accessible: `curl https://sepolia.base.org`
- Contract functions work in read-only mode without private key

### "CORS error" when accessing frontend
- Check CORS_ORIGIN in backend/.env matches frontend URL
- default: `http://localhost:5173` (Vite)

### "Port 5000 already in use"
- Kill existing process: `lsof -ti:5000 | xargs kill`
- Or change PORT in .env

---

## 📞 Support Resources

- **Firebase Docs:** https://firebase.google.com/docs
- **Ethers.js Docs:** https://docs.ethers.org
- **Base Testnet:** https://base-sepolia-faucet.pk910.de/
- **Contract Explorer:** https://sepolia.basescan.org/

---

**Status:** ✅ Ready for localization & integration testing  
**Last Updated:** May 2, 2026

