const { databases, sdk } = require('../config/appwrite')

const getAdminByEmail = async (email) => {

  const response = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_ADMINS_COLLECTION_ID,
    [sdk.Query.equal('email', email)]
  )

  return response.documents[0]
}

module.exports = {
  getAdminByEmail
}