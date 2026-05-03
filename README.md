# BlockMyShow - NFT Event Ticketing Platform

**Identity-bound, fraud-proof event ticketing powered by blockchain technology**

## 🎯 Overview

BlockMyShow is a comprehensive NFT-based event ticketing platform that combines Web2 simplicity with Web3 security. It eliminates ticket fraud through identity-bound, non-transferable NFT tickets while maintaining a user-friendly experience.

## ✨ Key Features

### 🔐 **Identity-Bound Ticketing**
- **Aadhaar Integration**: Tickets linked to government ID verification
- **OTP Verification**: SMS-based identity confirmation
- **Non-Transferable NFTs**: Prevents ticket scalping and resale fraud
- **Zero-Knowledge Privacy**: Identity commitments without exposing personal data

### 💳 **Seamless Payment Experience**
- **Fiat Payments**: Pay in ₹ via Razorpay (no crypto knowledge required)
- **Automatic Wallet Creation**: Backend generates wallets for users
- **Account Abstraction**: Users never interact with blockchain directly
- **Real-time NFT Minting**: Tickets created instantly after payment

### 📱 **Multi-Platform Access**
- **User Web App**: Event discovery and ticket booking
- **Admin Mobile App**: Event management and gate scanning
- **Role-Based Access**: Super admin, event creator, gate operator roles
- **Cross-Platform Sync**: Real-time data across all platforms

### 🚪 **Advanced Gate Verification**
- **QR Code Scanning**: Real-time camera-based verification
- **Multi-Step Verification**: QR → OTP → Identity → Entry
- **Offline Support**: Basic verification without internet
- **Fraud Prevention**: Duplicate entry detection and prevention

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BLOCKMYSHOW PLATFORM                     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌───────▼────────┐   │   ┌─────────▼──────────┐
        │   User Web     │   │   │   Admin Mobile     │
        │  (React+Vite)  │   │   │  (React Native)    │
        └────────────────┘   │   └────────────────────┘
                │            │            │
                │            │            │
        ┌───────▼────────────▼────────────▼──────────┐
        │        Backend API (Express.js)            │
        │         31 REST Endpoints                  │
        └────────┬───────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼───┐   ┌───▼────┐   ┌──▼──────┐   ┌─────────▼─────────┐
│Firebase│   │Razorpay│   │ Base    │   │   Smart Contract  │
│(Data)  │   │(Payment)   │Sepolia  │   │   (TicketNFT)     │
└────────┘   └────────┘   │(L2 Chain)   └───────────────────┘
                          └─────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- Mobile device with Expo Go (for admin app)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/BlockMyShow.git
cd BlockMyShow
```

### 2. Start Backend API
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```
✅ Backend runs on `http://localhost:5000`

### 3. Start User Web App
```bash
cd frontend/user-web
npm install
npm run dev
```
✅ User app runs on `http://localhost:5173`

### 4. Start Admin Mobile App
```bash
cd frontend/admin-app
npm install
npx expo start
```
✅ Scan QR code with Expo Go app

## 🧪 Testing the Platform

### User Flow Testing
1. **Open User Web App**: `http://localhost:5173`
2. **Sign Up**: Email `test@example.com`, Password `password123`
3. **Browse Events**: 6 sample events available
4. **Book Ticket**: 
   - Select any event → "Book Ticket"
   - **Aadhaar**: Use `111111111111` or `222222222222`
   - **OTP**: Use `123456`
   - **Payment**: Mock payment flow
5. **View Ticket**: Check "My Tickets" for QR code

### Admin Flow Testing
1. **Open Admin Mobile App**: Scan Expo QR code
2. **Login**: Username `admin_user`, Password `admin123`
3. **Dashboard**: View statistics and quick actions
4. **Events**: Create, edit, delete events
5. **Gate Scanner**: Scan QR codes from user tickets

## 📊 Project Structure

