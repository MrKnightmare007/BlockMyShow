const { databases, sdk } = require('../config/appwrite')

const createUser = async (data) => {

  return await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_USERS_COLLECTION_ID,
    sdk.ID.unique(),
    data
  )
}

const getUserByEmail = async (email) => {

  const response = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_USERS_COLLECTION_ID,
    [sdk.Query.equal('email', email)]
  )

  return response.documents[0]
}

const getUserByWallet = async (walletAddress) => {
  const response = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_USERS_COLLECTION_ID,
    [sdk.Query.equal('wallet_address', walletAddress)]
  )

  return response.documents[0]
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserByWallet
}