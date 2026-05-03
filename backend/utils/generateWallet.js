const { ethers } = require('ethers')

const generateWallet = () => {
  try {
    const wallet = ethers.Wallet.createRandom()

    return {
      address: wallet.address,
      publicAddress: wallet.address,
      privateKey: wallet.privateKey
    }
  } catch (error) {
    throw new Error(`Failed to generate wallet: ${error.message}`)
  }
}

module.exports = {
  generateWallet
}
