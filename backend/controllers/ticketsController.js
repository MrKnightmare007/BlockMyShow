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
        console.log("[myTickets] Ticket info:", ticketInfo)
        tickets.push({
          token_id: tokenId,
          event_id: ticketInfo.eventId,
          used: ticketInfo.used,
          listPrice: ticketInfo.listPrice,
          salePrice: ticketInfo.salePrice,
          isListed: ticketInfo.isListed,
          // commitment: ticketInfo.commitment,

          event: {
            title: eventInfo.title,
            venue: eventInfo.venue,
            date: eventInfo.date,
            price: eventInfo.price,
            metadataURI:eventInfo.metadataURI
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

// ═══════════════════════════════════════════════════════════════
// ║               RESALE MARKETPLACE CONTROLLERS                ║
// ═══════════════════════════════════════════════════════════════

const listForResale = async (req, res) => {
  try {
    // Support both camelCase and snake_case
    const token_id = req.body.token_id || req.body.tokenId
    const price = req.body.price
    const wallet_address = req.user?.wallet_address

    // Validate
    if (!token_id || !price) {
      return res.status(400).json({
        success: false,
        message: 'tokenId (or token_id) and price are required'
      })
    }

    if (!wallet_address) {
      return res.status(401).json({
        success: false,
        message: 'User wallet address not found in token'
      })
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      })
    }

    // Verify token exists
    let ticket
    try {
      ticket = await getTicketInfo(token_id)
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    // Verify user owns the ticket
    const { getTicketOwner } = require('../service/blockchainService')
    let owner
    try {
      owner = await getTicketOwner(token_id)
      console.log('[listForResale] Token owner:', owner, 'User wallet:', wallet_address)
    } catch (err) {
      console.error('[listForResale] Failed to get ticket owner:', err.message)
      return res.status(502).json({
        success: false,
        message: 'Failed to verify ticket ownership',
        error: err.message
      })
    }

    if (owner.toLowerCase() !== wallet_address.toLowerCase()) {
      console.log('[listForResale] Ownership mismatch - user does not own this ticket')
      return res.status(403).json({
        success: false,
        message: 'You do not own this ticket'
      })
    }
    console.log('[listForResale] Ownership verified')

    if (ticket.used) {
      return res.status(400).json({
        success: false,
        message: 'Cannot list used tickets'
      })
    }

    // List on blockchain
    const { listForResale: listForResaleService } = require('../service/blockchainService')
    let txResult
    try {
      txResult = await listForResaleService(token_id, price)
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Failed to list ticket',
        error: err.message
      })
    }

    return res.json({
      success: true,
      message: 'Ticket listed for resale',
      tx_hash: txResult.transactionHash,
      token_id,
      price
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to list ticket',
      error: err.message
    })
  }
}

const updateListPrice = async (req, res) => {
  try {
    // Support both camelCase and snake_case
    const token_id = req.body.token_id || req.body.tokenId
    const new_price = req.body.new_price || req.body.newPrice
    const wallet_address = req.user?.wallet_address

    // Validate
    if (!token_id || !new_price) {
      return res.status(400).json({
        success: false,
        message: 'tokenId (or token_id) and newPrice (or new_price) are required'
      })
    }

    if (!wallet_address) {
      return res.status(401).json({
        success: false,
        message: 'User wallet address not found in token'
      })
    }

    if (new_price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      })
    }

    // Verify ticket exists and is listed
    let ticket
    try {
      ticket = await getTicketInfo(token_id)
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    // Verify user owns the ticket
    const { getTicketOwner } = require('../service/blockchainService')
    let owner
    try {
      owner = await getTicketOwner(token_id)
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Failed to verify ticket ownership',
        error: err.message
      })
    }

    if (owner.toLowerCase() !== wallet_address.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this ticket'
      })
    }

    if (!ticket.isListed) {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not listed for resale'
      })
    }

    const oldPrice = ticket.listPrice

    // Update on blockchain
    const { updateListPrice: updateListPriceService } = require('../service/blockchainService')
    let txResult
    try {
      txResult = await updateListPriceService(token_id, new_price)
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Failed to update price',
        error: err.message
      })
    }

    return res.json({
      success: true,
      message: 'Price updated successfully',
      tx_hash: txResult.transactionHash,
      token_id,
      old_price: oldPrice,
      new_price
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update price',
      error: err.message
    })
  }
}

