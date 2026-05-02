# ProofPass Backend API Documentation

Complete API reference for ProofPass NFT ticketing platform.

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
Most endpoints require JWT authentication via `Authorization` header:
```
Authorization: Bearer <token>
```

## Health Check
```
GET /health
GET /api/health
```

---

## 1. Authentication Endpoints (`/auth`)

### POST `/auth/login`
Login or register user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "walletAddress": "0x123...",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Logged in successfully"
}
```

### POST `/auth/logout`
Logout user (remove token on client-side).

**Auth:** Required
**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### GET `/auth/wallet`
Get user's Web3 wallet address.

**Auth:** Required
**Response:**
```json
{
  "wallet": {
    "address": "0x123...",
    "publicKey": "0x456...",
    "chainId": 84532,
    "network": "baseSepolia"
  },
  "message": "Wallet retrieved successfully"
}
```

### GET `/auth/profile`
Get authenticated user's profile.

**Auth:** Required
**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "walletAddress": "0x123...",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### PUT `/auth/profile`
Update user profile.

**Auth:** Required
**Request:**
```json
{
  "name": "John Doe",
  "phone": "+91-9999-999999",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+91-9999-999999",
    "avatar": "https://example.com/avatar.jpg"
  },
  "message": "Profile updated successfully"
}
```

### POST `/auth/refresh-token`
Refresh JWT token.

**Auth:** Required
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "7d",
  "message": "Token refreshed successfully"
}
```

---

## 2. Events Endpoints (`/events`)

### GET `/events`
List all active events with pagination.

**Query Parameters:**
- `limit` (number, default: 20) - Events per page
- `offset` (number, default: 0) - Pagination offset
- `status` (string, default: "active") - Filter: active, inactive, all

