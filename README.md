# BlockMyShow - Blockchain Ticketing Platform

## Project Overview

BlockMyShow is a **decentralized NFT ticketing system** with privacy-preserving identity verification and anti-fraud mechanisms.

### Core Features

* ✅ **NFT Tickets** - Unique tokens representing event tickets
* ✅ **Identity Verification** - Privacy-first Aadhaar verification via OTP
* ✅ **Ticket Resale Marketplace** - Secondary market with anti-scalping (30% price cap)
* ✅ **Gate Scanning** - QR code validation for event entry
* ✅ **Multi-auth** - JWT + upcoming Google OAuth + MetaMask
* ✅ **Brutalist UI** - Minimalist dark theme with teal accents

### Tech Stack

**Frontend:**
* React 19 + Vite + TypeScript
* Brutalist UI design (#0a0a0a bg, #31bbaf accent)
* Monospace fonts (Space Mono)

**Backend:**
* Node.js + Express
* Appwrite (database)
* Razorpay (payment gateway - test mode)
* JWT authentication
* Twilio (SMS/OTP)

**Blockchain:**
* Solidity Smart Contract (Base Sepolia testnet)
* Contract: `0xb950c531c7A75d7c29609eBcf77dF4226E5AA28C`
* Ethers.js integration

**Admin App:**
* Expo (React Native)
* Gate scanning functionality

---

## Setup Guide

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

### 2. Environment Variables (.env)

```
# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_Sjls2kjyCtnyP4
RAZORPAY_KEY_SECRET=bDzOHGw1cVf8qZFSBSYA0HTA

# Appwrite
APPWRITE_URL=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=

# OTP/SMS
TWILIO_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE=

# Blockchain
BASE_SEPOLIA_RPC=https://sepolia.base.org
PRIVATE_KEY=
CONTRACT_ADDRESS=0xb950c531c7A75d7c29609eBcf77dF4226E5AA28C

# JWT
JWT_SECRET=
```

### 3. Frontend Setup

```bash
cd frontend/user-web
npm install
npm run dev
```

### 4. Smart Contract

* Deploy contract
* Update contract address in backend

### 4. Run Frontend

```
npm run dev
```

---

## Final Outcome

* Secure ticketing
* On-chain ownership
* Real-world identity validation
* Fraud-proof event entry