const cancelListing = async (req, res) => {
  try {
    // Support both camelCase and snake_case
    const token_id = req.body.token_id || req.body.tokenId
    const wallet_address = req.user?.wallet_address

    // Validate
    if (!token_id) {
      return res.status(400).json({
        success: false,
        message: 'tokenId (or token_id) is required'
      })
    }

    if (!wallet_address) {
      return res.status(401).json({
        success: false,
        message: 'User wallet address not found in token'
      })
    }

    // Verify ticket exists and is listed
    let ticket
    try {
      ticket = await getTicketInfo(token_id)
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    if (!ticket.isListed) {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not listed for resale'
      })
    }

    // Verify user owns the ticket
    const { getTicketOwner } = require('../service/blockchainService')
    let owner
    try {
      owner = await getTicketOwner(token_id)
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Failed to verify ticket ownership',
        error: err.message
      })
    }

    if (owner.toLowerCase() !== wallet_address.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this ticket'
      })
    }

    // Cancel listing on blockchain
    const { cancelListing: cancelListingService } = require('../service/blockchainService')
    let txResult
    try {
      txResult = await cancelListingService(token_id)
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Failed to cancel listing',
        error: err.message
      })
    }

    return res.json({
      success: true,
      message: 'Listing cancelled',
      tx_hash: txResult.transactionHash,
      token_id
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel listing',
      error: err.message
    })
  }
}

const getMarketplace = async (req, res) => {
  try {
    const { getListedTokens } = require('../service/blockchainService')

    // Get all listed token IDs
    let tokenIds
    try {
      tokenIds = await getListedTokens()
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Failed to fetch marketplace',
        error: err.message
      })
    }

    // Fetch details for each ticket
    const tickets = []
    for (const tokenId of tokenIds) {
      try {
        const ticketInfo = await getTicketInfo(tokenId)
        
        // Only include if still listed
        if (ticketInfo.isListed && ticketInfo.listPrice > 0) {
          const eventInfo = await getEvent(ticketInfo.eventId)
          
          tickets.push({
            token_id: tokenId,
            event_id: ticketInfo.eventId,
            used: ticketInfo.used,
            is_listed: ticketInfo.isListed,
            list_price: ticketInfo.listPrice,
            sale_price: ticketInfo.salePrice,
            event: {
              event_id: eventInfo.eventId,
              title: eventInfo.title,
              venue: eventInfo.venue,
              date: eventInfo.date,
              price: eventInfo.price,
              photo_url: eventInfo.photoUrl,
              total_tickets: eventInfo.totalTickets,
              tickets_minted: eventInfo.ticketsMinted
            }
          })
        }
      } catch (err) {
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
      message: 'Failed to fetch marketplace',
      error: err.message
    })
  }
}

const buyResaleRequest = async (req, res) => {
  try {
    // Support both camelCase and snake_case
    const token_id = req.body.token_id || req.body.tokenId
    const buyer_identity = req.body.buyer_identity || req.body.buyerIdentity
    const wallet_address = req.user?.wallet_address

    // Validate
    if (!token_id || !buyer_identity) {
      return res.status(400).json({
        success: false,
        message: 'tokenId (or token_id) and buyerIdentity (or buyer_identity) are required'
      })
    }

    if (!wallet_address) {
      return res.status(401).json({
        success: false,
        message: 'User wallet address not found'
      })
    }

    // Verify ticket exists and is listed
    let ticket
    try {
      ticket = await getTicketInfo(token_id)
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    if (!ticket.isListed) {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not listed for resale'
      })
    }

    if (ticket.used) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been used'
      })
    }

    // Verify seller still owns the ticket
    const { getTicketOwner } = require('../service/blockchainService')
    let seller
    try {
      seller = await getTicketOwner(token_id)
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Failed to verify ticket ownership',
        error: err.message
      })
    }

    if (!seller) {
      return res.status(400).json({
        success: false,
        message: 'Could not determine ticket seller'
      })
    }

    // Verify buyer identity exists
    const identity = await getIdentityByRawId(buyer_identity)
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Buyer identity not found'
      })
    }

    // if (!identity.is_verified) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Buyer identity is not verified'
    //   })
    // }

    // Generate and send OTP
    const { createResaleOtp } = require('../service/otpService')
    const otpData = createResaleOtp(token_id, buyer_identity)

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
      message: 'OTP sent to registered phone number',
      expires_in_minutes: otpData.expiresInMinutes,
      token_id
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process resale request',
      error: err.message
    })
  }
}

