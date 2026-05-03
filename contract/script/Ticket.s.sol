// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TicketNFT} from "../src/Ticket.sol";

contract TicketScript is Script {
    TicketNFT public ticket;

    function setUp() public {}

    function run() public {
        string memory privateKey = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(_withHexPrefix(privateKey));
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        ticket = new TicketNFT(deployer);

        vm.stopBroadcast();

        console.log("TicketNFT deployed at:", address(ticket));
        console.log("Initial owner:", deployer);
    }

    function _withHexPrefix(string memory value) private pure returns (string memory) {
        bytes memory raw = bytes(value);
        if (raw.length >= 2 && raw[0] == "0" && (raw[1] == "x" || raw[1] == "X")) {
            return value;
        }
        return string.concat("0x", value);
    }
}
