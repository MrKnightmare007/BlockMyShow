# Event Creation Fix - photoUrl Parameter Update

## Issue
The backend event creation was failing with revert data error because the contract call parameters were mismatched.

**Error:**
```
"missing revert data" - Contract call failed
```

**Root Cause:** 
The backend was using `metadataURI` parameter, but the deployed ProofPass contract uses `photoUrl` with a different parameter order.

---

## Changes Made

### 1. Event Model (`backend/models/eventModel.js`)

#### Updated ABI Structure
**Before:**
```javascript
const EVENT_INFO_COMPONENTS = [
  { name: 'eventId', type: 'uint256' },
  { name: 'title', type: 'string' },
  { name: 'venue', type: 'string' },
  { name: 'date', type: 'uint256' },
  { name: 'price', type: 'uint256' },
  { name: 'totalTickets', type: 'uint256' },
  { name: 'ticketsMinted', type: 'uint256' },
  { name: 'metadataURI', type: 'string' }
]
```

**After:**
```javascript
const EVENT_INFO_COMPONENTS = [
  { name: 'eventId', type: 'uint256' },
  { name: 'title', type: 'string' },
  { name: 'venue', type: 'string' },
  { name: 'date', type: 'uint256' },
  { name: 'price', type: 'uint256' },
  { name: 'photoUrl', type: 'string' },        // Moved to position 6 (after price)
  { name: 'totalTickets', type: 'uint256' },
  { name: 'ticketsMinted', type: 'uint256' }
]
```

#### Updated createEvent Function Signature
**Before:**
```javascript
inputs: [
  { name: 'title', type: 'string' },
  { name: 'venue', type: 'string' },
  { name: 'date', type: 'uint256' },
  { name: 'price', type: 'uint256' },
  { name: 'totalTickets', type: 'uint256' },      // Wrong position
  { name: 'metadataURI', type: 'string' }         // Wrong name & position
]
```

**After (Matches ProofPass Contract):**
```javascript
inputs: [
  { name: 'title', type: 'string' },
  { name: 'venue', type: 'string' },
  { name: 'date', type: 'uint256' },
  { name: 'price', type: 'uint256' },
  { name: 'photoUrl', type: 'string' },           // Correct position 5
  { name: 'totalTickets', type: 'uint256' }       // Correct position 6
]
```

#### Updated createEventOnChain Function
**Before:**
```javascript
const createEventOnChain = async (data) => {
  const contract = getWriteContract()
  const eventId = await contract.createEvent.staticCall(
    data.title,
    data.venue,
    data.date,
    data.price,
    data.totalTickets,           // Wrong - should be 5th param
    data.metadataURI             // Wrong - should be 5th param
  )
```

**After:**
```javascript
const createEventOnChain = async (data) => {
  const contract = getWriteContract()
  const eventId = await contract.createEvent.staticCall(
    data.title,
    data.venue,
    data.date,
    data.price,
    data.photoUrl || '',         // Correct position, optional
    data.totalTickets            // Correct position
  )
```

#### Updated updateEventMetadata
**Before:**
```javascript
{
  type: 'function',
  name: 'updateEventMetadata',
  inputs: [
    { name: 'eventId', type: 'uint256' },
    { name: 'newURI', type: 'string' }     // Wrong name
  ]
}
```

**After:**
```javascript
{
  type: 'function',
  name: 'updateEventMetadata',
  inputs: [
    { name: 'eventId', type: 'uint256' },
    { name: 'newPhotoUrl', type: 'string' }  // Correct name
  ]
}
```

#### Updated normalizeEvent
**Before:**
```javascript
const normalizeEvent = (eventInfo) => {
  return {
    ...
    totalTickets: Number(eventInfo.totalTickets ?? eventInfo[5]),
    ticketsMinted: Number(eventInfo.ticketsMinted ?? eventInfo[6]),
    metadataURI: eventInfo.metadataURI ?? eventInfo[7]
  }
}
```

**After:**
```javascript
const normalizeEvent = (eventInfo) => {
  return {
    ...
    photoUrl: eventInfo.photoUrl ?? eventInfo[5],         // Correct position
    totalTickets: Number(eventInfo.totalTickets ?? eventInfo[6]),
    ticketsMinted: Number(eventInfo.ticketsMinted ?? eventInfo[7])
  }
}
```

---

### 2. Event Controller (`backend/controllers/eventController.js`)

#### Updated pickEventPayload
**Before:**
```javascript
const pickEventPayload = (body) => {
  const { title, venue, date, price, totalTickets, metadataURI } = body
  // ...
  if (metadataURI !== undefined) payload.metadataURI = metadataURI
}
```

**After:**
```javascript
const pickEventPayload = (body) => {
  const { title, venue, date, price, totalTickets, photoUrl } = body
  // ...
  if (photoUrl !== undefined) payload.photoUrl = photoUrl
}
```

#### Made photoUrl Optional
**Before:**
```javascript
const validateCreateEvent = (payload) => {
  const requiredFields = ['title', 'venue', 'date', 'price', 'totalTickets', 'metadataURI']
  // metadataURI was required
}
```

**After:**
```javascript
const validateCreateEvent = (payload) => {
  const requiredFields = ['title', 'venue', 'date', 'price', 'totalTickets']
  // photoUrl is optional - removed from required fields
}
```

---

## Updated API Request

### Create Event Endpoint
**URL:** `POST /api/events`

**Required Parameters:**
- `title` (string) - Event name
- `venue` (string) - Event location
- `date` (number or ISO string) - Unix timestamp or ISO date
- `price` (number) - Ticket price in INR
- `totalTickets` (number) - Max tickets available

**Optional Parameters:**
- `photoUrl` (string) - Event poster image URL

### Correct cURL Request
```bash
curl --location 'http://localhost:5000/api/events' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN' \
--data '{
  "title": "BlockMyShow Launch Night",
  "venue": "Kolkata",
  "date": 1748880000,
  "price": 499,
  "totalTickets": 100,
  "photoUrl": "https://picsum.photos/200"
}'
```

### Response (Success)
```json
{
  "success": true,
  "message": "Event created on chain",
  "event": {
    "eventId": 1,
    "transactionHash": "0x..."
  }
}
```

---

## ProofPass Contract Signature
For reference, the deployed ProofPass contract createEvent function:

```solidity
function createEvent(
    string memory title,
    string memory venue,
    uint256 date,
    uint256 price,
    string memory photoUrl,      // Optional
    uint256 totalTickets
) public onlyOwner returns (uint256)
```

**Parameter Order (Critical):**
1. title (string)
2. venue (string)
3. date (uint256)
4. price (uint256)
5. photoUrl (string) - **Optional, moved BEFORE totalTickets**
6. totalTickets (uint256)

---

## Testing Checklist
- [x] Event model ABI updated
- [x] Parameter order corrected in createEvent
- [x] photoUrl marked as optional in validation
- [x] Event controller uses photoUrl
- [x] normalizeEvent updated to read from correct positions
- [x] updateEventMetadata parameter renamed

## Summary
✅ **All event creation parameters now match the ProofPass contract signature**
✅ **photoUrl is optional as designed**
✅ **Backend ready for event creation testing**
