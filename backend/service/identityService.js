const crypto = require('crypto')
const {
  createIdentity,
  getIdentityByHashedId: getIdentityByHashedIdFromDB,
  checkIdentityExists
} = require('../models/identityModel')

const hashIdentity = (identity_id) => {
  return crypto.createHash('sha256').update(identity_id).digest('hex')
}

const addIdentity = async (identity_id, phone_number, name, profile_photo_url) => {
  const hashedId = hashIdentity(identity_id)

  // Check if identity already exists
  const exists = await checkIdentityExists(hashedId)
  if (exists) {
    throw new Error('Identity already exists')
  }

  const newIdentity = {
    hashed_identity_id: hashedId,
    phone_number,
    name,
    profile_photo_url
  }

  return await createIdentity(newIdentity)
}

const getIdentityByHashedId = async (hashedId) => {
  return await getIdentityByHashedIdFromDB(hashedId)
}

const getIdentityByRawId = async (identity_id) => {
  const hashedId = hashIdentity(identity_id)
  return await getIdentityByHashedId(hashedId)
}

module.exports = {
  addIdentity,
  getIdentityByHashedId,
  getIdentityByRawId,
  hashIdentity
}
