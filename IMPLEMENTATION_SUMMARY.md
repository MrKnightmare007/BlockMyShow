# Ticket Resale System Implementation Summary

## ✅ Completed Phases

### Phase 1: Smart Contract Update ✅
**File**: `contract/src/Ticket.sol`
- Replaced TicketNFT with optimized **ProofPass** contract
- **New Features**:
  - `mintTicket()` - Issues initial tickets with salePrice tracking
  - `listForResale(tokenId, price)` - Users list tickets for resale
  - `cancelListing(tokenId)` - Unlist tickets
  - `updateListPrice(tokenId, newPrice)` - Adjust resale price without relisting
  - `buyResale(tokenId, buyer, newCommitment)` - Complete resale transactions
  - `getListedTokens()` - Fetch marketplace inventory
  - `getUserTickets(user)` - Query user's tickets
- **Enhanced Data Structure**:
  - TicketInfo: Added `isListed`, `listPrice`, `salePrice`
  - EventInfo: Replaced `metadataURI` with `photoUrl` (optional), added `price` field
- **Key Detail**: `photoUrl` is now optional in `createEvent()`
- **Events**: 8 comprehensive events for state tracking (EventCreated, TicketMinted, TicketListed, TicketUnlisted, TicketListPriceUpdated, TicketResold, TicketUsed, EventMetadataUpdated)

### Phase 2: OTP Service Extension ✅
**File**: `backend/service/otpService.js`
- Added `createResaleOtp(tokenId, buyer_identity)` function
- Added `verifyResaleOtp(tokenId, buyer_identity, otp)` function
- Uses existing HMAC-SHA256 time-window pattern (10-minute windows)
- **No database persistence** - purely cryptographic verification
- Accepts current and previous time windows for clock skew tolerance

### Phase 3: Blockchain Service Update ✅
**File**: `backend/service/blockchainService.js`
- Updated contract ABI for ProofPass (includes all 8 events + new functions)
- Added 5 new wrapper functions:
  - `getListedTokens()` - Fetch all listed token IDs
  - `listForResale(tokenId, price)` - List ticket
  - `cancelListing(tokenId)` - Unlist ticket
  - `updateListPrice(tokenId, newPrice)` - Update price
  - `buyResale(tokenId, buyerAddress, newCommitment)` - Complete resale
- All functions include logging, error handling, and transaction receipt parsing

### Phase 4: Backend Routes ✅
**File**: `backend/routes/ticketsRoutes.js`
- Added 7 new routes for resale marketplace:
  1. `POST /list` (auth required) - List ticket for resale
  2. `POST /update-list-price` (auth required) - Update resale price
  3. `POST /cancel-listing` (auth required) - Cancel resale listing
  4. `GET /marketplace` (public) - View all listed tickets
  5. `POST /buy-resale/request` (auth required) - Request OTP for purchase
  6. `POST /buy-resale/confirm` (auth required) - Confirm purchase with OTP
  7. `GET /:tokenId` (public) - Get single ticket details
- Existing routes preserved: /request, /confirm, /my-tickets

### Phase 5: Backend Controllers ✅
**File**: `backend/controllers/ticketsController.js`
- Added 7 new controller functions with full validation:

#### 1. `listForResale` 
- Validates token ownership, price > 0, ticket not used
- Calls blockchain service to list ticket
- Returns tx_hash

#### 2. `updateListPrice`
- Validates ticket is listed, new price > 0
- Updates listing price without relisting
- Returns old and new prices

#### 3. `cancelListing`
- Validates ticket is listed
- Removes from marketplace
- Returns tx_hash

#### 4. `getMarketplace`
- Fetches all listed tokens from blockchain
- Returns marketplace with full ticket + event details
- Includes price, event info, and metadata

#### 5. `buyResaleRequest` (Step 1)
- Validates token is listed, not used
- Verifies buyer identity exists and is verified
- Generates OTP using createResaleOtp()
- Sends OTP via SMS
- Returns expiration time

