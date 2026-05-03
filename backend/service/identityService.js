const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const IDENTITY_FILE = path.join(__dirname, '../data/identity.json')

const ensureDataDirectory = () => {
  const dataDir = path.dirname(IDENTITY_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

const loadIdentities = () => {
  ensureDataDirectory()
  if (!fs.existsSync(IDENTITY_FILE)) {
    fs.writeFileSync(IDENTITY_FILE, JSON.stringify([]))
    return []
  }
  const data = fs.readFileSync(IDENTITY_FILE, 'utf-8')
  return JSON.parse(data)
}

const saveIdentities = (identities) => {
  ensureDataDirectory()
  fs.writeFileSync(IDENTITY_FILE, JSON.stringify(identities, null, 2))
}

const hashIdentity = (identity_id) => {
  return crypto.createHash('sha256').update(identity_id).digest('hex')
}

const addIdentity = (identity_id, phone_number, name, profile_photo_url) => {
  const identities = loadIdentities()
  const hashedId = hashIdentity(identity_id)

  // Check if identity already exists
  const exists = identities.find(i => i.hashed_identity_id === hashedId)
  if (exists) {
    throw new Error('Identity already exists')
  }

  const newIdentity = {
    hashed_identity_id: hashedId,
    phone_number,
    name,
    profile_photo_url
  }

  identities.push(newIdentity)
  saveIdentities(identities)

  return newIdentity
}

const getIdentityByHashedId = (hashedId) => {
  const identities = loadIdentities()
  return identities.find(i => i.hashed_identity_id === hashedId)
}

const getIdentityByRawId = (identity_id) => {
  const hashedId = hashIdentity(identity_id)
  return getIdentityByHashedId(hashedId)
}

module.exports = {
  addIdentity,
  getIdentityByHashedId,
  getIdentityByRawId,
  hashIdentity,
  loadIdentities
}
