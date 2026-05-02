// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TicketNFT
 * @author ProofPass Team
 * @dev Identity-bound, non-transferable NFT ticketing contract.
 *      - Events are registered on-chain with capacity enforcement.
 *      - Each ticket is minted as an ERC-721 NFT bound to a ZK commitment.
 *      - Transfers are permanently disabled (soulbound).
 *      - Compatible with OpenZeppelin v4.9+.
 */
contract TicketNFT is ERC721, Ownable {

    // ─────────────────────────────────────────────
    //  State
    // ─────────────────────────────────────────────

    uint256 public nextTokenId;
    uint256 public nextEventId;

    // ─────────────────────────────────────────────
    //  Structs
    // ─────────────────────────────────────────────

    /**
     * @dev Represents an event registered on-chain.
     * @param eventId       Auto-incremented unique event identifier.
     * @param title         Human-readable event name.
     * @param venue         Location string (city / venue name).
     * @param date          Unix timestamp of the event date.
     * @param price         Ticket price in paise (₹1 = 100 paise).
     * @param totalTickets  Maximum number of tickets that can be minted.
     * @param ticketsMinted Running count of tickets minted so far.
     * @param organizer     Wallet address of the event organiser.
     * @param metadataURI   IPFS CID / URI pointing to full event metadata (banner, description).
     * @param active        False if the event has been cancelled.
     */
    struct EventInfo {
        uint256 eventId;
        string  title;
        string  venue;
        uint256 date;
        uint256 price;
        uint256 totalTickets;
        uint256 ticketsMinted;
        address organizer;
        string  metadataURI;
        bool    active;
    }

    /**
     * @dev Represents a single ticket NFT.
     * @param eventId       The event this ticket belongs to.
     * @param commitment    ZK-inspired commitment: SHA-256(secret + ticketId + identityHash).
     *                      Allows identity verification without exposing raw Aadhaar data.
     * @param used          Entry status — true means the holder has already entered.
     * @param metadataURI   IPFS URI for ticket-level metadata (seat, QR hint, event ref).
     */
    struct TicketInfo {
        uint256 eventId;
        bytes32 commitment;
        bool    used;
        string  metadataURI;
    }

    // ─────────────────────────────────────────────
    //  Storage
    // ─────────────────────────────────────────────

    /// @dev eventId → EventInfo
    mapping(uint256 => EventInfo) public events;

    /// @dev tokenId → TicketInfo
    mapping(uint256 => TicketInfo) public tickets;

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        string  title,
        uint256 date,
        uint256 totalTickets
    );

    event EventCancelled(uint256 indexed eventId);

    event TicketMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint256 indexed eventId,
        bytes32 commitment
    );

    event TicketUsed(uint256 indexed tokenId);

    // ─────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────

    /**
     * @dev Constructor initializes ERC721 and Ownable.
     *      msg.sender (deployer) becomes the contract owner.
     */
    constructor() ERC721("ProofPass", "PPASS") {}

    // ─────────────────────────────────────────────
    //  Event Management
    // ─────────────────────────────────────────────

    /**
     * @notice Register a new event on-chain.
     * @dev Only the contract owner (backend wallet) can call this.
     *      Event IDs start at 0 and auto-increment.
     * @param title         Name of the event.
     * @param venue         Location of the event.
     * @param date          Unix timestamp — must be in the future.
     * @param price         Ticket price in paise.
     * @param totalTickets  Hard capacity limit enforced by this contract.
     * @param metadataURI   IPFS URI for the event banner and full metadata.
     * @return eventId      The newly assigned event ID.
     */
    function createEvent(
        string memory title,
        string memory venue,
        uint256 date,
        uint256 price,
        uint256 totalTickets,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        require(bytes(title).length > 0,        "Title required");
        require(bytes(venue).length > 0,        "Venue required");
        require(date > block.timestamp,         "Event date must be in the future");
        require(totalTickets > 0,               "Must allow at least one ticket");
        require(bytes(metadataURI).length > 0,  "Metadata URI required");

        uint256 eventId = nextEventId++;

        events[eventId] = EventInfo({
            eventId:       eventId,
            title:         title,
            venue:         venue,
            date:          date,
            price:         price,
            totalTickets:  totalTickets,
            ticketsMinted: 0,
            organizer:     msg.sender,
            metadataURI:   metadataURI,
            active:        true
        });

        emit EventCreated(eventId, msg.sender, title, date, totalTickets);
        return eventId;
    }

    /**
     * @notice Cancel an event (sets active = false, stops further minting).
     * @dev Does not burn existing tickets — refund logic is handled off-chain.
     * @param eventId  ID of the event to cancel.
     */
    function cancelEvent(uint256 eventId) external onlyOwner {
        require(events[eventId].active, "Event already inactive or does not exist");
        events[eventId].active = false;
        emit EventCancelled(eventId);
    }

    /**
     * @notice Read full event info.
     * @param eventId  ID of the event.
     * @return EventInfo struct.
     */
    function getEvent(uint256 eventId) external view returns (EventInfo memory) {
        require(eventId < nextEventId, "Event does not exist");
        return events[eventId];
    }

    /**
     * @notice Check how many tickets remain for an event.
     * @param eventId  ID of the event.
     * @return Remaining ticket count.
     */
    function remainingTickets(uint256 eventId) external view returns (uint256) {
        require(eventId < nextEventId, "Event does not exist");
        EventInfo storage ev = events[eventId];
        return ev.totalTickets - ev.ticketsMinted;
    }

    // ─────────────────────────────────────────────
    //  Ticket Minting
    // ─────────────────────────────────────────────

    /**
     * @notice Mint a non-transferable ticket NFT for a verified buyer.
     * @dev Called by the backend after:
     *        1. Aadhaar OTP verification passes.
     *        2. Razorpay payment webhook confirms payment.
     *      Capacity is enforced on-chain — the backend cannot over-mint.
     * @param to           Wallet address of the ticket holder (auto-generated by backend).
     * @param eventId      ID of the event to mint for.
     * @param commitment   ZK commitment: keccak256 / SHA-256(secret + ticketId + identityHash).
     * @param metadataURI  IPFS URI for ticket-level metadata.
     * @return tokenId     The newly minted token ID.
     */
    function mintTicket(
        address to,
        uint256 eventId,
        bytes32 commitment,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        require(to != address(0),               "Invalid recipient address");
        require(commitment != bytes32(0),       "Invalid commitment");
        require(bytes(metadataURI).length > 0,  "Invalid metadata URI");

        EventInfo storage ev = events[eventId];
        require(eventId < nextEventId,          "Event does not exist");
        require(ev.active,                      "Event is not active");
        require(ev.ticketsMinted < ev.totalTickets, "Event is sold out");

        uint256 tokenId = nextTokenId++;
        ev.ticketsMinted++;

        _safeMint(to, tokenId);

        tickets[tokenId] = TicketInfo({
            eventId:     eventId,
            commitment:  commitment,
            used:        false,
            metadataURI: metadataURI
        });

        emit TicketMinted(tokenId, to, eventId, commitment);
        return tokenId;
    }

    // ─────────────────────────────────────────────
    //  Gate Verification
    // ─────────────────────────────────────────────

    /**
     * @notice Mark a ticket as used after successful gate verification.
     * @dev Called by the backend after:
     *        1. QR scanned.
     *        2. Aadhaar re-entered.
     *        3. OTP verified.
     *        4. Commitment matches.
     *        5. Face check passed.
     *      Reverts if ticket is already used — prevents double entry.
     * @param tokenId  ID of the ticket to mark used.
     */
    function markUsed(uint256 tokenId) external onlyOwner {
        require(tokenId < nextTokenId,       "Ticket does not exist");
        require(!tickets[tokenId].used,      "Ticket already used");

        tickets[tokenId].used = true;
        emit TicketUsed(tokenId);
    }

    /**
     * @notice Verify a commitment matches what is stored on-chain.
     * @dev The backend calls this to confirm the ZK commitment during gate check.
     *      Returns false instead of reverting so the gate app can handle the response gracefully.
     * @param tokenId     ID of the ticket.
     * @param commitment  Commitment to verify against stored value.
     * @return True if commitments match and ticket is not yet used.
     */
    function verifyCommitment(
        uint256 tokenId,
        bytes32 commitment
    ) external view returns (bool) {
        if (tokenId >= nextTokenId) return false;
        TicketInfo memory t = tickets[tokenId];
        return (t.commitment == commitment && !t.used);
    }

    // ─────────────────────────────────────────────
    //  Read Helpers
    // ─────────────────────────────────────────────

    /**
     * @notice Returns full ticket information.
     * @param tokenId  ID of the ticket.
     */
    function getTicketInfo(uint256 tokenId) external view returns (TicketInfo memory) {
        require(tokenId < nextTokenId, "Ticket does not exist");
        return tickets[tokenId];
    }

    /**
     * @notice Shorthand — check if a ticket has been used.
     * @param tokenId  ID of the ticket.
     */
    function isTicketUsed(uint256 tokenId) external view returns (bool) {
        require(tokenId < nextTokenId, "Ticket does not exist");
        return tickets[tokenId].used;
    }

    // ─────────────────────────────────────────────
    //  ERC-721 Overrides
    // ─────────────────────────────────────────────

    /**
     * @dev Returns the IPFS metadata URI for a given token.
     *      Overrides the default ERC-721 tokenURI so wallets and explorers
     *      can display ticket metadata correctly.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId < nextTokenId, "Ticket does not exist");
        return tickets[tokenId].metadataURI;
    }

    /**
     * @dev Blocks all transfers except minting (from == address(0)).
     *      This makes tickets soulbound — identity stays with the original buyer.
     *      Uses the _beforeTokenTransfer hook (OZ v4 compatible).
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        require(from == address(0), "Tickets are non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}