```
BlockMyShow/
├── contract/                    # Smart Contract (Solidity)
│   ├── contracts/
│   │   └── TicketNFT.sol       # ERC721 non-transferable NFT
│   ├── scripts/deploy.js       # Deployment script
│   └── README.md               # Contract documentation
│
├── backend/                     # Express.js API Server
│   ├── src/
│   │   ├── controllers/        # Business logic (31 endpoints)
│   │   ├── routes/             # API route definitions
│   │   ├── middleware/         # JWT auth, validation
│   │   └── utils/              # Blockchain, Firebase helpers
│   └── README.md               # API documentation
│
├── frontend/
│   ├── user-web/               # React + Vite User App
│   │   ├── src/
│   │   │   ├── pages/          # Auth, Dashboard, Tickets
│   │   │   ├── components/     # Modals, Navigation
│   │   │   └── context/        # Authentication state
│   │   └── README.md           # User app documentation
│   │
│   └── admin-app/              # React Native + Expo Admin App
│       ├── app/
│       │   ├── (tabs)/         # Tab navigation
│       │   └── screens/        # Login, Dashboard, Scanner
│       ├── context/            # Admin authentication
│       └── README.md           # Admin app documentation
│
├── README.md                   # This file
└── package.json                # Root package configuration
```

## 🔧 Technology Stack

### Frontend
- **User Web**: React 19.2.5 + Vite 8.0.10 + Tailwind CSS
- **Admin Mobile**: React Native 0.81.5 + Expo 54.0.33 + TypeScript

### Backend
- **API Server**: Express.js 4.18.2 + Node.js 18+
- **Database**: Firebase Firestore
- **Authentication**: JWT tokens + role-based access

### Blockchain
- **Network**: Base Sepolia (L2) - Low fees, fast transactions
- **Contract**: ERC721 non-transferable NFT
- **Address**: `0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812`

### Integrations
- **Payment**: Razorpay (Indian payment gateway)
- **Identity**: Aadhaar-based verification (mock system)
- **Storage**: IPFS via Pinata
- **Notifications**: Firebase Cloud Messaging

## 🔐 Security Features

### Identity Verification
- **Aadhaar Integration**: Government ID-based verification
- **OTP Validation**: SMS verification for phone ownership
- **ZK Commitments**: Privacy-preserving identity proofs
- **Biometric Checks**: Photo verification at gate entry

### Blockchain Security
- **Non-Transferable NFTs**: Prevents ticket resale/scalping
- **Capacity Enforcement**: On-chain ticket limits
- **Immutable Records**: Permanent audit trail
- **Smart Contract Verified**: Open source and auditable

### Application Security
- **JWT Authentication**: Secure API access
- **Role-Based Access**: Admin, creator, operator permissions
- **Rate Limiting**: API abuse prevention
- **Input Validation**: XSS and injection protection

## 🌐 API Endpoints (31 Total)

### Authentication (8 endpoints)
- `POST /auth/signup/email` - Email registration
- `POST /auth/login/email` - Email login
- `POST /auth/signup/google` - Google OAuth
- `POST /auth/signup/metamask` - MetaMask wallet
- `POST /auth/admin-login` - Admin authentication
- `GET /auth/profile` - User profile
- `POST /auth/logout` - Logout
- `POST /auth/refresh-token` - Token refresh

### Events (6 endpoints)
- `GET /events` - List events
- `GET /events/:id` - Event details
- `POST /events` - Create event (admin)
- `PUT /events/:id` - Update event (admin)
- `DELETE /events/:id` - Cancel event (admin)
- `GET /events/:id/remaining-tickets` - Availability

### Tickets (5 endpoints)
- `GET /tickets/my-tickets` - User tickets
- `GET /tickets/:id` - Ticket details
- `POST /tickets/mint` - Mint NFT ticket
- `GET /tickets/verify/:tokenId` - Verify ticket
- `GET /tickets/:tokenId/qr` - Generate QR code

### Payment (5 endpoints)
- `POST /payment/create-order` - Create Razorpay order
- `POST /payment/verify` - Verify payment
- `POST /payment/webhook` - Payment webhook
- `GET /payment/history` - Payment history
- `GET /payment/status` - Payment status

