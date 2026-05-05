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
     * @param photoUrl Event poster/image URL (optional)
     * @param totalTickets Maximum tickets for event
     * @param ticketsMinted Current minted count
     */
    struct EventInfo {
        uint256 eventId;
        string  title;
        string  venue;
        uint256 date;
        uint256 price;
        string  photoUrl;
        uint256 totalTickets;
        uint256 ticketsMinted;
    }

    /**
     * @dev Ticket metadata stored on-chain
     * @param eventId Which event this ticket is for
     * @param commitment Hash for identity validation
     * @param used Whether ticket has been scanned/used at gate
     * @param isListed Whether ticket is listed for resale
     * @param listPrice Resale price in INR (0 if not listed)
     * @param salePrice Original sale price paid
     */
    struct TicketInfo {
        uint256 eventId;
        bytes32 commitment;
        bool    used;
        bool    isListed;
        uint256 listPrice;
        uint256 salePrice;
    }

    // ────── STORAGE ──────

    mapping(uint256 => EventInfo)  public events;
    mapping(uint256 => TicketInfo) public tickets;
    mapping(address => uint256[])  private userTickets;
    mapping(bytes32 => bool)       public usedCommitments;
    uint256[]                      public listedTokens;

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
    // ║                     EVENT MANAGEMENT                        ║
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Create new event (owner only)
     * @param title Event name
     * @param venue Event location
     * @param date Event timestamp (unix)
     * @param price Ticket price in INR
     * @param photoUrl Event poster URL (optional)
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
    // ║                   TICKET ISSUANCE                           ║
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Mint initial ticket to user (owner/backend only)
     * @param to Recipient wallet address
     * @param eventId Event for the ticket
     * @param commitment Identity hash
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
            salePrice:  ev.price
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
    // ║                   RESALE MARKETPLACE                        ║
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice List ticket for resale
     * @param tokenId Token to list
     * @param price Resale price in INR
     */
    function listForResale(uint256 tokenId, uint256 price) external onlyOwner{
        require(tokenId < nextTokenId,           "Ticket not found");
        require(!tickets[tokenId].used,          "Ticket already used");
        require(price > 0,                       "Price must be > 0");
        // require(price<tickets[tokenId].salePrice, "Price must be less than original sale price");
        tickets[tokenId].isListed = true;
        tickets[tokenId].listPrice = price;
        listedTokens.push(tokenId);

        emit TicketListed(tokenId, price);
    }

    /**
     * @notice Cancel resale listing
     * @param tokenId Token to unlist
     */
    function cancelListing(uint256 tokenId) external onlyOwner{
        require(tokenId < nextTokenId,           "Ticket not found");
        // require(ownerOf(tokenId) == msg.sender,  "Not ticket owner");
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
    function updateListPrice(uint256 tokenId, uint256 newPrice) external onlyOwner{
        require(tokenId < nextTokenId,           "Ticket not found");
        // require(ownerOf(tokenId) == msg.sender,  "Not ticket owner");
        require(tickets[tokenId].isListed,       "Ticket not listed");
        require(newPrice > 0,                    "Price must be > 0");
        // require(newPrice < tickets[tokenId].salePrice, "Price must be less than original sale price");
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

        tickets[tokenId].commitment = newCommitment;
        tickets[tokenId].isListed = false;
        tickets[tokenId].listPrice = 0;
        tickets[tokenId].salePrice = salePrice;

        _removeListed(tokenId);
        usedCommitments[newCommitment] = true;

        emit TicketResold(tokenId, buyer, salePrice);
    }

    // ═══════════════════════════════════════════════════════════════
    // ║                    GATE OPERATIONS                          ║
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Mark ticket as used at event gate (owner/gate staff only)
     * @param tokenId Token to mark used
     * @param commitment Must match stored commitment
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
    // ║               TRANSFER CONTROL & SECURITY                   ║
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

        if (from == address(0)) return from;

        require(
            tickets[tokenId].isListed,
            "Transfers disabled - list ticket for resale first"
        );

        return from;
    }
}