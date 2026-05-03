const { ethers } = require('ethers')
const { createSignupOtp, verifySignupOtp } = require('../service/otpService')
const { sendOtpSms } = require('../service/smsService')
const { getIdentityByHashedId, hashIdentity } = require('../service/identityService')
const { getTicketInfo, getEvent, markUsed } = require('../service/blockchainService')

const gateEntry = async (req, res) => {
  try {
    const { token_id, identity_id } = req.body

    // Validate request body
    if (!token_id || !identity_id) {
      return res.status(400).json({
        success: false,
        message: 'token_id and identity_id are required'
      })
    }

    // Get ticket info from blockchain
    let ticketInfo
    try {
      ticketInfo = await getTicketInfo(token_id)
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    // Ensure ticket hasn't been used
    if (ticketInfo.used) {
      return res.status(410).json({
        success: false,
        message: 'Ticket already used'
      })
    }

    // Hash identity and lookup
    const hashedId = hashIdentity(identity_id)
    const identity = getIdentityByHashedId(hashedId)
    
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Identity not found'
      })
    }

    // Verify commitment matches
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET
    const expectedCommitment = ethers.keccak256(
      ethers.toUtf8Bytes(secret + identity_id + ticketInfo.eventId)
    )

    if (expectedCommitment !== ticketInfo.commitment) {
      return res.status(401).json({
        success: false,
        message: 'Identity verification failed'
      })
    }

    // Generate and send OTP for verification
    const otpData = createSignupOtp(identity_id, String(token_id))
    
    try {
      await sendOtpSms(identity.phone_number, otpData.otp)
    } catch (smsErr) {
      return res.status(502).json({
        success: false,
        message: 'Failed to send OTP',
        error: smsErr.message
      })
    }

    return res.json({
      success: true,
      message: 'OTP sent',
      identity: {
        name: identity.name,
        profile_photo_url: identity.profile_photo_url
      }
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process gate entry',
      error: err.message
    })
  }
}

const gateVerifyEntry = async (req, res) => {
  try {
    const { token_id, identity_id, otp } = req.body

    // Validate request body
    if (!token_id || !identity_id || !otp) {
      return res.status(400).json({
        success: false,
        message: 'token_id, identity_id, and otp are required'
      })
    }

    // Verify OTP
    if (!verifySignupOtp(identity_id, String(token_id), otp)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      })
    }

    // Get ticket info
    let ticketInfo
    try {
      ticketInfo = await getTicketInfo(token_id)
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    // Ensure ticket hasn't been used
    if (ticketInfo.used) {
      return res.status(410).json({
        success: false,
        message: 'Ticket already used'
      })
    }

    // Verify commitment
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET
    const commitment = ethers.keccak256(
      ethers.toUtf8Bytes(secret + identity_id + ticketInfo.eventId)
    )

    // Mark ticket as used on blockchain
    let txResult
    try {
      txResult = await markUsed(token_id, commitment)
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Failed to mark ticket used',
        error: err.message
      })
    }

    return res.json({
      success: true,
      tx_hash: txResult.transactionHash
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify entry',
      error: err.message
    })
  }
}

module.exports = {
  gateEntry,
  gateVerifyEntry
}
