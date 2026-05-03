const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')
const {
  ticketsRequest,
  ticketsConfirm,
  myTickets
} = require('../controllers/ticketsController')

router.post('/request', authMiddleware, ticketsRequest)
router.post('/confirm', authMiddleware, ticketsConfirm)
router.get('/my-tickets', authMiddleware, myTickets)

module.exports = router
