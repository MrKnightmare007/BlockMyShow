const { databases, sdk } = require('../config/appwrite')

const getAdminByUsername = async (username) => {

  const response = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_ADMINS_COLLECTION_ID,
    [sdk.Query.equal('username', username)]
  )

  return response.documents[0]
}

module.exports = {
  getAdminByUsername
}
