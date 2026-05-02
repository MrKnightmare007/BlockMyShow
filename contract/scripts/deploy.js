// Deployment script for TicketNFT contract
import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  console.log("Starting TicketNFT deployment...\n");
  
  // Get the contract factory
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  
  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log("Deploying to network:", network.name, `(chainId: ${network.chainId})`);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");
  
  // Deploy the contract
  console.log("Deploying TicketNFT...");
  const ticketNFT = await TicketNFT.deploy();
  await ticketNFT.deployed();
  
  console.log("\n✅ TicketNFT deployed successfully!");
  console.log("Contract Address:", ticketNFT.address);
  console.log("Deployer Address:", deployer.address);
  
  // Display deployment info
  console.log("\n-----------------------------------");
  console.log("📋 DEPLOYMENT INFORMATION");
  console.log("-----------------------------------");
  console.log(`CONTRACT_ADDRESS=${ticketNFT.address}`);
  console.log(`DEPLOYER_ADDRESS=${deployer.address}`);
  console.log(`NETWORK=${network.name}`);
  console.log(`CHAIN_ID=${network.chainId}`);
  
  console.log("\n📝 Update your configuration files:");
  console.log("\nBackend (.env):");
  console.log(`CONTRACT_ADDRESS=${ticketNFT.address}`);
  
  console.log("\nFrontend (config.js):");
  console.log(`export const CONTRACT_ADDRESS = "${ticketNFT.address}";`);
  console.log("-----------------------------------\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

