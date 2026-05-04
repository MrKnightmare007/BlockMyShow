const { ethers } = require('ethers')
const { createSignupOtp } = require('../service/otpService')
const { sendOtpSms } = require('../service/smsService')
const { getIdentityByRawId, hashIdentity } = require('../service/identityService')
const { getEvent, getTicketInfo, mintTicket, getUserTickets } = require('../service/blockchainService')

const ticketsRequest = async (req, res) => {
  try {
    const { event_id, identity_id } = req.body

    // Validate request body
    if (event_id === undefined || event_id === null || !identity_id) {
      return res.status(400).json({
        success: false,
        message: 'event_id and identity_id are required'
      })
    }

    // Hash identity and lookup
    const identity = await getIdentityByRawId(identity_id)
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Identity not found'
      })
    }

    // Check event exists and not sold out
    let event
    try {
      event = await getEvent(Number(event_id))
    } catch (err) {
      console.error('[ticketsRequest] getEvent error:', err.message)
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        error: err.message
      })
    }

    if (event.ticketsMinted >= event.totalTickets) {
      return res.status(410).json({
        success: false,
        message: 'Event is sold out'
      })
    }

    // Generate and send OTP
    const otpData = createSignupOtp(identity_id, String(event_id))
    
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
      expires_in_minutes: otpData.expiresInMinutes
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process ticket request',
      error: err.message
    })
  }
}

const ticketsConfirm = async (req, res) => {
  try {
    const { event_id, identity_id, otp } = req.body
    const wallet_address = req.user?.wallet_address

    // Validate request body
    if (event_id === undefined || event_id === null || !identity_id || !otp) {
      return res.status(400).json({
        success: false,
        message: 'event_id, identity_id, and otp are required'
      })
    }

    if (!wallet_address) {
      return res.status(401).json({
        success: false,
        message: 'User wallet address not found in token'
      })
    }

    // Get OTP service data
    const otpService = require('../service/otpService')
    if (!otpService.verifySignupOtp(identity_id, String(event_id), otp)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      })
    }

    // Verify identity exists
    const identity = await getIdentityByRawId(identity_id)
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Identity not found'
      })
    }

    // Verify event exists
    let event
    try {
      event = await getEvent(Number(event_id))
    } catch (err) {
      console.error('[ticketsConfirm] getEvent error:', err.message)
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        error: err.message
      })
    }

    // Create commitment hash
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET
    const messageHash = ethers.keccak256(
      ethers.toUtf8Bytes(secret + identity_id + event_id)
    )

    // Mint ticket on blockchain
    let txResult
    try {
      txResult = await mintTicket(wallet_address, event_id, messageHash)
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Failed to mint ticket',
        error: err.message
      })
    }

    return res.status(201).json({
      success: true,
      token_id: txResult.tokenId,
      tx_hash: txResult.transactionHash
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm ticket',
      error: err.message
    })
  }
}

const myTickets = async (req, res) => {
  try {
    const wallet_address = req.user?.wallet_address

    console.log('[myTickets] Request user:', req.user)
    console.log('[myTickets] Wallet address:', wallet_address)

    if (!wallet_address) {
      return res.status(401).json({
        success: false,
        message: 'User wallet address not found in token'
      })
    }

    // Get all token IDs for user
    let tokenIds
    try {
      tokenIds = await getUserTickets(wallet_address)
    } catch (err) {
      console.error('[myTickets] Error fetching tickets:', err.message)
      return res.status(502).json({
        success: false,
        message: 'Failed to fetch tickets',
        error: err.message
      })
    }

    // Fetch ticket details for each token
    const tickets = []
    for (const tokenId of tokenIds) {
      try {
        const ticketInfo = await getTicketInfo(tokenId)
        const eventInfo = await getEvent(ticketInfo.eventId)

        tickets.push({
          token_id: tokenId,
          event_id: ticketInfo.eventId,
          used: ticketInfo.used,
          commitment: ticketInfo.commitment,
          event: {
            title: eventInfo.title,
            venue: eventInfo.venue,
            date: eventInfo.date,
            price: eventInfo.price
          }
        })
      } catch (err) {
        // Skip tickets that can't be fetched
        console.error(`Failed to fetch details for token ${tokenId}:`, err.message)
      }
    }

    return res.json({
      success: true,
      tickets
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: err.message
    })
  }
}

module.exports = {
  ticketsRequest,
  ticketsConfirm,
  myTickets
}
