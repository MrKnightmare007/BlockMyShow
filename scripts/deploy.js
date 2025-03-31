// Import hardhat as a CommonJS module in an ES module environment
import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  // Get the contract factory
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  
  // Get the first account as the deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Set the sell-back address (using the deployer address for this example)
  const sellBackAddress = deployer.address;
  
  // Deploy the contract
  const ticketNFT = await TicketNFT.deploy(sellBackAddress);
  await ticketNFT.deployed();
  
  console.log("TicketNFT deployed to:", ticketNFT.address);
  console.log("SellBack address set to:", sellBackAddress);
  
  console.log("\n-----------------------------------");
  console.log("Update your config.js file with this contract address:");
  console.log(`export const CONTRACT_ADDRESS = "${ticketNFT.address}";`);
  console.log("-----------------------------------\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });