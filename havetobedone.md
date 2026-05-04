# havetobedone.md

## 1) SMART CONTRACT (OPTIMIZED — REPLACE/DEPLOY THIS VERSION)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProofPass - Event Ticket NFT with Resale Support
 * @notice Non-transferable ERC721 tickets with resale marketplace
 * @dev All ticket metadata stored on-chain for transparency
 */
contract ProofPass is ERC721, Ownable {

    uint256 public nextTokenId;
    uint256 public nextEventId;

    // ────── STRUCTS ──────

    /**
     * @dev Event information
     * @param eventId Unique event identifier
     * @param title Event name
     * @param venue Event location
     * @param date Event timestamp (unix)
     * @param price Original ticket price in INR
     * @param photoUrl Event poster/image URL (for metadata)
     * @param totalTickets Maximum tickets for event
     * @param ticketsMinted Current minted count
     */
    struct EventInfo {
        uint256 eventId;
        string  title;
        string  venue;
        uint256 date;
        uint256 price;        // original ticket price in INR
        string  photoUrl;     // NEW: event poster/image
        uint256 totalTickets;
        uint256 ticketsMinted;
    }

    /**
     * @dev Ticket metadata stored on-chain
     * @param eventId Which event this ticket is for
     * @param commitment Hash for identity validation (keccak256(secret + identity + eventId))
     * @param used Whether ticket has been scanned/used at gate
     * @param isListed Whether ticket is listed for resale
     * @param listPrice Resale price in INR (0 if not listed)
     * @param salePrice Original sale price paid (for history)
     */
    struct TicketInfo {
        uint256 eventId;
        bytes32 commitment;
        bool    used;
        bool    isListed;     // resale listing status
        uint256 listPrice;    // resale price in INR
        uint256 salePrice;    // original price in INR
    }

    // ────── STORAGE ──────

    mapping(uint256 => EventInfo)  public events;
    mapping(uint256 => TicketInfo) public tickets;
    mapping(address => uint256[])  private userTickets;    // fast user lookup
    mapping(bytes32 => bool)       public usedCommitments; // prevent identity reuse
    uint256[]                      public listedTokens;    // resale marketplace

    // ────── EVENTS ──────

    event EventCreated(
        uint256 indexed eventId,
        string title,
        uint256 date,
        uint256 totalTickets
    );

    event EventMetadataUpdated(
        uint256 indexed eventId,
        string newPhotoUrl
    );

    event TicketMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint256 indexed eventId,
        bytes32 commitment
    );

    event TicketListed(
        uint256 indexed tokenId,
        uint256 listPrice
    );

    event TicketUnlisted(
        uint256 indexed tokenId
    );

    event TicketListPriceUpdated(
        uint256 indexed tokenId,
        uint256 oldPrice,
        uint256 newPrice
    );

    event TicketUsed(
        uint256 indexed tokenId
    );

    event TicketResold(
        uint256 indexed tokenId,
        address indexed newOwner,
        uint256 price
    );

    // ────── INITIALIZATION ──────

    constructor() ERC721("ProofPass", "PPASS") Ownable(msg.sender) {}

    // ═══════════════════════════════════════════════════════════════
    // ╔═══════════════════════════════════════════════════════════╗
    // ║                     EVENT MANAGEMENT                      ║
    // ╚═══════════════════════════════════════════════════════════╝
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Create new event (owner only)
     * @param title Event name
     * @param venue Event location
     * @param date Event timestamp (unix)
     * @param price Ticket price in INR
     * @param photoUrl Event poster URL
     * @param totalTickets Max tickets available
     * @return eventId The created event ID
     */
    function createEvent(
        string memory title,
        string memory venue,
        uint256 date,
        uint256 price,
        string memory photoUrl,
        uint256 totalTickets
    ) external onlyOwner returns (uint256) {
        require(bytes(title).length > 0,    "Title required");
        require(bytes(venue).length > 0,    "Venue required");
        require(date > block.timestamp,     "Date must be future");
        require(price > 0,                  "Price must be > 0");
        require(totalTickets > 0,           "Need at least 1 ticket");

        uint256 eventId = nextEventId++;

        events[eventId] = EventInfo({
            eventId:       eventId,
            title:         title,
            venue:         venue,
            date:          date,
            price:         price,
            photoUrl:      photoUrl,
            totalTickets:  totalTickets,
            ticketsMinted: 0
        });

        emit EventCreated(eventId, title, date, totalTickets);
        return eventId;
    }

    /**
     * @notice Update event photo URL (owner only)
     * @param eventId Event to update
     * @param newPhotoUrl New image URL
     */
    function updateEventMetadata(uint256 eventId, string memory newPhotoUrl)
        external
        onlyOwner
    {
        require(eventId < nextEventId, "Event not found");
        require(bytes(newPhotoUrl).length > 0, "Photo URL required");

        events[eventId].photoUrl = newPhotoUrl;
        emit EventMetadataUpdated(eventId, newPhotoUrl);
    }

    /**
     * @notice Get event details
     * @param eventId Event to fetch
     * @return Event information
     */
    function getEvent(uint256 eventId)
        external
        view
        returns (EventInfo memory)
    {
        require(eventId < nextEventId, "Event not found");
        return events[eventId];
    }

    // ═══════════════════════════════════════════════════════════════
    // ╔═══════════════════════════════════════════════════════════╗
    // ║                   TICKET ISSUANCE                         ║
    // ╚═══════════════════════════════════════════════════════════╝
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Mint initial ticket to user (owner/backend only)
     * @param to Recipient wallet address
     * @param eventId Event for the ticket
     * @param commitment Identity hash (keccak256(secret + identity + eventId))
     * @return tokenId The minted token ID
     */
    function mintTicket(
        address to,
        uint256 eventId,
        bytes32 commitment
    ) external onlyOwner returns (uint256) {
        require(to != address(0),                   "Invalid recipient");
        require(commitment != bytes32(0),           "Invalid commitment");
        require(eventId < nextEventId,              "Event not found");
        require(!usedCommitments[commitment],       "Commitment already used");

        EventInfo storage ev = events[eventId];
        require(ev.ticketsMinted < ev.totalTickets, "Event sold out");

        uint256 tokenId = nextTokenId++;
        ev.ticketsMinted++;

        _safeMint(to, tokenId);
        userTickets[to].push(tokenId);

        tickets[tokenId] = TicketInfo({
            eventId:    eventId,
            commitment: commitment,
            used:       false,
            isListed:   false,
            listPrice:  0,
            salePrice:  ev.price  // Store original event price
        });

        usedCommitments[commitment] = true;

        emit TicketMinted(tokenId, to, eventId, commitment);
        return tokenId;
    }

    /**
     * @notice Get ticket details
     * @param tokenId Token to fetch
     * @return Ticket information
     */
    function getTicketInfo(uint256 tokenId)
        external
        view
        returns (TicketInfo memory)
    {
        require(tokenId < nextTokenId, "Ticket not found");
        return tickets[tokenId];
    }

    /**
     * @notice Get all tickets for a user
     * @param user User's wallet address
     * @return Array of token IDs owned by user
     */
    function getUserTickets(address user)
        external
        view
        returns (uint256[] memory)
    {
        return userTickets[user];
    }

    /**
     * @notice Internal: Remove ticket from user's collection
     */
    function _removeUserTicket(address user, uint256 tokenId) internal {
        uint256[] storage tokens = userTickets[user];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ╔═══════════════════════════════════════════════════════════╗
    // ║                   RESALE MARKETPLACE                      ║
    // ╚═══════════════════════════════════════════════════════════╝
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice List ticket for resale (user initiates, owner confirms on chain)
     * @param tokenId Token to list
     * @param price Resale price in INR
     */
    function listForResale(uint256 tokenId, uint256 price) external {
        require(tokenId < nextTokenId,           "Ticket not found");
        require(ownerOf(tokenId) == msg.sender,  "Not ticket owner");
        require(!tickets[tokenId].used,          "Ticket already used");
        require(price > 0,                       "Price must be > 0");

        tickets[tokenId].isListed = true;
        tickets[tokenId].listPrice = price;
        listedTokens.push(tokenId);

        emit TicketListed(tokenId, price);
    }

    /**
     * @notice Cancel resale listing
     * @param tokenId Token to unlist
     */
    function cancelListing(uint256 tokenId) external {
        require(tokenId < nextTokenId,           "Ticket not found");
        require(ownerOf(tokenId) == msg.sender,  "Not ticket owner");
        require(tickets[tokenId].isListed,       "Ticket not listed");

        tickets[tokenId].isListed = false;
        tickets[tokenId].listPrice = 0;
        _removeListed(tokenId);

        emit TicketUnlisted(tokenId);
    }

    /**
     * @notice Update resale price for listed ticket
     * @param tokenId Token to update
     * @param newPrice New resale price in INR
     */
    function updateListPrice(uint256 tokenId, uint256 newPrice) external {
        require(tokenId < nextTokenId,           "Ticket not found");
        require(ownerOf(tokenId) == msg.sender,  "Not ticket owner");
        require(tickets[tokenId].isListed,       "Ticket not listed");
        require(newPrice > 0,                    "Price must be > 0");

        uint256 oldPrice = tickets[tokenId].listPrice;
        tickets[tokenId].listPrice = newPrice;

        emit TicketListPriceUpdated(tokenId, oldPrice, newPrice);
    }

    /**
     * @notice Internal: Remove token from listedTokens array
     */
    function _removeListed(uint256 tokenId) internal {
        for (uint256 i = 0; i < listedTokens.length; i++) {
            if (listedTokens[i] == tokenId) {
                listedTokens[i] = listedTokens[listedTokens.length - 1];
                listedTokens.pop();
                break;
            }
        }
    }

    /**
     * @notice Get all listed tokens
     * @return Array of token IDs available for resale
     */
    function getListedTokens()
        external
        view
        returns (uint256[] memory)
    {
        return listedTokens;
    }

    /**
     * @notice Complete resale transaction (owner/backend only)
     * @param tokenId Token being sold
     * @param buyer New owner's wallet
     * @param newCommitment New identity hash for buyer
     */
    function buyResale(
        uint256 tokenId,
        address buyer,
        bytes32 newCommitment
    ) external onlyOwner {
        require(tokenId < nextTokenId,              "Ticket not found");
        require(buyer != address(0),                "Invalid buyer");
        require(tickets[tokenId].isListed,          "Ticket not listed");
        require(!tickets[tokenId].used,             "Ticket already used");
        require(!usedCommitments[newCommitment],    "Identity already used");

        address seller = ownerOf(tokenId);
        uint256 salePrice = tickets[tokenId].listPrice;

        _removeUserTicket(seller, tokenId);
        _transfer(seller, buyer, tokenId);
        userTickets[buyer].push(tokenId);

        // Update ticket metadata
        tickets[tokenId].commitment = newCommitment;
        tickets[tokenId].isListed = false;
        tickets[tokenId].listPrice = 0;
        tickets[tokenId].salePrice = salePrice;

        _removeListed(tokenId);
        usedCommitments[newCommitment] = true;

        emit TicketResold(tokenId, buyer, salePrice);
    }

    // ═══════════════════════════════════════════════════════════════
    // ╔═══════════════════════════════════════════════════════════╗
    // ║                    GATE OPERATIONS                        ║
    // ╚═══════════════════════════════════════════════════════════╝
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Mark ticket as used at event gate (owner/gate staff only)
     * @param tokenId Token to mark used
     * @param commitment Must match stored commitment (prevents fraud)
     */
    function markUsed(
        uint256 tokenId,
        bytes32 commitment
    ) external onlyOwner {
        require(tokenId < nextTokenId,                     "Ticket not found");

        TicketInfo storage ticket = tickets[tokenId];

        require(!ticket.used,                              "Already scanned");
        require(ticket.commitment == commitment,           "Invalid commitment");

        ticket.used = true;
        emit TicketUsed(tokenId);
    }

    // ═══════════════════════════════════════════════════════════════
    // ╔═══════════════════════════════════════════════════════════╗
    // ║               TRANSFER CONTROL & SECURITY                 ║
    // ╚═══════════════════════════════════════════════════════════╝
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Override: Only allow transfers for listed resale tickets
     * @dev All other transfers blocked (non-transferable by default)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = super._update(to, tokenId, auth);

        // Allow minting (from == address(0))
        if (from == address(0)) return from;

        // Block transfers unless token is listed for resale
        require(
            tickets[tokenId].isListed,
            "Transfers disabled - list ticket for resale first"
        );

        return from;
    }
}
```

---

## 2) OPTIMIZED CONTRACT DESIGN - KEY IMPROVEMENTS

### Architecture Decisions

**1. TicketInfo Struct Enhancement**
- Added `salePrice`: Tracks original purchase price (immutable for history/analytics)
- Added `listPrice`: Resale price in INR (mutable only when listing changes)
- Added `isListed`: Boolean flag for marketplace filtering (no separate mapping)
- Removed need for separate `isListed` mapping - everything in one struct

**2. EventInfo Simplification**
- ✅ Removed `active` flag (not needed - check ticketsMinted < totalTickets instead)
- ✅ Added `photoUrl`: Event poster/image stored on-chain (for metadata)
- ✅ Added `price`: Original ticket price for reference
- All event metadata queryable in single call (gas efficient)

**3. Function Organization by Section**
- **EVENT MANAGEMENT**: createEvent, updateEventMetadata, getEvent
- **TICKET ISSUANCE**: mintTicket, getUserTickets, getTicketInfo
- **RESALE MARKETPLACE**: listForResale, cancelListing, **updateListPrice** (NEW), buyResale, getListedTokens
- **GATE OPERATIONS**: markUsed
- **SECURITY**: _update override, _removeUserTicket, _removeListed

**4. New Function: updateListPrice**
- Allows sellers to adjust resale price without re-listing
- Emits event for off-chain indexing
- Only works on listed tickets

**5. Events for Better Indexing**
- `EventMetadataUpdated`: Track photo URL changes
- `TicketListed`, `TicketUnlisted`: Marketplace activity
- `TicketListPriceUpdated`: Price changes (old → new)
- `TicketResold`: Resale completions with price
- `TicketUsed`: Gate scanning

### Benefits of This Design
- ✅ All data on-chain and immutable
- ✅ No database for core functionality (OTP uses crypto only)
- ✅ Gas efficient (single struct reads vs multiple mappings)
- ✅ Clear audit trail (events for all state changes)
- ✅ Resale pricing flexible and traceable
- ✅ Well-organized by functional area

### Contract Statistics
- **Structs**: 2 (EventInfo, TicketInfo)
- **Mappings**: 4 (events, tickets, userTickets, usedCommitments)
- **Arrays**: 1 (listedTokens)
- **External Functions**: 19 (createEvent, updateEventMetadata, getEvent, mintTicket, getTicketInfo, getUserTickets, listForResale, cancelListing, updateListPrice, getListedTokens, buyResale, markUsed)
- **Internal Functions**: 4 (_removeListed, _removeUserTicket, _update, _transfer)
- **Events**: 8

---

## 3) IMPLEMENTATION PLAN

### Architecture Overview
- **Smart Contract**: All ticket and resale metadata stored on-chain (no database needed)
- **OTP**: Cryptographic verification using HMAC-SHA256 time-windows (no database needed)
- **Storage**: Only resale listing metadata stored in database if needed for analytics/history

### Key Updates from Previous Version
- `TicketInfo` struct now includes `salePrice`, `isListed`, and `listPrice`
- `EventInfo` includes `photoUrl` and `price`, removes `active` flag
- New `updateListPrice()` function for flexible resale pricing
- Better organized functions by concern
- Comprehensive event emissions for indexing

---

### 3.1 UPDATE: GET /api/tickets/my-tickets

**Function:** Fetch user tickets via contract (no event scan)

**Request:**
```
(authenticated via JWT)
```

**Logic:**
```
wallet = req.user.wallet_address
ids = contract.getUserTickets(wallet)
for each id:
  ticket = getTicketInfo(id)
  event = getEvent(ticket.eventId)
