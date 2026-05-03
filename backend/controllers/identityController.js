const { addIdentity, getIdentityByRawId } = require('../service/identityService')

const addIdentityController = async (req, res) => {
  try {
    const { identity_id, phone_number, name, profile_photo_url } = req.body

    // Validate required fields
    if (!identity_id || !phone_number || !name) {
      return res.status(400).json({
        success: false,
        message: 'identity_id, phone_number, and name are required'
      })
    }

    // Validate phone number format
    if (!/^\+\d{10,15}$/.test(phone_number)) {
      return res.status(400).json({
        success: false,
        message: 'phone_number must be in E.164 format (e.g., +91XXXXXXXXXX)'
      })
    }

    // Add identity
    addIdentity(identity_id, phone_number, name, profile_photo_url || '')

    return res.status(201).json({
      success: true,
      message: 'Identity added'
    })
  } catch (err) {
    if (err.message === 'Identity already exists') {
      return res.status(409).json({
        success: false,
        message: 'Identity already exists'
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to add identity',
      error: err.message
    })
  }
}

module.exports = {
  addIdentityController
}
