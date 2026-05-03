// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721, Ownable {

    uint256 public nextTokenId;
    uint256 public nextEventId;

    struct EventInfo {
        uint256 eventId;
        string  title;
        string  venue;
        uint256 date;
        uint256 price;         // in rupees (off-chain reference only)
        uint256 totalTickets;
        uint256 ticketsMinted;
        string  metadataURI;
    }

    struct TicketInfo {
        uint256 eventId;
        bytes32 commitment;
        bool    used;
    }

    mapping(uint256 => EventInfo)  public events;
    mapping(uint256 => TicketInfo) public tickets;

    event EventCreated(
        uint256 indexed eventId,
        string  title,
        uint256 date,
        uint256 totalTickets
    );
    event MetadataUpdated(uint256 indexed eventId, string newURI);
    event TicketMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint256 indexed eventId,
        bytes32 commitment
    );
    event TicketUsed(uint256 indexed tokenId);

    constructor(address initialOwner)
        ERC721("ProofPass", "PPASS")
        Ownable(initialOwner)
    {}

    // ── Events ───────────────────────────────────────────────

    function createEvent(
        string memory title,
        string memory venue,
        uint256 date,
        uint256 price,
        uint256 totalTickets,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        require(bytes(title).length > 0,  "Title required");
        require(bytes(venue).length > 0,  "Venue required");
        require(date > block.timestamp,   "Date must be in the future");
        require(totalTickets > 0,         "Need at least 1 ticket");

        uint256 eventId = nextEventId++;

        events[eventId] = EventInfo({
            eventId:       eventId,
            title:         title,
            venue:         venue,
            date:          date,
            price:         price,
            totalTickets:  totalTickets,
            ticketsMinted: 0,
            metadataURI:   metadataURI
        });

        emit EventCreated(eventId, title, date, totalTickets);
        return eventId;
    }

    function updateEventMetadata(uint256 eventId, string memory newURI)
        external
        onlyOwner
    {
        require(eventId < nextEventId, "Event does not exist");
        events[eventId].metadataURI = newURI;
        emit MetadataUpdated(eventId, newURI);
    }

    function getEvent(uint256 eventId)
        external
        view
        returns (EventInfo memory)
    {
        require(eventId < nextEventId, "Event does not exist");
        return events[eventId];
    }

    // ── Tickets ──────────────────────────────────────────────

    function mintTicket(
        address to,
        uint256 eventId,
        bytes32 commitment
    ) external onlyOwner returns (uint256) {
        require(to != address(0),               "Invalid recipient address");
        require(commitment != bytes32(0),       "Invalid commitment");
        require(eventId < nextEventId,          "Event does not exist");

        EventInfo storage ev = events[eventId];
        require(ev.ticketsMinted < ev.totalTickets, "Event is sold out");

        uint256 tokenId = nextTokenId++;
        ev.ticketsMinted++;

        _safeMint(to, tokenId);

        tickets[tokenId] = TicketInfo({
            eventId:    eventId,
            commitment: commitment,
            used:       false
        });

        emit TicketMinted(tokenId, to, eventId, commitment);
        return tokenId;
    }

    function markUsed(uint256 tokenId, bytes32 commitment)
        external
        onlyOwner
    {
        require(tokenId < nextTokenId,                         "Ticket does not exist");
        require(!tickets[tokenId].used,                        "Ticket already used");
        require(tickets[tokenId].commitment == commitment,     "Commitment mismatch");
        tickets[tokenId].used = true;
        emit TicketUsed(tokenId);
    }

    function getTicketInfo(uint256 tokenId)
        external
        view
        returns (TicketInfo memory)
    {
        require(tokenId < nextTokenId, "Ticket does not exist");
        return tickets[tokenId];
    }

    // ── Metadata ─────────────────────────────────────────────

    /// @notice Returns the event's metadataURI for the ticket's event
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(tokenId < nextTokenId, "Ticket does not exist");
        return events[tickets[tokenId].eventId].metadataURI;
    }

    // ── Non-transferable (OZ v5) ──────────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        require(from == address(0), "Tickets are non-transferable");
        return super._update(to, tokenId, auth);
    }
}