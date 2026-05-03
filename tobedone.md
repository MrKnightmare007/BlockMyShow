# ProofPass — Backend Remaining Work Assignment

This document is for teammate handover regarding the remaining backend implementation.

Auth and Events modules are already completed.

---

# Current Backend Status

## Completed APIs ✅

```text
POST  /api/user/auth
POST  /api/admin/login
GET   /api/events
GET   /api/events/:id
POST  /api/events
PUT   /api/events/:id/metadata
```

---

# Remaining Backend APIs To Build

Only the following APIs remain.

---

# 1. Identity Module

## POST `/api/identity/add`

### Purpose

Stores user identity securely using hashed Aadhaar number.

### Authentication

No auth required.

### Request Body

```json
{
  "identity_id": "aadhaar_number",
  "phone_number": "+91XXXXXXXXXX",
  "name": "User Name",
  "profile_photo_url": "hosted_url_or_ipfs"
}
```

---

### Storage Location

```text
data/identity.json
```

If file does not exist → create automatically.

---

### Logic

1. Hash identity_id using SHA256.

```js
hashed_identity_id = sha256(identity_id)
```

2. Load `data/identity.json`
3. Check if hashed identity already exists
4. If exists → return 409 conflict
5. Push new object into array
6. Save file back

---

### Stored Object Format

```json
{
  "hashed_identity_id": "sha256_hash",
  "phone_number": "+91XXXXXXXXXX",
  "name": "User Name",
  "profile_photo_url": "url"
}
```

---

### Response

```json
{
  "success": true,
  "message": "Identity added"
}
```

---

# 2. Ticket Booking Module

---

## POST `/api/tickets/request`

### Purpose

Step 1 of booking.

This only sends OTP.

NFT minting is NOT done here.

---

### Authentication

User auth required.

---

### Request Body

```json
{
  "event_id": 1,
  "identity_id": "aadhaar_number"
}
```

---

### Logic

1. Hash identity_id

```js
hashed = sha256(identity_id)
```

2. Search identity.json
3. If identity missing → 404
4. Check blockchain event exists

```js
contract.getEvent(event_id)
```

5. Check not sold out

```js
event.ticketsMinted < event.totalTickets
```

6. Generate OTP

```js
otpService.createSignupOtp(identity_id, event_id)
```

7. Send OTP to identity phone number using Twilio.

---

### Response

```json
{
  "success": true,
  "message": "OTP sent",
  "expires_in_minutes": 10
}
```

---

## POST `/api/tickets/confirm`

### Purpose

Step 2 of booking.

Verifies OTP and mints NFT.

---

### Authentication

User auth required.

---

### Request Body

```json
{
  "event_id": 1,
  "identity_id": "aadhaar_number",
  "otp": "123456"
}
```

---

### Logic

1. Verify OTP

```js
otpService.verifySignupOtp(identity_id, event_id, otp)
```

2. Create commitment

```js
commitment = ethers.keccak256(
  ethers.toUtf8Bytes(
    process.env.OTP_SECRET + identity_id + event_id
  )
)
```

3. Get wallet address from JWT

```js
req.user.wallet_address
```

4. Mint ticket

```js
contract.mintTicket(to, event_id, commitment)
```

5. Wait for transaction receipt.

---

### Response

```json
{
  "success": true,
  "token_id": 123,
  "tx_hash": "0x..."
}
```

---

## GET `/api/tickets/my-tickets`

### Purpose

Returns all NFTs owned by logged-in user.

---

### Authentication

User auth required.

---

### Logic

1. Get wallet from JWT

```js
wallet_address = req.user.wallet_address
```

2. Query transfer events

```js
filter = contract.filters.Transfer(null, wallet_address)
```

3. Fetch all events

```js
contract.queryFilter(filter)
```

4. Extract token IDs
5. For each token:

```js
ticketInfo = contract.getTicketInfo(token_id)
eventInfo = contract.getEvent(ticketInfo.eventId)
```

6. Combine data.

---

### Response

```json
{
  "success": true,
  "tickets": [
    {
      "token_id": 1,
      "event_id": 1,
      "used": false,
      "commitment": "bytes32",
      "event": {
        "title": "Concert",
        "venue": "Venue",
        "date": "timestamp",
        "price": "price"
      }
    }
  ]
}
```

---

# 3. Gate Verification Module

---

## POST `/api/gate/entry`

### Purpose

Step 1 at gate verification.

Gate scanner checks ticket ownership + identity.

---

### Authentication

Admin auth required.

---

### Request Body

```json
{
  "token_id": 1,
  "identity_id": "aadhaar_number"
}
```

---

### Logic

1. Fetch ticket info

```js
contract.getTicketInfo(token_id)
```

2. Ensure ticket unused
3. Hash identity
4. Lookup identity.json
5. Generate expected commitment

```js
keccak256(SECRET + identity_id + ticketInfo.eventId)
```

6. Compare commitment with blockchain value.
7. Send OTP to registered phone.

---

### Response

```json
{
  "success": true,
  "message": "OTP sent",
  "identity": {
    "name": "User Name",
    "profile_photo_url": "url"
  }
}
```

---

## POST `/api/gate/verify-entry`

### Purpose

Final gate validation.

Marks ticket used on blockchain.

---

### Authentication

Admin auth required.

---

### Request Body

```json
{
  "token_id": 1,
  "identity_id": "aadhaar_number",
  "otp": "123456"
}
```

---

### Logic

1. Verify OTP

```js
otpService.verifySignupOtp(identity_id, token_id, otp)
```

Note:

Use token_id instead of event_id for OTP uniqueness.

2. Fetch ticket info
3. Ensure ticket unused
4. Generate commitment

```js
keccak256(SECRET + identity_id + ticketInfo.eventId)
```

5. Call blockchain mark used

```js
contract.markUsed(token_id, commitment)
```

6. Wait for transaction receipt.

---

### Response

```json
{
  "success": true,
  "tx_hash": "0x..."
}
```

---

# Existing Utilities To Reuse

These already exist.

### Reusable Services

```text
otpService.js
hash.js
jwtService.js
```

No need to rebuild.

---

# Remaining Work Summary

```text
TO BUILD

POST  /api/identity/add
POST  /api/tickets/request
POST  /api/tickets/confirm
GET   /api/tickets/my-tickets
POST  /api/gate/entry
POST  /api/gate/verify-entry
```

---

# Total Remaining Endpoints

```text
6 APIs remaining
```

---

# Suggested Folder Structure

```text
routes/
├── auth.routes.js
├── events.routes.js
├── identity.routes.js
├── tickets.routes.js
├── gate.routes.js
```

```text
controllers/
├── identity.controller.js
├── tickets.controller.js
├── gate.controller.js
```

```text
services/
├── otpService.js
├── blockchainService.js
├── identityService.js
```

---

# Important Notes

* Do not store raw Aadhaar number.
* Always hash before persistence.
* Backend handles all blockchain calls.
* Frontend must never directly mint NFTs.
* OTP should expire within configured window.
* Gate verification must ensure commitment matches.
* Ticket can only be used once.

---

# Backend Completion Goal

After these 6 endpoints are done:

* Booking flow complete
* NFT minting complete
* Identity verification complete
* Gate entry validation complete
* Ticket ownership retrieval complete

Backend will then be functionally complete for MVP.
