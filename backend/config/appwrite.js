const sdk = require('node-appwrite')
require('./env')

const client = new sdk.Client()

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const databases = new sdk.Databases(client)

module.exports = {
  sdk,
  databases
}