return combined array
```

**Response:**
```json
{
  "success": true,
  "tickets": [
    {
      "tokenId": 1,
      "eventId": 1,
      "used": false,
      "isListed": false,
      "listPrice": 0,
      "event": {
        "eventId": 1,
        "title": "Concert 2026",
        "venue": "Madison Square Garden",
        "date": 1715000000,
        "price": 1000,
        "photoUrl": "https://example.com/event1.jpg",
        "totalTickets": 1000,
        "ticketsMinted": 500
      }
    }
  ]
}
```

---

### 3.2 GET /api/tickets/marketplace

**Function:** Fetch all listed resale tickets with pricing

**Request:**
```
(no body, optional auth)
```

**Logic:**
```
ids = contract.getListedTokens()
for each id:
  ticket = getTicketInfo(id)
  event = getEvent(ticket.eventId)
  if ticket.isListed and ticket.listPrice > 0:
    add to results
return marketplace array
```

**Response:**
```json
{
  "success": true,
  "tickets": [
    {
      "tokenId": 1,
      "eventId": 1,
      "used": false,
      "isListed": true,
      "listPrice": 500,
      "salePrice": 1000,
      "event": {
        "eventId": 1,
        "title": "Concert 2026",
        "venue": "Madison Square Garden",
        "date": 1715000000,
        "price": 1000,
        "photoUrl": "https://example.com/event1.jpg",
        "totalTickets": 1000,
        "ticketsMinted": 500
      }
    }
  ]
}
```

---

### 3.3 POST /api/tickets/list

**Function:** List ticket for resale with price

**Body:**
```json
{
  "token_id": 1,
  "price": 500
}
```

**Logic:**
```
validate: user owns token_id
validate: price > 0
validate: ticket not already used
contract.listForResale(token_id, price)
return tx_hash
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket listed for resale",
  "tx_hash": "0x...",
  "token_id": 1,
  "price": 500
}
```

**Error Cases:**
- Token not found: 404
- User not token owner: 403
- Token already used: 400
- Price is 0 or negative: 400
- Transaction failed: 502

---

### 3.4 POST /api/tickets/update-list-price

**Function:** Update resale price without re-listing

**Body:**
```json
{
  "token_id": 1,
  "new_price": 600
}
```

**Logic:**
```
validate: user owns token_id
validate: ticket is listed
validate: new_price > 0
contract.updateListPrice(token_id, new_price)
return tx_hash
```

**Response:**
```json
{
  "success": true,
  "message": "Price updated successfully",
  "tx_hash": "0x...",
  "token_id": 1,
  "old_price": 500,
  "new_price": 600
}
```

**Error Cases:**
- Token not found: 404
- User not token owner: 403
- Ticket not listed: 400
- Price is 0 or negative: 400
- Transaction failed: 502

---

### 3.5 POST /api/tickets/cancel-listing

**Function:** Cancel resale listing

**Body:**
```json
{
  "token_id": 1
}
```

**Logic:**
```
validate: user owns token_id
validate: ticket is listed
contract.cancelListing(token_id)
return tx_hash
```

**Response:**
```json
{
  "success": true,
  "message": "Listing cancelled",
  "tx_hash": "0x...",
  "token_id": 1
}
```

**Error Cases:**
- Token not found: 404
- User not token owner: 403
- Ticket not listed: 400
- Transaction failed: 502

---

### 3.6 POST /api/tickets/buy-resale/request

**Function:** Request OTP to buy resale ticket (Step 1)

**Body:**
```json
{
  "token_id": 1,
  "buyer_identity": "123456789012"
}
```

**Validation:**
```
- User is authenticated (JWT)
- Token exists on blockchain
- Token is listed for resale
- Token is not already used
- Buyer identity exists in database
- Buyer identity is verified/valid
```

**Logic:**
```
fetch token from contract
verify token.isListed == true
verify token.used == false
fetch buyer identity from database
generate OTP = createResaleOtp(token_id, buyer_identity)
send OTP to buyer's registered phone via SMS
return success
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to registered phone number",
  "expires_in_minutes": 10,
  "token_id": 1
}
```

**Error Cases:**
- Unauthenticated: 401
- Token not found: 404
- Token not listed: 400
- Token already used: 400
- Identity not found: 404
- Identity not verified: 400
- SMS send failed: 502

---

### 3.7 POST /api/tickets/buy-resale/confirm

**Function:** Confirm resale purchase with OTP (Step 2)

**Body:**
```json
{
  "token_id": 1,
  "buyer_identity": "123456789012",
  "otp": "123456"
}
```

**Validation:**
```
- User is authenticated (JWT)
- Token exists and is listed
- Buyer identity exists and matches JWT user
- OTP is valid (cryptographically verified)
- OTP is not expired (within 10-minute window)
- Ticket commitment is unique (not in usedCommitments)
```

**Logic:**
```
verify OTP cryptographically:
  otp_calc = createResaleOtp(token_id, buyer_identity)
  if otp_calc != submitted_otp:
    return 401 error

