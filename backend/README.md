# ProofPass Backend API

Express.js backend server for the ProofPass NFT ticketing platform.

## Setup

```bash
npm install
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## API Structure

### Routes
- `/api/auth` - Authentication and wallet management
- `/api/events` - Event management
- `/api/tickets` - Ticket operations
- `/api/payment` - Payment processing
- `/api/identity` - Identity verification
- `/api/gate` - Gate verification

### Controllers
- `auth.js` - Login, wallet creation, JWT tokens
- `events.js` - CRUD operations for events
- `tickets.js` - Ticket minting, listing, operations
- `payment.js` - Razorpay integration
- `identity.js` - OTP verification, Aadhaar registry
- `gate.js` - Gate verification and QR scanning

### Models
- `User` - User data and wallet info
- `Event` - Event details
- `Ticket` - Ticket information
- `AadhaarRegistry` - Mock Aadhaar data

### Middleware
- `auth.js` - JWT authentication
- `errorHandler.js` - Error handling

## Features

- User authentication with Google/Email
- Automatic wallet generation (Account Abstraction)
- Event management APIs
- Razorpay payment integration
- OTP-based identity verification
- Ticket minting and verification
- Gate entry validation
