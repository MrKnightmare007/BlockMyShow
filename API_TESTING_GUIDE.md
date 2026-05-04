# BlockMyShow API Testing Guide

## Overview

This guide provides step-by-step instructions for testing all BlockMyShow API endpoints, including the newly implemented ticket resale marketplace functionality.

**Smart Contract Details:**
- Contract Address: `0xD1c02b3F300CC5815A84E0c5cB36C179FB673A0F`
- Network: Base Sepolia (Chain ID: 84532)
- Status: ✅ Verified on Sourcify

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd /home/endv/hikki/docss/BlockMyShow/backend
   npm install
   npm start
   ```

2. **Postman Installed** - Updated collection in `Blockmyshow.postman_collection.json`

3. **Environment Variables Updated** - `.env` file with contract address:
   ```
   CONTRACT_ADDRESS=0xD1c02b3F300CC5815A84E0c5cB36C179FB673A0F
   ```

## Testing Workflow

### Phase 1: User Authentication

1. **Create User (Signup)**
   - Endpoint: `POST /user/signup`
   - Body:
     ```json
     {
       "email": "user@example.com",
       "phone": "+919876543210",
       "password": "password123"
     }
     ```
   - Expected: 200 OK, OTP sent

2. **Verify OTP**
   - Endpoint: `POST /user/verify-otp`
   - Body:
     ```json
     {
       "email": "user@example.com",
       "otp": "123456"
     }
     ```
   - Expected: 200 OK, `userToken` saved

3. **Get User Details**
   - Endpoint: `GET /user/me`
   - Headers: `Authorization: Bearer {{userToken}}`
   - Expected: 200 OK, user details with identity

### Phase 2: Event Management

1. **Create Event** (Admin only)
   - Endpoint: `POST /admin/create-event`
   - Body:
     ```json
     {
       "title": "Tech Conference 2024",
       "venue": "Convention Center",
       "date": 1735689600,
       "price": 5000,
       "photoUrl": "https://example.com/poster.jpg",
       "totalTickets": 100
     }
     ```
   - Expected: 200 OK, `eventId` returned

2. **Get Event Details**
   - Endpoint: `GET /events/{eventId}`
   - Expected: 200 OK, event info with tickets count

### Phase 3: Initial Ticket Purchase

1. **Request Ticket (User)**
   - Endpoint: `POST /tickets/request`
   - Headers: `Authorization: Bearer {{userToken}}`
   - Body:
     ```json
     {
       "eventId": 1,
       "quantity": 1
     }
     ```
   - Expected: 200 OK, OTP sent via SMS

2. **Confirm Ticket Purchase**
   - Endpoint: `POST /tickets/confirm`
   - Headers: `Authorization: Bearer {{userToken}}`
   - Body:
     ```json
     {
       "eventId": 1,
       "otp": "123456"
     }
     ```
   - Expected: 200 OK, `tokenId` returned

3. **Get User Tickets**
   - Endpoint: `GET /tickets/my-tickets`
   - Headers: `Authorization: Bearer {{userToken}}`
   - Expected: 200 OK, array of owned tickets

### Phase 4: Ticket Resale - Seller Flow

1. **List Ticket for Resale**
   - Endpoint: `POST /tickets/list`
   - Headers: `Authorization: Bearer {{userToken}}`
   - Body:
     ```json
     {
       "tokenId": 1,
       "price": 6000
     }
     ```
   - Expected: 200 OK, ticket listed on marketplace
   - **On-chain:** `TicketListed` event emitted

2. **Update Resale Price** (Seller)
   - Endpoint: `POST /tickets/update-list-price`
   - Headers: `Authorization: Bearer {{userToken}}`
   - Body:
     ```json
     {
       "tokenId": 1,
       "newPrice": 5500
     }
     ```
   - Expected: 200 OK, price updated
   - **On-chain:** `TicketListPriceUpdated` event

3. **View Marketplace** (Public)
   - Endpoint: `GET /tickets/marketplace`
   - Expected: 200 OK, array of all listed tickets
   - **Response includes:** token ID, event, current price, seller

### Phase 5: Ticket Resale - Buyer Flow (2-Step OTP)

#### Step 1: Request OTP for Purchase

4. **Buy Resale - Request OTP**
   - Endpoint: `POST /tickets/buy-resale/request`
   - Headers: `Authorization: Bearer {{userToken}}`
   - Body:
     ```json
     {
       "tokenId": 1,
       "buyerIdentity": "buyer_identity_hash"
     }
     ```
   - Expected: 200 OK, OTP sent to buyer's phone
   - **System:** Generates HMAC-SHA256 OTP with 10-min validity

#### Step 2: Confirm Purchase with OTP

5. **Buy Resale - Confirm with OTP**
   - Endpoint: `POST /tickets/buy-resale/confirm`
   - Headers: `Authorization: Bearer {{userToken}}`
   - Body:
     ```json
     {
       "tokenId": 1,
       "buyerIdentity": "buyer_identity_hash",
       "otp": "123456"
     }
     ```
   - Expected: 200 OK, ticket ownership transferred
   - **On-chain:** `TicketResold` event emitted, NFT transferred

### Phase 6: Additional Operations

1. **Cancel Listing** (Seller)
   - Endpoint: `POST /tickets/cancel-listing`
   - Headers: `Authorization: Bearer {{userToken}}`
   - Body:
     ```json
     {
       "tokenId": 1
     }
     ```
   - Expected: 200 OK, ticket removed from marketplace
   - **On-chain:** `TicketUnlisted` event

2. **Get Ticket Details**
   - Endpoint: `GET /tickets/{tokenId}`
   - Headers: `Authorization: Bearer {{userToken}}`
   - Expected: 200 OK, full ticket info (event, owner, listing status, prices)

3. **Mark Ticket as Used** (Gate Staff - Admin)
   - Endpoint: `POST /gate/use-ticket`
   - Headers: `Authorization: Bearer {{adminToken}}`
   - Body:
     ```json
     {
       "tokenId": 1,
       "commitment": "user_commitment_hash"
     }
     ```
   - Expected: 200 OK, ticket marked used
   - **On-chain:** `TicketUsed` event

## Complete Test Scenario

### Scenario: User A buys, lists, and sells ticket to User B

1. **User A Setup**
   ```
   POST /user/signup → Email: user_a@test.com → OTP received
   POST /user/verify-otp → Verify with OTP → Token received (userTokenA)
   ```

2. **Event Creation** (by admin)
   ```
   POST /admin/create-event → Title: Concert 2024 → eventId: 1
   ```

3. **User A Buys Ticket**
   ```
   POST /tickets/request → eventId: 1 → OTP sent
   POST /tickets/confirm → OTP: 123456 → tokenId: 1 received
   ```

4. **User A Lists for Resale**
   ```
   POST /tickets/list → tokenId: 1, price: 6000
   GET /tickets/marketplace → See ticket listed
   ```

5. **User B Setup**
   ```
   POST /user/signup → Email: user_b@test.com → OTP received
   POST /user/verify-otp → Verify with OTP → Token received (userTokenB)
   ```

6. **User B Buys Resale (2-Step Process)**
   ```
   // Step 1: Request OTP
   POST /tickets/buy-resale/request 
   → tokenId: 1, buyerIdentity: "buyer_hash" 
   → OTP sent to User B's phone
   
   // Step 2: Confirm with OTP
   POST /tickets/buy-resale/confirm 
   → tokenId: 1, buyerIdentity: "buyer_hash", otp: "123456"
   → Ticket ownership transferred to User B
   ```

7. **Verification**
   ```
   GET /tickets/my-tickets (with userTokenA) → tokenId: 1 not in list
   GET /tickets/my-tickets (with userTokenB) → tokenId: 1 in list
   GET /tickets/1 → Shows User B as owner
   ```

## Error Handling

### Common Error Responses

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Invalid event ID | `{ error: "Event not found" }` |
| 400 | Ticket already used | `{ error: "Ticket already used" }` |
| 400 | Not ticket owner | `{ error: "Not ticket owner" }` |
| 400 | Ticket not listed | `{ error: "Ticket not listed" }` |
| 400 | Invalid OTP | `{ error: "Invalid or expired OTP" }` |
| 401 | Missing auth token | `{ error: "Unauthorized" }` |
| 500 | Blockchain error | `{ error: "Transaction failed on-chain" }` |

## OTP System Details

### Signup OTP
- Generated on signup, sent via email/SMS
- Time window: 10 minutes (600,000 ms)
- Algorithm: HMAC-SHA256
- Key: `OTP_SECRET` from `.env`

### Resale OTP
- Generated on buy-resale request
- Time window: 10 minutes (600,000 ms)
- Algorithm: HMAC-SHA256
- Key: `OTP_SECRET` from `.env`
- Input: `tokenId + buyerIdentity`

### OTP Verification
- Validates against current and previous time window (clock skew tolerance)
- No database persistence - purely cryptographic
- Commitment prevents duplicate purchases

## On-Chain Events

All resale operations emit blockchain events:

```solidity
// Emitted when ticket listed
event TicketListed(uint256 indexed tokenId, uint256 listPrice);

