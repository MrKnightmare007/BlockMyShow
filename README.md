# ⛓️ BlockMyShow: Decentralized NFT Ticketing Ecosystem ⛓️

<div align="center">
  <img src="./frontend/user-web/public/favicon.svg" width="150" height="150" alt="BlockMyShow Logo" />
  <br />
  <h3><b>Revolutionizing live events with Blockchain and Zero-Knowledge Identity.</b></h3>
  <p>Secure. Trustless. Scalping-Proof.</p>

  [![Status](https://img.shields.io/badge/Status-Beta-31bbaf?style=for-the-badge)](https://block-my-show.vercel.app)
  [![Network](https://img.shields.io/badge/Network-Base%20Sepolia-ec4899?style=for-the-badge)](https://sepolia.basescan.org/address/0xb950c531c7A75d7c29609eBcf77dF4226E5AA28C)
</div>

---

## 🌟 Innovations & Key Features

*   ⛓️ **Blockchain-Backed NFT Tickets**: Every ticket is an immutable NFT on the Base blockchain, preventing forgery.
*   🛡️ **Identity-Locked Entry**: Tickets are tied to verified Aadhaar IDs to ensure only the real owner can enter.
*   📉 **Anti-Scalping Resale Cap**: Integrated marketplace with price caps to stop predatory secondary market prices.
*   🔐 **Zero-Knowledge Identity**: Secure OTP-based identity verification without exposing sensitive personal data.
*   🎨 **Cyberpunk Brutalist UI**: A high-impact, neo-brutalist interface designed for the next generation of web users.
*   📧 **Dynamic Cyberpunk Emails**: Automated, visually stunning email notifications for every on-chain event.

---

## 🏗️ Project Architecture

BlockMyShow is a multi-layer ecosystem designed for high performance and absolute security.

### 1. 🌐 User Web Interface (`/frontend/user-web`)
The flagship client built with **React 19** and **Vite**. It features a "Cyberpunk Brutalist" design system, integrated MetaMask/Firebase auth, and real-time blockchain event synchronization.

### 2. ⚙️ Secure Backend Engine (`/backend`)
A **Node.js/Express** powerhouse that handles:
- **Identity Verification**: Aadhaar OTP validation.
- **Payment Orchestration**: Razorpay integration with automated NFT minting.
- **Email Automation**: Cyberpunk-styled transactional emails via NodeMailer.
- **Wallet Abstraction**: Automated wallet creation for non-crypto users.

### 3. 📜 Smart Contracts (`/contract`)
The "Source of Truth" written in **Solidity** and deployed on **Base Sepolia**. It manages ticket ownership, resale listings, and price cap enforcement.

### 4. 📱 Admin App (`/admin`)
An **Expo/React Native** application for event organizers to verify tickets at the gate via QR code scanning.

---

## 🛠️ Tech Stack & Dependencies

- **Frontend**: React 19, Vite, Tailwind CSS, Lottie, Ethers.js
- **Backend**: Node.js, Express, MongoDB, Firebase Admin
- **Communications**: NodeMailer (Cyberpunk HTML templates)
- **Payments**: Razorpay Gateway
- **Blockchain**: Solidity, Hardhat, OpenZeppelin

---

## 🚀 Quick Deployment

### Backend
```bash
cd backend && npm install && npm start
```

### Frontend
```bash
cd frontend/user-web && npm install && npm run dev
```

---

<div align="center">
  <p><b>BlockMyShow</b> — The ultimate trust layer for live events.</p>
  <p>© 2026 MrKnightmare007 & BlockMyShow Team</p>
</div>
