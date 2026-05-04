# ✅ Event Creation Fix - Complete Summary

## Problem
Event creation endpoint was failing with revert data error when calling the ProofPass smart contract.

**Error Message:**
```
"missing revert data (action="call", data=null, reason=null...
```

**Root Cause:**
The backend ABI was using incorrect parameter names and order:
- Used `metadataURI` instead of `photoUrl`
- Had incorrect parameter order: `(title, venue, date, price, totalTickets, metadataURI)` ❌
- ProofPass contract expects: `(title, venue, date, price, photoUrl, totalTickets)` ✅

---

## Solution Applied

### ✅ Fixed Files

#### 1. `backend/models/eventModel.js`
- Updated `EVENT_INFO_COMPONENTS` struct
- Fixed `createEvent` ABI function signature
- Updated `updateEventMetadata` parameter name (newURI → newPhotoUrl)
- Fixed `createEventOnChain()` to use correct parameter order
- Updated `normalizeEvent()` to read from correct positions

#### 2. `backend/controllers/eventController.js`
- Changed `pickEventPayload()` to use `photoUrl`
- Made `photoUrl` **optional** (removed from required fields)
- Now validates only: `['title', 'venue', 'date', 'price', 'totalTickets']`

---

## Correct API Usage

### Request Format
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

### Parameters
| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `title` | string | ✅ Yes | Event name |
| `venue` | string | ✅ Yes | Event location |
| `date` | number | ✅ Yes | Unix timestamp or ISO date |
| `price` | number | ✅ Yes | Ticket price (INR) |
| `totalTickets` | number | ✅ Yes | Max tickets available |
| `photoUrl` | string | ❌ No | **Optional** - Event poster URL |

### Success Response
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

## Smart Contract Reference

**ProofPass `createEvent` function signature:**

```solidity
function createEvent(
    string memory title,
    string memory venue,
    uint256 date,
    uint256 price,
    string memory photoUrl,      // ← Optional parameter
    uint256 totalTickets
) public onlyOwner returns (uint256)
```

**Parameter Order (Critical):**
```
Position 1: title
Position 2: venue
Position 3: date
Position 4: price
Position 5: photoUrl          ← MOVED (was last, now 5th)
Position 6: totalTickets      ← MOVED (was 5th, now last)
```

---

## What Changed

### Old Backend Code ❌
```javascript
// WRONG ORDER
await contract.createEvent(
  data.title,
  data.venue,
  data.date,
  data.price,
  data.totalTickets,        // ← Wrong position
  data.metadataURI          // ← Wrong name & position
)

// WRONG - metadataURI was required
requiredFields = ['title', 'venue', 'date', 'price', 'totalTickets', 'metadataURI']
```

### New Backend Code ✅
```javascript
// CORRECT ORDER
await contract.createEvent(
  data.title,
  data.venue,
  data.date,
  data.price,
  data.photoUrl || '',      // ← Correct position, optional
  data.totalTickets         // ← Correct position
)

// CORRECT - photoUrl is optional
requiredFields = ['title', 'venue', 'date', 'price', 'totalTickets']
```

---

## Verification Checklist
- ✅ `photoUrl` parameter in ABI
- ✅ Correct parameter order in contract calls
- ✅ Controller accepts `photoUrl`
- ✅ `photoUrl` is optional (not required)
- ✅ Error handling updated
- ✅ Ready for testing

---

## Next Steps

1. **Start Backend Server:**
   ```bash
   cd /home/endv/hikki/docss/BlockMyShow/backend
   npm start
   ```

2. **Test Event Creation:**
   Use the corrected curl request above or import into Postman

3. **Expected Flow:**
   - Create event with optional photoUrl
   - Event created on ProofPass contract
   - Transaction hash returned
   - Event queryable via getEvent()

---

## Testing Payload
```json
{
  "title": "Tech Summit 2026",
  "venue": "Bangalore",
  "date": 1748880000,
  "price": 999,
  "totalTickets": 500,
  "photoUrl": "https://example.com/poster.jpg"
}
```

**All systems now ready for event creation testing!** ✅
