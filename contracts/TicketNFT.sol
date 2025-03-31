// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721, Ownable {
    // Structure to store ticket details
    struct Ticket {
        string aadharId;      // Owner's Aadhar ID
        string pictureHash;   // Hash of the owner's picture (stored off-chain)
    }

    // Mapping to store ticket details by token ID
    mapping(uint256 => Ticket) public tickets;
    
    // Address where tickets can be sold back
    address public sellBackAddress;

    // Constructor to set the sell-back address
    constructor(address _sellBackAddress) ERC721("EventTicket", "TKT") {
        sellBackAddress = _sellBackAddress;
    }

    // Function to mint a ticket
    function mintTicket(
        address to,
        uint256 tokenId,
        string memory aadharId,
        string memory pictureHash
    ) public onlyOwner {
        _mint(to, tokenId); // Mint the NFT
        tickets[tokenId] = Ticket(aadharId, pictureHash); // Store ticket details
    }

    // Override transferFrom to restrict transfers
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        require(to == sellBackAddress, "Tickets can only be sold back to the specified address");
        super.transferFrom(from, to, tokenId);
    }

    // Override safeTransferFrom to restrict transfers
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public override {
        require(to == sellBackAddress, "Tickets can only be sold back to the specified address");
        super.safeTransferFrom(from, to, tokenId, _data);
    }
}