#### 6. `buyResaleConfirm` (Step 2)
- Validates OTP using verifyResaleOtp()
- Verifies ticket still available
- Creates new commitment hash for buyer
- Executes buyResale() on blockchain
- Returns tx_hash and block_number

#### 7. `getTicketDetails`
- Fetches single ticket info from blockchain
- Returns ticket status + full event details
- Includes listing status and pricing info

---

## 📊 Implementation Statistics

### Changes Made
| File | Insertions | Deletions | Net Change |
|------|-----------|----------|-----------|
| Ticket.sol | 380 | 175 | +205 |
| otpService.js | 34 | 4 | +30 |
| blockchainService.js | 255 | 0 | +255 |
| ticketsRoutes.js | 33 | 4 | +29 |
| ticketsController.js | 522 | 1 | +521 |
| **TOTAL** | **1,224** | **184** | **+1,040** |

### Contract Functions
- **Read Functions**: 4 (getEvent, getTicketInfo, getUserTickets, getListedTokens)
- **Write Functions**: 9 (createEvent, updateEventMetadata, mintTicket, listForResale, cancelListing, updateListPrice, buyResale, markUsed)
- **Events**: 8
- **Structs**: 2 (EventInfo, TicketInfo - with 6 fields each)

### API Endpoints
- **Public Routes**: 2 (/marketplace, /:tokenId)
- **Auth Required Routes**: 5 (/list, /update-list-price, /cancel-listing, /buy-resale/request, /buy-resale/confirm)
- **Existing Routes**: 3 (/request, /confirm, /my-tickets - preserved)
- **Total Routes**: 10

---

## 🚀 Next Steps (Phase 6)

### 1. Deploy Smart Contract
```bash
cd contract
forge script script/Ticket.s.sol:Ticketscript --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```
- Deploy to testnet (Base, Sepolia, or Mumbai)
- Capture deployed contract address

### 2. Update Environment Variables
```bash
# In backend/.env
CONTRACT_ADDRESS=0x...  # From deployment
PRIVATE_KEY=0x...
RPC_URL=...
OTP_WINDOW_MS=600000    # 10 minutes
```

### 3. Testing Checklist
- [ ] Deploy contract to testnet
- [ ] Test `/api/tickets/marketplace` - returns empty initially
- [ ] Test `/api/tickets/list` - list a test ticket
- [ ] Test `/api/tickets/marketplace` - verify listing appears
- [ ] Test `/api/tickets/update-list-price` - update price
- [ ] Test `/api/tickets/buy-resale/request` - get OTP
- [ ] Test `/api/tickets/buy-resale/confirm` - complete purchase
- [ ] Test `/api/tickets/:tokenId` - verify ownership transferred
- [ ] Test OTP expiration (after 10 minutes)

### 4. Production Deployment
- Deploy contract to mainnet with proper security audits
- Update CONTRACT_ADDRESS in production .env
- Deploy backend code
- Monitor transaction costs and optimize if needed

---

## 📝 Key Design Decisions

1. **photoUrl Optional**: Event creators don't need to provide photo URL during creation
2. **No Database for OTP**: Uses cryptographic time-windows - same as signup OTP
3. **On-Chain State**: All ticket metadata stored on-chain (no off-chain DB queries for core data)
4. **Commitment Reuse Prevention**: `usedCommitments` mapping prevents identity reuse
5. **Flexible Resale Pricing**: New `updateListPrice()` function allows price adjustments without relisting
6. **Two-Step Resale**: Request (OTP generation) → Confirm (OTP validation + blockchain execution)

---

## ⚠️ Important Notes

- All resale functions assume backend/owner controls wallet for blockchain execution
- OTP window is 10 minutes by default (configurable via OTP_WINDOW_MS)
- `photoUrl` must be full URL (IPFS, CDN, or HTTPS)
- Tickets are non-transferable except during resale (when listed)
- Identity verification required for buyers during resale purchase

---

## Git Status
All changes ready for commit:
```bash
git add -A
git commit -m "feat: implement ticket resale system with ProofPass contract and 2-step OTP verification"
git push origin feature-anubhab
```
