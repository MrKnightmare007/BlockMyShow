# Testing Guide - Ticket Resale System

## Prerequisites
1. Deploy ProofPass contract to testnet:
```bash
cd contract
forge script script/Ticket.s.sol:Ticketscript --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

2. Update `.env` with deployed contract address:
```
CONTRACT_ADDRESS=0x<deployed_address>
RPC_URL=<your_rpc_url>
PRIVATE_KEY=0x<your_private_key>
```

3. Start backend server:
```bash
cd backend
npm install
npm start
```

---

## API Testing Flow

### 1. Create Event
```bash
POST /api/events/create
Headers: Authorization: Bearer <jwt_token>
Body: {
  "title": "Concert 2026",
  "venue": "Madison Square Garden",
  "date": 1700000000,
  "price": 1000,
  "photoUrl": "https://example.com/event1.jpg",
  "totalTickets": 100
}
```
**Response**: `{ success: true, event_id: 1 }`

---

### 2. Mint Initial Ticket
```bash
POST /api/tickets/request
Headers: Authorization: Bearer <jwt_token>
Body: {
  "event_id": 1,
  "identity_id": "123456789012"
}
```
**Response**: `{ success: true, message: "OTP sent", expires_in_minutes: 10 }`

**Then confirm**:
```bash
POST /api/tickets/confirm
Headers: Authorization: Bearer <jwt_token>
Body: {
  "event_id": 1,
  "identity_id": "123456789012",
  "otp": "123456"  # from SMS
}
```
**Response**: `{ success: true, token_id: 1, tx_hash: "0x..." }`

---

### 3. List Ticket for Resale
```bash
POST /api/tickets/list
Headers: Authorization: Bearer <jwt_token>
Body: {
  "token_id": 1,
  "price": 800
}
```
**Response**: `{ success: true, tx_hash: "0x...", token_id: 1, price: 800 }`

---

### 4. View Marketplace
```bash
GET /api/tickets/marketplace
```
**Response**: 
```json
{
  "success": true,
  "tickets": [
    {
      "token_id": 1,
      "event_id": 1,
      "is_listed": true,
      "list_price": 800,
      "sale_price": 1000,
      "event": { ... }
    }
  ]
}
```

---

### 5. Update Resale Price
```bash
POST /api/tickets/update-list-price
Headers: Authorization: Bearer <jwt_token>
Body: {
  "token_id": 1,
  "new_price": 900
}
```
**Response**: `{ success: true, tx_hash: "0x...", old_price: 800, new_price: 900 }`

---

### 6. Buy Resale - Step 1 (Request OTP)
```bash
POST /api/tickets/buy-resale/request
Headers: Authorization: Bearer <buyer_jwt_token>
Body: {
  "token_id": 1,
  "buyer_identity": "987654321098"
}
```
**Response**: `{ success: true, message: "OTP sent", expires_in_minutes: 10, token_id: 1 }`

---

### 7. Buy Resale - Step 2 (Confirm with OTP)
```bash
POST /api/tickets/buy-resale/confirm
Headers: Authorization: Bearer <buyer_jwt_token>
Body: {
  "token_id": 1,
  "buyer_identity": "987654321098",
  "otp": "654321"  # from SMS
}
```
**Response**: 
```json
{
  "success": true,
  "message": "Ticket purchased successfully",
  "token_id": 1,
  "tx_hash": "0x...",
  "block_number": 12345678,
  "buyer_wallet": "0x...",
  "price_paid": 900
}
```

---

### 8. Get Ticket Details
```bash
GET /api/tickets/1
```
**Response**:
```json
{
  "success": true,
  "token_id": 1,
  "event_id": 1,
  "used": false,
  "is_listed": false,
  "list_price": 0,
  "sale_price": 900,
  "event": { ... }
}
```

---

### 9. Cancel Listing
```bash
POST /api/tickets/cancel-listing
Headers: Authorization: Bearer <jwt_token>
Body: {
  "token_id": 1
}
```
**Response**: `{ success: true, message: "Listing cancelled", tx_hash: "0x...", token_id: 1 }`

---

### 10. Get My Tickets
```bash
GET /api/tickets/my-tickets
Headers: Authorization: Bearer <jwt_token>
```
**Response**:
```json
{
  "success": true,
  "tickets": [
    {
      "token_id": 1,
      "event_id": 1,
      "used": false,
      "is_listed": false,
      "list_price": 0,
      "event": { ... }
    }
  ]
}
```

---

## Error Scenarios to Test

### OTP Expiration (After 10 minutes)
```bash
# Wait 11 minutes, then try to confirm
POST /api/tickets/buy-resale/confirm
# Expected: 401 - "Invalid or expired OTP"
```

### Duplicate Identity
```bash
# Try to use same identity to buy different tickets
# Expected: 400 - "Identity commitment already used"
```

### Ticket Already Used
```bash
# Mark ticket as used, then try to list
# Expected: 400 - "Cannot list used tickets"
```

### Ticket Not Listed
```bash
# Try to update price of unlisted ticket
POST /api/tickets/update-list-price { token_id: 1, new_price: 500 }
# Expected: 400 - "Ticket is not listed for resale"
```

### Sold Out Event
```bash
# Create event with totalTickets: 1
# Mint 1 ticket
# Try to mint another
# Expected: 400 - "Event sold out"
```

---

## Performance Metrics

### Expected Response Times (on testnet)
- `POST /list`: ~20-30s (blockchain confirmation)
- `POST /update-list-price`: ~20-30s
- `POST /cancel-listing`: ~20-30s
- `POST /buy-resale/confirm`: ~25-35s (includes new commitment calc)
- `GET /marketplace`: <1s (read-only)
- `GET /my-tickets`: ~3-5s (blockchain filter query)
- `GET /:tokenId`: <1s

### Gas Estimates (on Base testnet)
- `createEvent`: ~150k gas
- `mintTicket`: ~180k gas
- `listForResale`: ~100k gas
- `updateListPrice`: ~80k gas
- `cancelListing`: ~90k gas
- `buyResale`: ~200k gas (includes transfer + commitment)
- `markUsed`: ~80k gas

---

## Debugging Tips

### Check OTP Generation
```javascript
// In console/test
const { createResaleOtp, verifyResaleOtp } = require('./backend/service/otpService');
const otp = createResaleOtp(1, '987654321098');
console.log(otp.otp); // See the generated OTP
```

### Verify Blockchain State
```bash
# Use etherscan or blockchain explorer
# Look up contract address
# View Events (TicketListed, TicketResold, etc.)
```

### Check Transaction Details
```bash
# Use provided tx_hash in responses
# On testnet explorer: Search for tx_hash
# Verify state changes in Events tab
```

### Enable Debug Logging
```bash
# In backend, set environment variable
DEBUG=blockchainService:* npm start
```

---

## Cleanup (Reset State)

To reset for next test:
1. Deploy fresh contract instance
2. Update CONTRACT_ADDRESS in .env
3. Clear any cached identities/sessions
4. Restart backend server