// Emitted when price updated
event TicketListPriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice);

// Emitted when listing cancelled
event TicketUnlisted(uint256 indexed tokenId);

// Emitted when resale completed
event TicketResold(uint256 indexed tokenId, address indexed newOwner, uint256 price);

// Emitted when ticket used at gate
event TicketUsed(uint256 indexed tokenId);
```

## Postman Collection Variables

| Variable | Value | Usage |
|----------|-------|-------|
| `baseUrl` | http://localhost:5000 | All requests |
| `userToken` | Auto-set | Auth for user endpoints |
| `adminToken` | Auto-set | Auth for admin endpoints |
| `eventId` | 1 | Event operations |
| `tokenId` | 1 | Ticket operations |
| `contractAddress` | 0xD1c02... | Reference only |
| `listPrice` | 500 | Resale listing |
| `buyerIdentity` | buyer123 | Resale buyer |
| `resaleOtp` | 123456 | Resale confirmation |

## Testing Checklist

- [ ] User signup/login flow works
- [ ] Event creation successful
- [ ] Initial ticket purchase works
- [ ] User tickets retrieval works
- [ ] List for resale works
- [ ] Update list price works
- [ ] Cancel listing works
- [ ] Marketplace view shows listed tickets
- [ ] Buy resale request sends OTP
- [ ] Buy resale confirm transfers ownership
- [ ] Ticket details show correct owner
- [ ] Used tickets cannot be listed
- [ ] Invalid OTP rejected for resale
- [ ] Blockchain events emitted correctly
- [ ] Contract address in .env is correct

## Troubleshooting

### Issue: "Contract not found"
- Verify `CONTRACT_ADDRESS=0xD1c02b3F300CC5815A84E0c5cB36C179FB673A0F` in `.env`
- Check RPC_URL points to Base Sepolia

### Issue: "Invalid OTP"
- Ensure system time is synchronized
- OTP window is 10 minutes from generation
- Use the exact OTP sent (no modifications)

### Issue: "Unauthorized"
- Token may have expired (7 days)
- Re-authenticate user
- Check token in Authorization header

### Issue: "Ticket not listed"
- Verify ticket owner matches authenticated user
- Ticket might already be sold or delisted

## Support

For issues, check:
1. Backend logs: `npm run dev` shows request details
2. Blockchain explorer: https://sepolia.basescan.org/
3. Contract verification: https://sourcify.dev/

Contract: `0xD1c02b3F300CC5815A84E0c5cB36C179FB673A0F`
