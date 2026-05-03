# BlockMyShow - Secure NFT Ticketing & Resale Platform

A blockchain-based event ticketing ecosystem combining **Web2 simplicity** with **Web3 trust, security, and a fair secondary market**.

> BlockMyShow is a "Cyberpunk Brutalist" NFT ticketing system featuring identity-bound verification, an anti-scalping resale market, and a "Block Coins" reputation-based loyalty system.

---

## 🎯 Core Concept

BlockMyShow eliminates ticketing fraud and price gouging by:
- **Anti-Scalping Resale**: Secondary market sales are locked to original purchase prices.
- **Identity-Bound Tickets**: NFT tickets are cryptographically linked to Aadhaar identity.
- **Block Coins Loyalty**: 10% "Block Coins" back on every purchase for future discounts.
- **Wallet-free Web3 UX**: Automatic wallet creation via email/social login.
- **Multi-Currency Ready**: Real-time conversion between INR and top crypto tokens (ETH, USDC, MATIC, etc.).
- **Cyberpunk Brutalist UI**: High-contrast, sharp-edged design for a premium blockchain feel.

---

## ✨ New & Advanced Features

### 1. **Block Coins (Reputation & Loyalty)**
- **Earn**: Users receive 10% of their booking amount as "Block Coins" (BC).
- **Redeem**: Coins can be applied at checkout for direct discounts (10 BC = ₹1).
- **Gamification**: Tiered rewards system visible in the user profile.

### 2. **Secure Resale Marketplace**
- **Partial Resale**: Users can list a subset of their tickets (e.g., 2 out of 5) for resale.
- **Price Enforcement**: Smart contracts (mocked) ensure resale price matches the original purchase price.
- **Verified Listings**: Clearly marked "Secondary Market" cards with seller transparency.

### 3. **Waitlist Notifications**
- **Resale Alerts**: Users can subscribe to "Waitlists" for sold-out events.
- **Real-time Prompts**: Notifies users immediately when a peer lists a ticket for resale.

### 4. **Cyberpunk Brutalist Design System**
- **Theme-Aware**: Seamless transition between light and dark modes using CSS variables.
- **Modern Typography**: Powered by *Syne* and *Space Mono* fonts.
- **Interactive Modals**: Fully custom, high-contrast Aadhaar, Payment, and Resale modals.

### 5. **Advanced Ticket Visualization**
- **Digital Stub**: View tickets as high-fidelity "stubs" with perforated edges.
- **QR & Barcodes**: Dynamic QR codes and brutalist barcodes for venue entry.
- **Actions**: One-click "Download" and "Share" functionality.

---

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓
Backend API (Node.js/Express)
    ↓
State Layer (JSON Mock / MongoDB)
    ↓
Smart Contract (Solidity ERC721)
```

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | React + Vite | 18.2.0 |
| Styling | Vanilla CSS (Brutalist) | Custom |
| State Management | Context API | - |
| Icons | Lucide / Custom SVG | - |
| QR Generation | QRServer API | - |
| Backend | Express.js | 4.18.2 |
| Contract | Solidity | 0.8.17 |

---

## 🚀 Quick Start

### Installation

```bash
# Install root dependencies
npm install

# Start Backend (port 5000)
cd backend && npm run dev

# Start Frontend (port 5173)
cd frontend/user-web && npm run dev
```

---

## 📝 Project Progress Checklist

- ✅ **Account Abstraction**: Auto-wallet creation for all users.
- ✅ **Quantity Controls**: Hard limit of 1-5 tickets per user.
- ✅ **Identity Verification**: Aadhaar-bound OTP flow.
- ✅ **Block Coins**: 10% cashback and redemption logic.
- ✅ **Resale Market**: Partial quantity resale with price locking.
- ✅ **Waitlist System**: Notifications for sold-out events.
- ✅ **Multi-Currency**: INR, ETH, USDC, MATIC, SOL support.
- ✅ **Advanced UI**: Full Cyberpunk Brutalist design overhaul.
- ✅ **Ticket Modal**: QR, Barcode, and NFT pass visualization.

---

## 📄 License

MIT

---

## 📞 Support

For architectural details, refer to `target.md` and the individual package READMEs.

