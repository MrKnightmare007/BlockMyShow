# BlockMyShow Architecture

## System Overview

```
╔────────────────────────────────────────────────────────────────╗
│                     BLOCKMYSHOW SYSTEM                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  USER INTERFACE (React 19 + Vite)                            │
│  ├─ Dashboard: Browse events                                 │
│  ├─ Booking: Identity → Payment → OTP → Mint                │
│  ├─ Resale: Buy/Sell tickets (30% price cap)                │
│  └─ Tickets: View QR codes for entry                         │
│                                                                │
│  ADMIN INTERFACE (Expo/React Native)                         │
│  └─ Gate Scanner: Scan QR codes, mark tickets used           │
│                                                                │
│  BACKEND (Node.js + Express + Appwrite)                      │
│  ├─ /api/events - Event CRUD                                │
│  ├─ /api/tickets - Booking + OTP verification               │
│  ├─ /api/tickets/resale - Marketplace                        │
│  ├─ /api/payment - Razorpay integration                      │
│  └─ /api/gate - QR scanning + verification                  │
│                                                                │
│  SMART CONTRACT (Solidity on Base Sepolia)                   │
│  └─ Mint NFT tickets, verify ownership                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 1. Smart Contract Layer (Solidity)

### Contract Details
- **Address:** `0xb950c531c7A75d7c29609eBcf77dF4226E5AA28C`
- **Network:** Base Sepolia (Testnet)
- **File:** `contract/src/Ticket.sol`

### Data Structures

```solidity
struct EventInfo {
    uint256 eventId;
    string title;
    string venue;
    uint256 date;
    uint256 price;
    uint256 totalTickets;
    uint256 ticketsMinted;
    string metadataURI;
}

struct TicketInfo {
    uint256 eventId;
    bytes32 identityCommitment;
    bool used;
    uint256 tokenId;
}

mapping(uint256 => EventInfo) public events;
mapping(uint256 => TicketInfo) public tickets;
mapping(address => uint256[]) public userTickets;
```

### Key Functions
- `mintTicket(uint256 eventId, bytes32 identityCommitment)` - Mint NFT
- `useTicket(uint256 ticketId)` - Mark as used at gate
- `getEventTickets(uint256 eventId)` - List all tickets for event

### Privacy Design
- Identity never stored on-chain (only commitment hash)
- User wallet not linked to ticket

```solidity
mapping(uint256 => uint256[]) eventToTokens
```

This is intentional design.

Ownership tracking relies on:

```solidity
ERC721 Transfer events
```

Confirmed from contract: fileciteturn7file0

---


### Explanation
- `Event`: Stores all event-level metadata
- `Ticket`: Stores ticket-specific data including privacy commitment
- `events`: event_id → Event
- `tickets`: token_id → Ticket


---

### Smart Contract Functions (Actual Behavior)

#### createEvent(...)

Creates a new event on-chain.

**Internal Steps:**
1. Validate inputs (title, venue, date, supply)
2. Assign eventId using `nextEventId++`
3. Store struct inside `events`
4. Emit `EventCreated`

**Important:**
- Only contract owner can call
- Events are immutable except metadata

---

#### updateEventMetadata(eventId, newURI)

Updates IPFS/metadata URI.

**Used by:** Admin panel

---

#### getEvent(eventId)

Fetches event struct.

**Used by:**
- Backend `/events`
- Ticket validation

---

#### mintTicket(to, eventId, commitment)

Mints NFT ticket.

**Internal Flow:**
1. Validate address and event
2. Check `ticketsMinted < totalTickets`
3. Generate `tokenId = nextTokenId++`
4. Increment `ticketsMinted`
5. `_safeMint(to, tokenId)` (ERC721)
6. Store ticket data in mapping
7. Emit `TicketMinted`

**Important Design:**
- Ticket is **non-transferable**
- Ownership is permanent

---

#### getTicketInfo(tokenId)

Returns:

```text
eventId
commitment
used
````

