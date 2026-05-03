# ProofPass User Web Application

**React + Vite web application for NFT event ticket booking**

## Overview

The user-facing web application allows users to discover events, purchase NFT tickets with identity verification, and manage their digital tickets. Built with React, Vite, and Tailwind CSS for a modern, responsive experience.

## Features

- **Multi-Authentication**: Email/password, Google OAuth, MetaMask wallet connection
- **Event Discovery**: Browse events with search, filtering, and detailed views
- **Identity Verification**: Aadhaar-based OTP verification system
- **Payment Integration**: Razorpay payment gateway with NFT minting
- **Ticket Management**: View purchased tickets with QR codes
- **Wallet Integration**: Automatic wallet creation and NFT delivery

## Tech Stack

- **Framework**: React 19.2.5
- **Build Tool**: Vite 8.0.10
- **Styling**: Tailwind CSS 4.2.4
- **Routing**: React Router DOM 6.20.1
- **Blockchain**: Ethers.js 6.10.0
- **QR Codes**: qrcode 1.5.4
- **Authentication**: Firebase 10.7.1

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## User Flow & API Integration

### 1. Authentication Page (`/`)

**Components**: `AuthPage.jsx`

#### Email/Password Authentication
- **Sign Up Flow**:
  - User enters email, password, name
  - **API Call**: `POST /api/v1/auth/signup/email`
  - Backend creates user account and generates wallet
  - Returns JWT token and wallet address
  - User redirected to dashboard

- **Login Flow**:
  - User enters email, password
  - **API Call**: `POST /api/v1/auth/login/email`
  - Backend validates credentials
  - Returns JWT token and user data
  - User redirected to dashboard

#### Google OAuth Authentication
- **Button Click**: "Continue with Google"
- **API Call**: `POST /api/v1/auth/signup/google` or `POST /api/v1/auth/login/google`
- Mock implementation ready for Firebase integration
- Returns JWT token and auto-generated wallet

#### MetaMask Wallet Authentication
- **Button Click**: "Connect MetaMask Wallet"
- Checks for `window.ethereum` (MetaMask extension)
- Requests account access via `eth_requestAccounts`
- **API Call**: `POST /api/v1/auth/signup/metamask` or `POST /api/v1/auth/login/metamask`
- Uses existing wallet address for NFT delivery

**State Management**: `AuthContext.jsx`
- Stores JWT token in localStorage
- Manages user authentication state
- Provides login/logout functions
- Persists wallet address

### 2. Dashboard Page (`/`)

**Components**: `DashboardPage.jsx`

#### Event Discovery
- **Page Load**: 
  - **API Call**: `GET /api/v1/events?limit=10&offset=0`
  - Displays grid of available events
  - Shows event cards with title, date, venue, price, availability

#### Search & Filtering
- **Search Input**: Filters events by title, venue, description
- **Category Filter**: Dropdown to filter by event category
- **Real-time Filtering**: Client-side filtering of fetched events

#### Event Detail Modal
- **Event Card Click**: Opens detailed event modal
- Shows full event information, pricing breakdown
- Displays availability progress bar
- **Book Ticket Button**: Initiates booking flow

#### Booking Flow Initiation
- **Button Click**: "Book Ticket"
- Opens Aadhaar verification modal
- Starts multi-step booking process

### 3. Aadhaar Verification Modal

**Components**: `AadhaarModal.jsx`

#### Step 1: Enter Aadhaar Number
- User enters 12-digit Aadhaar ID
- **Test IDs Available**: `111111111111`, `222222222222`
- **API Call**: `POST /api/v1/identity/send-otp`
- Backend sends OTP to registered phone number

#### Step 2: OTP Verification
- User enters 6-digit OTP
- **Test OTP**: `123456`
- **API Call**: `POST /api/v1/identity/verify-otp`
- Backend validates OTP and returns identity data
- Shows identity preview (name, photo, Aadhaar ID)

#### Success Flow
- Identity verification complete
- Modal closes and opens payment modal
- Passes verified identity data to payment flow

### 4. Payment Modal

**Components**: `PaymentModal.jsx`

#### Step 1: Review Booking
- Shows event details and verified identity
- Displays price breakdown:
  - Ticket Price: ₹2,500
  - Platform Fee (2%): ₹50
  - GST (18%): ₹459
  - **Total**: ₹3,009
- Shows NFT delivery wallet address

#### Step 2: Payment Method Selection
- **Razorpay Integration**: Cards, UPI, wallets
- **API Call**: `POST /api/v1/payment/create-order`
- Creates Razorpay order with amount and currency

#### Step 3: Payment Processing
- Mock payment flow (ready for real Razorpay)
- **API Call**: `POST /api/v1/payment/verify`
- Verifies payment signature

#### Step 4: NFT Minting
- **API Call**: `POST /api/v1/tickets/mint`
- Backend mints NFT ticket on blockchain
- Returns token ID and transaction hash

#### Success Flow
- Shows success message with order details
- Ticket appears in "My Tickets"
- Modal auto-closes after 3 seconds

### 5. My Tickets Page (`/tickets`)

**Components**: `TicketsPage.jsx`

#### Ticket List Display
- **Page Load**: 
  - **API Call**: `GET /api/v1/tickets/my-tickets`
  - Shows user's purchased tickets
  - Filter tabs: All, Active, Used

#### Ticket Cards
- Displays ticket information:
  - Event title, date, venue
  - Token ID, purchase date
  - Usage status (Active/Used)
  - Price paid

