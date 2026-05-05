# ⚡ BlockMyShow: The Future of Ticketing ⚡

<div align="center">
  <img src="./public/favicon.svg" width="120" height="120" alt="BlockMyShow Logo" />
  <p><i>Secure, Trustless, and Brutally Elegant NFT Ticketing</i></p>

  [![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)](https://block-my-show.vercel.app)
  [![Backend](https://img.shields.io/badge/API%20Status-Live-31bbaf?style=for-the-badge&logo=render)](https://blockmyshow.onrender.com)
  [![License](https://img.shields.io/badge/License-MIT-ec4899?style=for-the-badge)](./LICENSE)
</div>

---

## 🚀 Innovations & Key Features

*   ⛓️ **Blockchain-Backed NFT Tickets**: Every ticket is an immutable NFT on the Base blockchain, preventing forgery.
*   🛡️ **Identity-Locked Entry**: Tickets are tied to verified Aadhaar IDs to ensure only the real owner can enter.
*   📉 **Anti-Scalping Resale Cap**: Integrated marketplace with price caps to stop predatory secondary market prices.
*   🔐 **Zero-Knowledge Identity**: Secure OTP-based identity verification without exposing sensitive personal data.
*   🎨 **Cyberpunk Brutalist UI**: A high-impact, neo-brutalist interface designed for the next generation of web users.
*   📧 **Dynamic Cyberpunk Emails**: Automated, visually stunning email notifications for every on-chain event.

---

## 🛠️ The Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Blazing fast SPA with modern hooks |
| **Styling** | Vanilla CSS + Tailwind | Cyberpunk Brutalist design system |
| **Backend** | Node.js + Express | Robust API & Email automation |
| **Database** | MongoDB | Persistent storage for users and events |
| **Blockchain** | Base Sepolia | Secure NFT minting and resale logic |
| **Auth** | Firebase & JWT | Google OAuth, MetaMask, and Email/OTP |

---

## 🕹️ Quick Start

### 1. Prerequisites
- Node.js (v18+)
- MetaMask Extension
- A verified Aadhaar ID (for testing: `111111111111`)

### 2. Installation
```bash
git clone https://github.com/MrKnightmare007/BlockMyShow.git
cd BlockMyShow/frontend/user-web
npm install
```

### 3. Environment Setup
Create a `.env` file in the root of the project:
```env
VITE_API_BASE_URL=https://blockmyshow.onrender.com/api
VITE_RAZORPAY_KEY=...
```

### 4. Run the App
```bash
npm run dev
```

---

## 🎨 Design Philosophy
BlockMyShow follows a **Cyberpunk Brutalist** aesthetic:
- **High Contrast**: Neon teals (`#31bbaf`) and hot pinks (`#ec4899`) against deep blacks.
- **Raw Elements**: Thick 3px borders and offset "hard" shadows for a tactical feel.
- **Micro-animations**: Powered by **Lottie** and CSS keyframes for a living, breathing UI.
- **Responsive Geometry**: Layouts that break the mold while remaining fully mobile-optimized.

---

## 🔒 Security & Trust
- **Verified Resale**: No more scammers. Secondary sales are locked to the original price cap.
- **Identity Tethers**: Tickets are non-transferable unless verified through our secure P2P portal.
- **On-Chain Truth**: Every purchase, resale, and entry is recorded permanently on the blockchain.

---

<div align="center">
  <p>Built with ⚡ by <b>BlockMyShow Team</b></p>
  <p><i>"Don't just watch the show. Own the ticket."</i></p>
</div>