fetch token from contract
verify token.isListed == true
verify token.used == false
verify identity not already used (usedCommitments check)

create new commitment:
  secret = process.env.OTP_SECRET || JWT_SECRET
  newCommitment = keccak256(secret + buyer_identity + token.eventId)

execute blockchain transaction:
  tx = contract.buyResale(token_id, buyer_wallet, newCommitment)
  wait for confirmation

return success with tx_hash
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket purchased successfully",
  "token_id": 1,
  "tx_hash": "0x...",
  "block_number": 12345678,
  "buyer_wallet": "0x...",
  "price_paid": 500
}
```

**Error Cases:**
- Unauthenticated: 401
- Invalid/expired OTP: 401
- Token not found: 404
- Token not listed: 400
- Token already used: 400
- Identity commitment already used: 400
- Blockchain transaction failed: 502

---

### 3.8 GET /api/tickets/:tokenId

**Function:** Get single ticket details with resale status

**Request:**
```
(optional auth)
```

**Logic:**
```
ticket = contract.getTicketInfo(tokenId)
event = contract.getEvent(ticket.eventId)
owner = contract.ownerOf(tokenId)
return combined data
```

**Response:**
```json
{
  "success": true,
  "token_id": 1,
  "event_id": 1,
  "used": false,
  "is_listed": true,
  "list_price": 500,
  "sale_price": 1000,
  "owner": "0x...",
  "event": {
    "eventId": 1,
    "title": "Concert 2026",
    "venue": "Madison Square Garden",
    "date": 1715000000,
    "price": 1000,
    "photoUrl": "https://example.com/event1.jpg",
    "totalTickets": 1000,
    "ticketsMinted": 500
  }
}
```

**Error Cases:**
- Token not found: 404

---

## 4) IMPLEMENTATION SUMMARY

### Phase 1: Smart Contract Update
- Update `TicketInfo` struct with `isListed`, `listPrice`, and `salePrice` fields
- Update `EventInfo` struct to remove `active`, add `photoUrl` and store `price`
- Update `createEvent()` to require photoUrl parameter
- Update `updateEventMetadata()` to update photoUrl instead of metadataURI
- Update `mintTicket()` to initialize salePrice from event price
- Add new `updateListPrice()` function for flexible resale pricing
- Update `listForResale()` to emit TicketListed event
- Update `cancelListing()` to emit TicketUnlisted event
- Update `buyResale()` to update salePrice and emit TicketResold event
- Update `markUsed()` to emit TicketUsed event
- Add comprehensive event emissions for all state changes
- Update `_update()` override with better error messages
- Deploy to testnet and verify all functions
- Update contract address in backend .env

### Phase 2: OTP Service Extension
- Add `createResaleOtp(tokenId, buyer_identity)` function
- Add `verifyResaleOtp(tokenId, buyer_identity, otp)` function
- Uses same HMAC-SHA256 time-window logic as signup OTP
- No database persistence needed

### Phase 3: Blockchain Service Update
- Update ABI with new contract functions
- Add `listForResale(tokenId, price)` wrapper
- Add `cancelListing(tokenId)` wrapper
- Add `getListedTokens()` wrapper
- Add `buyResale(tokenId, buyerAddress, newCommitment)` wrapper
- Update `getUserTickets(walletAddress)` if needed
- Test all contract interactions

### Phase 4: Backend Routes
- Add 7 new routes to `ticketsRoutes.js` (including updateListPrice)
- All routes require authentication except marketplace and get-ticket
- Routes use existing auth middleware

### Phase 5: Backend Controllers
- Update `myTickets` to include `isListed`, `listPrice`, and `salePrice` in response
- Add `listForResale` controller with price validation
- Add `updateListPrice` controller for price updates (NEW)
- Add `cancelListing` controller with ownership check
- Add `getMarketplace` controller to fetch and filter listed tickets
- Add `buyResaleRequest` controller for OTP generation and SMS
- Add `buyResaleConfirm` controller for OTP verification and blockchain call
- Add `getTicketDetails` controller for single ticket lookup

### Phase 6: Testing & Deployment
- Test each endpoint individually
- Test end-to-end resale flow
- Verify OTP generation and verification
- Verify blockchain transactions
- Deploy to production

---

## END

