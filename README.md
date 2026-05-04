## Project Overview

This project is a decentralized ticketing system using blockchain.

### Core Idea

* Tickets are NFTs
* Identity is hashed (privacy-first)
* Entry uses OTP + identity verification

### Philosophy

* No fake tickets
* No reselling scams
* Privacy preserving identity
* Trustless verification

---

## Tech Stack

* Smart Contract: Solidity + Ethers
* Backend: Node.js + Express
* Storage: JSON (identity)
* Blockchain: Ethereum
* OTP: Twilio

---

## Setup Guide

### 1. Backend

```
npm install
npm run dev
```

### 2. Environment Variables

```
OTP_SECRET=
TWILIO_SID=
TWILIO_TOKEN=
RPC_URL=
PRIVATE_KEY=
```

### 3. Smart Contract

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