---

#### markUsed(tokenId, commitment)

Marks ticket as used.

**Internal Flow:**

1. Check ticket exists
2. Check not already used
3. Match commitment
4. Set `used = true`
5. Emit `TicketUsed`

---

#### tokenURI(tokenId)

Returns metadataURI of event.

---

#### Non-transferability


function _update(...) override

Prevents transfers:

require(from == address(0))

Meaning:

* Mint allowed
* Transfer NOT allowed

---

### Critical Design Insight

Since NFTs are non-transferable:



---

## 2. Backend Architecture

### Modules

* Auth
* Events
* Identity
* Tickets
* Gate

### APIs

---

## Auth APIs

### POST /api/user/auth

**Purpose:** Authenticate user via OTP

**Request:**

```json
{
  "phone": "string"
}
```

**Response:**

```json
{
  "otpSent": true
}
```

---

### POST /api/admin/login

**Request:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "token": "jwt_token"
}
```

---

## Events APIs

### GET /api/events

**Purpose:** List all events

**Response:**

```json
[
  {
    "id": 1,
    "name": "Concert",
    "metadataURI": "..."
  }
]
```

---

### GET /api/events/:id

**Response:**

```json
{
  "id": 1,
  "name": "Concert",
  "maxSupply": 100
}
```

---

### POST /api/events

**Purpose:** Create event

**Flow:**

* Calls smart contract `createEvent`
* Stores metadata off-chain if needed

**Request:**

```json
{
  "name": "Concert",
  "maxSupply": 100
}
```

---

## Identity APIs

### POST /api/identity/add

**Purpose:** Register identity

**Request:**

```json
{
  "aadhaar": "string",
  "faceHash": "string"
}
```

**Backend Work:**

* Hash identity
* Store securely

---

## Ticket APIs

### POST /api/tickets/request

**Purpose:** Start ticket purchase

**Request:**

```json
{
  "eventId": 1
}
```

**Backend Work:**

* Validate event
* Generate commitment
* Initiate OTP

---

### POST /api/tickets/confirm

**Purpose:** Confirm purchase + mint NFT

**Request:**

```json
{
  "otp": "123456"
}
```

**Backend Work:**

* Verify OTP
* Call smart contract `mintTicket`
* Store token_id mapping

**Response:**

```json
{
  "tokenId": 12
}
```

---

### GET /api/tickets/my-tickets

**Purpose:** Fetch user tickets

**Current Issue:**

* Slow due to blockchain scan

**Optimized Flow:**

* Fetch from DB mapping

**Response:**

```json
[
  {
    "tokenId": 12,
    "eventId": 1
  }
]
```

---

## Gate APIs

### POST /api/gate/entry

**Purpose:** Start entry verification

**Request:**

```json
{
  "tokenId": 12,
  "aadhaar": "string"
}
```

**Backend Work:**

* Recreate commitment
* Match with blockchain
* Trigger OTP

---

### POST /api/gate/verify-entry

**Purpose:** Final entry approval

**Request:**

```json
{
  "otp": "123456",
  "tokenId": 12
}
```

**Backend Work:**

* Verify OTP
* Call `markUsed`

---

## 3a. User Web Flow

### Pages & API Calls

#### Home Page

* Calls: GET /api/events

#### Event Details Page

* Calls: GET /api/events/:id

#### Book Ticket Flow

1. Click Book
2. POST /api/tickets/request
3. Enter OTP
4. POST /api/tickets/confirm

#### My Tickets Page

* Calls: GET /api/tickets/my-tickets

---

## 3b. Admin App (Gate Keeper)

### Flow

#### Scan QR

* Extract token_id

#### Identity Input

* Enter Aadhaar
* POST /api/gate/entry

#### Face Verification

* Compare UI photo

#### OTP Verification

* POST /api/gate/verify-entry

---

