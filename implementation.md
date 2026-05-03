# ProofPass — Current Implementation Status

## Project Overview

ProofPass is a blockchain-powered ticketing platform using NFTs as event tickets.

### Main Components

1. Smart Contract (NFT Ticket Contract)
2. Backend API Server
3. User Web App
4. Admin / Gate Scanner App
5. Appwrite Database + Authentication Support
6. Blockchain Integration using Base Sepolia

---

# Current Progress Summary

## Completed Work

### 1. Smart Contract

Status: ✅ Completed and Deployed

The NFT smart contract has already been written and deployed.

### Blockchain Details

* Network: Base Sepolia Testnet
* Contract Type: ERC721 NFT Ticket Contract
* Purpose:

  * Mint NFT tickets for event users
  * Store ticket ownership on-chain
  * Emit transfer events for ownership tracking
  * Validate ownership for gate scanning

### Current Contract Deployment

* Contract Address:

```text
0x4b3DA42DCD6F70F2eAD7B55b37AB46530cb4F931
```

### Current Contract Capabilities

* NFT ticket minting
* Event-linked NFT ownership
* Ownership tracking through blockchain
* Transfer event generation
* NFT lookup by tokenId
* Wallet ownership verification

---

## 2. Backend Progress

Status: ✅ Partially Completed

Backend APIs have been started.

### Tech Stack

* Node.js
* Express.js
* Appwrite
* JWT Authentication
* Blockchain interaction using ethers.js
* Brevo Email Service
* Twilio SMS Service

### Implemented Backend Modules

#### Authentication Routes

Completed:

##### Features

* User signup
* User login
* OTP verification
* JWT token generation
* Session authentication

#### Event Routes

Completed:

##### Features

* Event creation
* Event retrieval
* Dynamic event listing
* Event details fetching

---

# Backend Folder Responsibility

### Auth Module

Responsible for:

* User registration
* Login flow
* OTP handling
* JWT token issuance
* Appwrite user mapping

### Event Module

Responsible for:

* Event CRUD
* Event listing
* Event details
* Event ownership

---

## 3. Frontend User Web App

Status: ✅ Partially Connected

Frontend user web app is partially connected with backend APIs.

### Current State

#### Dynamic Pages

Connected to APIs:

* Authentication pages
* Event pages

#### Static Pages

Still static:

* Landing page
* About page
* Pricing page
* FAQ page
* Profile sections
* Ticket history page
* Checkout flow

---

## 4. Admin App

Status: 🚧 Planned / Not Fully Built

Admin app will mainly act as a gate scanner.

### Main Purpose

* Verify ticket ownership
* Scan QR code
* Check NFT ownership
* Validate if ticket already used
* Approve or reject entry

### Expected Workflow

```text
Gate Scanner App
↓
Scan QR Code
↓
Extract wallet/token info
↓
Call backend validation API
↓
Backend checks blockchain ownership
↓
Approve or Reject Entry
```

---

# Current Architecture

```text
User Web App
        ↓
Backend API
        ↓
Appwrite Database
        ↓
Blockchain Smart Contract
        ↓
Base Sepolia Network
```

---

# Database Structure

## Appwrite Collections

### Users Collection

Collection ID:

```text
users
```

Purpose:

* Store user profile data
* Wallet address mapping
* Event participation

### Admin Collection

Collection ID:

```text
admins
```

Purpose:

* Store admin users
* Event managers
* Scanner permissions