**Response:**
```json
{
  "events": [
    {
      "id": "event_1",
      "title": "Web3 Summit 2024",
      "date": "2024-06-15T10:00:00Z",
      "venue": "Mumbai, India",
      "price": 500,
      "totalTickets": 1000,
      "ticketsMinted": 450,
      "description": "Annual Web3 conference",
      "image": "ipfs://QmEventImage1"
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

### GET `/events/:id`
Get detailed event information.

**Response:**
```json
{
  "id": "event_1",
  "title": "Web3 Summit 2024",
  "date": "2024-06-15T10:00:00Z",
  "venue": "Mumbai, India",
  "price": 500,
  "totalTickets": 1000,
  "ticketsMinted": 450,
  "organizer": "organizer_1",
  "metadataURI": "ipfs://QmMetadata",
  "description": "Annual Web3 conference",
  "active": true,
  "createdAt": "2024-05-15T00:00:00Z"
}
```

### POST `/events`
Create new event (organizer only).

**Auth:** Required
**Request:**
```json
{
  "title": "Web3 Summit 2024",
  "date": "2024-06-15T10:00:00Z",
  "venue": "Mumbai, India",
  "price": 500,
  "totalTickets": 1000,
  "description": "Annual Web3 conference",
  "image": "ipfs://QmEventImage"
}
```

**Response:**
```json
{
  "event": {
    "id": "event_...",
    "title": "Web3 Summit 2024",
    ...
  },
  "message": "Event created successfully",
  "onChainSync": "pending"
}
```

### PUT `/events/:id`
Update event (organizer only).

**Auth:** Required
**Request:**
```json
{
  "price": 600,
  "description": "Updated description"
}
```

### DELETE `/events/:id`
Cancel event and trigger refunds.

**Auth:** Required
**Response:**
```json
{
  "event": {...},
  "message": "Event cancelled successfully",
  "refundsTriggered": true
}
```

### GET `/events/:id/tickets`
Get remaining tickets for event.

**Response:**
```json
{
  "eventId": "event_1",
  "totalTickets": 1000,
  "ticketsMinted": 450,
  "remainingTickets": 550,
  "isSoldOut": false,
  "percentageSold": 45
}
```

---

## 3. Tickets Endpoints (`/tickets`)

### GET `/tickets/my-tickets`
Get user's purchased tickets.

**Auth:** Required
**Query Parameters:**
- `limit` (number, default: 20)
- `offset` (number, default: 0)
- `status` (string) - Filter: active, used, all

**Response:**
```json
{
  "tickets": [
    {
      "tokenId": "token_001",
      "eventId": "event_1",
      "used": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 3
}
```

### GET `/tickets/:id`
Get ticket details by token ID.

**Response:**
```json
{
  "ticket": {
    "tokenId": "token_001",
    "eventId": "event_1",
    "used": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "qrCode": "data:image/png;base64,...",
  "verification": {
    "used": false,
    "usedAt": null
  }
}
```

### POST `/tickets/mint`
Mint NFT ticket after payment and identity verification.

**Auth:** Required
**Request:**
```json
{
  "eventId": "event_1",
  "orderId": "order_123",
  "aadhaarId": "111111111111",
  "commitment": "0xabcd..."
}
```

**Response:**
```json
{
  "ticket": {
    "tokenId": "token_001",
    "eventId": "event_1",
    "used": false,
    "qrCode": "data:image/png;base64,..."
  },
  "message": "Ticket minted successfully",
  "onChainSync": "pending"
}
```

### GET `/tickets/verify/:tokenId`
Verify ticket on blockchain.

**Response:**
```json
{
  "valid": true,
  "ticket": {
    "tokenId": "token_001",
    "eventId": "event_1",
    "owner": "user_123",
    "used": false
  },
  "message": "Ticket verified successfully"
}
```

### GET `/tickets/:tokenId/qr`
Get QR code for ticket.

**Auth:** Required
**Response:**
```json
{
  "tokenId": "token_001",
  "qrCode": "data:image/png;base64,...",
  "scanURL": "/api/v1/gate/verify-qr?data=..."
}
```

---

## 4. Payment Endpoints (`/payment`)

### POST `/payment/create-order`
Create Razorpay payment order.

**Auth:** Required
**Request:**
```json
{
  "eventId": "event_1",
  "ticketCount": 2,
  "amount": 1000,
  "phone": "+91-9876543210"
}
```

**Response:**
```json
{
  "orderId": "order_123",
  "keyId": "rzp_test_...",
  "amount": 100000,
  "currency": "INR",
  "email": "user@example.com",
  "phone": "+91-9876543210",
  "prefill": {
    "name": "user",
    "email": "user@example.com",
    "contact": "+91-9876543210"
  }
}
```

### POST `/payment/verify`
Verify payment signature and trigger NFT minting.

**Auth:** Required
**Request:**
```json
{
  "orderId": "order_123",
  "paymentId": "pay_123",
  "signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
}
```

**Response:**
```json
{
  "verified": true,
  "paymentId": "pay_123",
  "message": "Payment verified successfully",
  "nextStep": "NFT will be minted shortly"
}
```

### POST `/payment/webhook`
Razorpay webhook handler (no auth needed).

**Header:**
```
X-Razorpay-Signature: <signature>
```

**Request Body:**
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "id": "pay_123",
      "order_id": "order_123",
      ...
    }
  }
}
```

**Response:**
```json
{
  "received": true
}
```

### GET `/payment/history`
Get user's payment history.

**Auth:** Required
**Query Parameters:**
- `limit` (number, default: 10)
- `offset` (number, default: 0)

**Response:**
```json
{
  "payments": [
    {
      "orderId": "order_1",
      "eventId": "event_1",
      "amount": 500,
      "currency": "INR",
      "status": "verified",
      "ticketCount": 2,
      "paymentDate": "2024-01-15T10:30:00Z",
      "ticketIds": ["token_001", "token_002"]
    }
  ],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

### GET `/payment/status`
Get payment status by order ID.

**Query Parameters:**
- `orderId` (string, required)

**Response:**
```json
{
  "orderId": "order_123",
  "status": "verified",
  "amount": 500,
  "currency": "INR",
  "ticketCount": 2,
  "createdAt": "2024-01-15T10:30:00Z",
  "verifiedAt": "2024-01-15T10:35:00Z"
}
```

---

## 5. Identity Verification Endpoints (`/identity`)

### POST `/identity/send-otp`
Send OTP to Aadhaar-linked phone.

**Request:**
```json
{
  "aadhaarId": "111111111111",
  "phone": "+91-9876543210"
}
```

**Response:**
```json
{
  "aadhaarId": "111111111111",
  "phone": "+91-9876543210",
  "message": "OTP sent successfully",
  "expiresIn": 600
}
```

### POST `/identity/verify-otp`
Verify OTP and get identity information.

**Auth:** Required
**Request:**
```json
{
  "aadhaarId": "111111111111",
  "otp": "123456"
}
```

**Response:**
```json
{
  "identity": {
    "aadhaarId": "111111111111",
    "name": "Rajesh Kumar",
    "phone": "+91-9876543210",
    "photoUrl": "ipfs://QmPhoto",
    "verified": true,
    "verifiedAt": "2024-01-15T10:35:00Z"
  },
  "message": "Identity verified successfully",
  "readyForCommitment": true
}
```

### POST `/identity/commitment`
Generate ZK commitment hash.

**Auth:** Required
**Request:**
```json
{
  "aadhaarId": "111111111111"
}
```

**Response:**
```json
{
  "commitment": "0xabcdef1234567890...",
  "message": "Commitment generated successfully",
  "readyForMinting": true
}
```

### GET `/identity/:aadhaarId`
Get public identity info from registry.

**Response:**
```json
{
  "name": "Rajesh Kumar",
  "photoUrl": "ipfs://QmPhoto",
  "verified": true
}
```

### POST `/identity/verify-commitment`
Verify ZK commitment hash.

**Request:**
```json
{
  "commitment": "0xabcdef...",
  "aadhaarId": "111111111111"
}
```

**Response:**
```json
{
  "verified": true,
  "aadhaarId": "111111111111",
  "timestamp": "2024-01-15T10:40:00Z",
  "message": "Commitment verified successfully"
}
```

---

## 6. Gate Verification Endpoints (`/gate`)

### POST `/gate/verify`
Verify ticket at event entry gate.

**Request:**
```json
{
  "tokenId": "token_001",
  "eventId": "event_1",
  "aadhaarId": "111111111111",
  "currentOTP": "123456"
}
```

**Response:**
```json
{
  "tokenId": "token_001",
  "eventId": "event_1",
  "verified": true,
  "identity": {
    "aadhaarId": "111111111111",
    "name": "Rajesh Kumar",
    "photoUrl": "ipfs://QmPhoto",
    "verified": true
  },
  "verificationTime": "2024-01-15T15:30:00Z",
  "nextStep": "Mark as used on entry"
}
```

### POST `/gate/mark-used`
Mark ticket as used after entry.

**Request:**
```json
{
  "tokenId": "token_001",
  "eventId": "event_1"
}
```

**Response:**
```json
{
  "tokenId": "token_001",
  "marked": true,
  "usedAt": "2024-01-15T15:35:00Z",
  "message": "Ticket marked as used successfully",
  "entryGranted": true
}
```

### GET `/gate/stats`
Get gate verification statistics.

**Query Parameters:**
- `eventId` (string, required)

**Response:**
```json
{
  "eventId": "event_1",
  "totalVerified": 450,
  "totalUsed": 450,
  "verificationFailed": 2,
  "duplicateAttempts": 1,
  "lastUpdated": "2024-01-15T15:40:00Z"
}
```

### POST `/gate/verify-qr`
Verify ticket via QR code data.

**Request:**
```json
{
  "qrData": "{\"tokenId\": \"token_001\", \"eventId\": \"event_1\"}"
}
```

**Response:**
Same as `/gate/verify` endpoint.

### GET `/gate/operator-stats`
Get individual operator statistics.

**Query Parameters:**
- `eventId` (string, required)
- `operatorId` (string, required)

**Response:**
```json
{
  "eventId": "event_1",
  "operatorId": "scanner_1",
  "verified": 150,
  "used": 150,
  "efficiency": "100.00%"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Description of what went wrong"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "No authentication token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong on the server"
}
```

---

## Test Aadhaar Numbers

For testing identity verification (mock Aadhaar registry):
- `111111111111` → Rajesh Kumar
- `222222222222` → Priya Singh

**Default OTP:** Any 6-digit number (e.g., `123456`)

---

## Examples Using cURL

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Create Event
```bash
curl -X POST http://localhost:5000/api/v1/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Web3 Summit",
    "date":"2024-06-15T10:00:00Z",
    "venue":"Mumbai",
    "price":500,
    "totalTickets":1000
  }'
```

### Create Payment Order
```bash
curl -X POST http://localhost:5000/api/v1/payment/create-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId":"event_1",
    "ticketCount":2,
    "amount":1000
  }'
```

### Send OTP
```bash
curl -X POST http://localhost:5000/api/v1/identity/send-otp \
  -H "Content-Type: application/json" \
  -d '{"aadhaarId":"111111111111"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:5000/api/v1/identity/verify-otp \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"aadhaarId":"111111111111","otp":"123456"}'
```

### Verify Ticket at Gate
```bash
curl -X POST http://localhost:5000/api/v1/gate/verify \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId":"token_001",
    "eventId":"event_1",
    "aadhaarId":"111111111111",
    "currentOTP":"123456"
  }'
```

---

## Server Configuration

**Port:** 5000
**API Version:** v1
**CORS Origin:** http://localhost:5173 (frontend)

See `.env` file for complete configuration options.