const buyResaleConfirm = async (req, res) => {
  try {
    // Support both camelCase and snake_case
    const token_id = req.body.token_id || req.body.tokenId
    const buyer_identity = req.body.buyer_identity || req.body.buyerIdentity
    const otp = req.body.otp
    const wallet_address = req.user?.wallet_address

    // Validate
    if (!token_id || !buyer_identity || !otp) {
      return res.status(400).json({
        success: false,
        message: 'tokenId (or token_id), buyerIdentity (or buyer_identity), and otp are required'
      })
    }

    if (!wallet_address) {
      return res.status(401).json({
        success: false,
        message: 'User wallet address not found'
      })
    }

    // Verify OTP
    const { verifyResaleOtp } = require('../service/otpService')
    if (!verifyResaleOtp(token_id, buyer_identity, otp)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      })
    }

    // Verify ticket still exists and is listed
    let ticket
    try {
      ticket = await getTicketInfo(token_id)
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    if (!ticket.isListed) {
      return res.status(400).json({
        success: false,
        message: 'Ticket is no longer listed for resale'
      })
    }

    if (ticket.used) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been used'
      })
    }

    // Verify seller still owns the ticket
    const { getTicketOwner } = require('../service/blockchainService')
    let seller
    try {
      seller = await getTicketOwner(token_id)
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Failed to verify ticket ownership',
        error: err.message
      })
    }

    if (!seller) {
      return res.status(400).json({
        success: false,
        message: 'Could not determine ticket seller'
      })
    }

    // Verify buyer identity
    const identity = await getIdentityByRawId(buyer_identity)
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Buyer identity not found'
      })
    }

    // Create new commitment for buyer
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET
    const newCommitment = ethers.keccak256(
      ethers.toUtf8Bytes(secret + buyer_identity + ticket.eventId)
    )

    // Execute resale on blockchain
    const { buyResale } = require('../service/blockchainService')
    let txResult
    try {
      txResult = await buyResale(token_id, wallet_address, newCommitment)
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Failed to process resale',
        error: err.message
      })
    }

    return res.json({
      success: true,
      message: 'Ticket purchased successfully',
      token_id,
      tx_hash: txResult.transactionHash,
      block_number: txResult.blockNumber,
      buyer_wallet: wallet_address,
      price_paid: ticket.listPrice
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm resale',
      error: err.message
    })
  }
}

const getTicketDetails = async (req, res) => {
  try {
    const { tokenId } = req.params

    // Validate
    if (!tokenId) {
      return res.status(400).json({
        success: false,
        message: 'tokenId is required'
      })
    }

    // Fetch ticket details
    let ticket
    try {
      ticket = await getTicketInfo(tokenId)
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    // Fetch event details
    let event
    try {
      event = await getEvent(ticket.eventId)
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    return res.json({
      success: true,
      token_id: Number(tokenId),
      event_id: ticket.eventId,
      used: ticket.used,
      is_listed: ticket.isListed,
      list_price: ticket.listPrice,
      sale_price: ticket.salePrice,
      event: {
        event_id: event.eventId,
        title: event.title,
        venue: event.venue,
        date: event.date,
        price: event.price,
        photo_url: event.photoUrl,
        total_tickets: event.totalTickets,
        tickets_minted: event.ticketsMinted
      }
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket details',
      error: err.message
    })
  }
}

module.exports = {
  ticketsRequest,
  ticketsConfirm,
  myTickets,
  listForResale,
  updateListPrice,
  cancelListing,
  getMarketplace,
  buyResaleRequest,
  buyResaleConfirm,
  getTicketDetails
}
