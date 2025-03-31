require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.17",
  networks: {
    // For local development with Ganache
    ganache: {
      url: "http://127.0.0.1:7545", // Default Ganache GUI URL
      accounts: [
        "0x45f4e03bee66c4107fcd061444ab3b8bf95b76755fd4cd094c86c1910e407c69", // Replace with the private key you copied from Ganache
      ]
    },
    // For Sepolia testnet - commented out until you have a valid private key
    /* 
    sepolia: {
      url: "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID",
      accounts: ["YOUR_PRIVATE_KEY"],
    },
    */
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};