### Identity (5 endpoints)
- `POST /identity/send-otp` - Send OTP
- `POST /identity/verify-otp` - Verify OTP
- `POST /identity/commitment` - Generate ZK commitment
- `GET /identity/:aadhaarId` - Identity info
- `POST /identity/verify-commitment` - Verify commitment

### Gate Verification (5 endpoints)
- `POST /gate/verify` - Multi-step verification
- `POST /gate/mark-used` - Mark ticket used
- `GET /gate/stats` - Verification statistics
- `POST /gate/verify-qr` - QR code verification
- `GET /gate/operator-stats` - Operator performance

## 🧪 Test Credentials

### User Authentication
- **Email**: `test@example.com`
- **Password**: `password123`

### Admin Authentication
- **Username**: `admin_user`
- **Password**: `admin123`

### Identity Verification
- **Aadhaar ID**: `111111111111` (Rajesh Kumar)
- **Aadhaar ID**: `222222222222` (Priya Singh)
- **OTP**: `123456` (universal test OTP)

### MetaMask Testing
- Install MetaMask browser extension
- Connect to Base Sepolia testnet
- Use any wallet address for testing

## 🚀 Deployment Guide

### Environment Setup

#### Backend (.env)
```env
PORT=5000
JWT_SECRET=your_jwt_secret
DATABASE_URL=mongodb://localhost:27017/blockmyshow
BLOCKCHAIN_NETWORK_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
FIREBASE_PROJECT_ID=blockmyshow-27725
```

#### User Web App (.env)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_CONTRACT_ADDRESS=0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

### Production Deployment

#### Backend
- **Railway**: Connect GitHub repo for auto-deployment
- **Heroku**: `git push heroku main`
- **AWS EC2**: Docker container deployment
- **Google Cloud Run**: Serverless container hosting

#### User Web App
- **Vercel**: Connect GitHub repo for auto-deployment
- **Netlify**: Drag & drop `dist/` folder
- **AWS S3 + CloudFront**: Static website hosting

#### Admin Mobile App
- **Expo EAS Build**: `eas build --platform all`
- **App Store**: `eas submit --platform ios`
- **Google Play**: `eas submit --platform android`

## 📈 Roadmap

### Phase 1: MVP (Current)
- ✅ Basic user authentication
- ✅ Event discovery and booking
- ✅ NFT ticket minting
- ✅ Gate verification system
- ✅ Admin management interface

### Phase 2: Enhanced Features
- [ ] Real Aadhaar API integration
- [ ] Advanced analytics dashboard
- [ ] Push notifications
- [ ] Email confirmations
- [ ] Ticket transfer restrictions

### Phase 3: Scale & Optimize
- [ ] Multi-language support
- [ ] Advanced fraud detection
- [ ] Loyalty rewards system
- [ ] API rate limiting
- [ ] Performance monitoring

### Phase 4: Enterprise
- [ ] White-label solutions
- [ ] Enterprise SSO integration
- [ ] Advanced reporting
- [ ] Custom branding
- [ ] SLA guarantees

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

### Code Standards
- **JavaScript/TypeScript**: ESLint + Prettier
- **React**: Functional components with hooks
- **API**: RESTful design principles
- **Testing**: Jest for unit tests, Cypress for E2E
- **Documentation**: JSDoc for functions, README for modules

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🆘 Support

### Documentation
- **Smart Contract**: [contract/README.md](contract/README.md)
- **Backend API**: [backend/README.md](backend/README.md)
- **User Web App**: [frontend/user-web/README.md](frontend/user-web/README.md)
- **Admin Mobile App**: [frontend/admin-app/README.md](frontend/admin-app/README.md)

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and ideas
- **Discord**: Real-time community chat (coming soon)

### Contact
- **Email**: support@blockmyshow.com
- **Twitter**: @BlockMyShow
- **LinkedIn**: BlockMyShow Platform

---

**Built with ❤️ for the Web3 community**

*Making event ticketing fraud-proof, one NFT at a time.*