#### QR Code Generation
- **Ticket Click**: Opens QR code modal
- **API Call**: `GET /api/v1/tickets/:tokenId/qr`
- Generates QR code for gate scanning
- Download QR code functionality

### 6. Navigation

**Components**: `Navbar.jsx`

#### Navigation Items
- **Events** (`/`): Browse and book tickets
- **My Tickets** (`/tickets`): View purchased tickets
- **Wallet Display**: Shows truncated wallet address
- **Logout Button**: Clears authentication state

## API Integration Summary

### Authentication APIs
```javascript
// Email signup/login
POST /api/v1/auth/signup/email
POST /api/v1/auth/login/email

// Google OAuth
POST /api/v1/auth/signup/google
POST /api/v1/auth/login/google

// MetaMask wallet
POST /api/v1/auth/signup/metamask
POST /api/v1/auth/login/metamask

// Profile management
GET /api/v1/auth/profile
```

### Event APIs
```javascript
// Browse events
GET /api/v1/events?limit=10&offset=0

// Get event details
GET /api/v1/events/:id

// Check availability
GET /api/v1/events/:id/remaining-tickets
```

### Identity Verification APIs
```javascript
// Send OTP
POST /api/v1/identity/send-otp

// Verify OTP
POST /api/v1/identity/verify-otp

// Generate commitment
POST /api/v1/identity/commitment
```

### Payment APIs
```javascript
// Create payment order
POST /api/v1/payment/create-order

// Verify payment
POST /api/v1/payment/verify

// Get payment history
GET /api/v1/payment/history
```

### Ticket APIs
```javascript
// Mint NFT ticket
POST /api/v1/tickets/mint

// Get user tickets
GET /api/v1/tickets/my-tickets

// Get QR code
GET /api/v1/tickets/:tokenId/qr

// Verify ticket
GET /api/v1/tickets/verify/:tokenId
```

## Component Structure

```
src/
├── components/
│   ├── Navbar.jsx              # Navigation bar
│   ├── AadhaarModal.jsx        # Identity verification modal
│   └── PaymentModal.jsx        # Payment processing modal
├── pages/
│   ├── AuthPage.jsx            # Login/signup page
│   ├── DashboardPage.jsx       # Event discovery & booking
│   └── TicketsPage.jsx         # Ticket management
├── context/
│   └── AuthContext.jsx         # Authentication state management
├── App.jsx                     # Main app with routing
├── App.css                     # Global styles
└── main.jsx                    # App entry point
```

## State Management

### AuthContext
```javascript
const {
  user,              // User object
  token,             // JWT token
  walletAddress,     // User's wallet address
  isAuthenticated,   // Boolean auth status
  isLoading,         // Loading state
  error,             // Error messages
  login,             // Login function
  logout,            // Logout function
  setAuthError,      // Set error message
  clearError         // Clear error message
} = useAuth();
```

### Local Storage Persistence
- `auth_token`: JWT token
- `auth_user`: User object
- `wallet_address`: Wallet address

## Styling & Design

### Design System
- **Font**: Space Mono (monospace), Syne (display)
- **Colors**: 
  - Primary: #4a90e2 (blue)
  - Success: #10b981 (green)
  - Warning: #f59e0b (orange)
  - Error: #ef4444 (red)
- **Borders**: 3px solid black (brutal design)
- **Shadows**: 4px 4px 0 #000 (brutal shadows)

### Responsive Design
- Mobile-first approach
- Grid layouts with auto-fill
- Flexible components
- Touch-friendly buttons

### Accessibility
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- High contrast mode support
- Screen reader friendly

## Environment Variables

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api/v1

# Blockchain Configuration
VITE_CONTRACT_ADDRESS=0x816EcFD04b8110D7Dc3b6AB0e056C2e1435F5812
VITE_CHAIN_ID=84532
VITE_NETWORK_NAME=base-sepolia

# Firebase Configuration (for Google OAuth)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=proofpass-27725

# Payment Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

## Testing Credentials

### Email Authentication
- **Email**: `test@example.com`
- **Password**: `password123`

### Identity Verification
- **Aadhaar ID**: `111111111111` (Rajesh Kumar)
- **Aadhaar ID**: `222222222222` (Priya Singh)
- **OTP**: `123456`

### MetaMask Testing
- Install MetaMask browser extension
- Connect to Base Sepolia testnet
- Use any wallet address for testing

## Build & Deployment

### Development
```bash
npm run dev
# Runs on http://localhost:5173
```

### Production Build
```bash
npm run build
# Creates optimized build in dist/
```

### Deployment Options
- **Vercel**: Connect GitHub repo for auto-deployment
- **Netlify**: Drag & drop dist/ folder
- **AWS S3**: Static website hosting
- **GitHub Pages**: Free hosting for public repos

### Build Configuration
```javascript
// vite.config.js
export default {
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
}
```

## Performance Optimization

- **Code Splitting**: React.lazy() for route-based splitting
- **Image Optimization**: WebP format, lazy loading
- **Bundle Analysis**: Use `npm run build -- --analyze`
- **Caching**: Service worker for offline support
- **CDN**: Serve static assets from CDN

## Security Considerations

- **JWT Storage**: Secure localStorage usage
- **API Calls**: HTTPS only in production
- **Input Validation**: Client-side validation + server validation
- **XSS Protection**: Sanitize user inputs
- **CSRF Protection**: SameSite cookies

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Features Used**: ES2020, CSS Grid, Flexbox
- **Polyfills**: None required for target browsers

## License

MIT License - See LICENSE file for details
