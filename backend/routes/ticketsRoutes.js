const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')
const {
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
} = require('../controllers/ticketsController')

// ──── EXISTING ENDPOINTS ────
router.post('/request', authMiddleware, ticketsRequest)
router.post('/confirm', authMiddleware, ticketsConfirm)
router.get('/my-tickets', authMiddleware, myTickets)

// ──── RESALE MARKETPLACE ENDPOINTS ────

// List ticket for resale
router.post('/list', authMiddleware, listForResale)

// Update resale price
router.post('/update-list-price', authMiddleware, updateListPrice)

// Cancel resale listing
router.post('/cancel-listing', authMiddleware, cancelListing)

// Get all listed tickets (public marketplace)
router.get('/marketplace', getMarketplace)

// Buy resale - Step 1: Request OTP
router.post('/buy-resale/request', authMiddleware, buyResaleRequest)

// Buy resale - Step 2: Confirm with OTP
router.post('/buy-resale/confirm', authMiddleware, buyResaleConfirm)

// Get single ticket details
router.get('/:tokenId', getTicketDetails)

module.exports = router
