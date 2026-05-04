const { databases, sdk } = require('../config/appwrite')

const createIdentity = async (data) => {
  return await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_IDENTITIES_COLLECTION_ID,
    sdk.ID.unique(),
    data
  )
}

const getIdentityByHashedId = async (hashedId) => {
  const response = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_IDENTITIES_COLLECTION_ID,
    [sdk.Query.equal('hashed_identity_id', hashedId)]
  )

  return response.documents[0]
}

const checkIdentityExists = async (hashedId) => {
  const response = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_IDENTITIES_COLLECTION_ID,
    [sdk.Query.equal('hashed_identity_id', hashedId)]
  )

  return response.documents.length > 0
}

module.exports = {
  createIdentity,
  getIdentityByHashedId,
  checkIdentityExists
}
