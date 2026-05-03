const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const {
  gateEntry,
  gateVerifyEntry
} = require('../controllers/gateController')

router.post(
  '/entry',
  authMiddleware,
  roleMiddleware(['admin', 'super_admin']),
  gateEntry
)

router.post(
  '/verify-entry',
  authMiddleware,
  roleMiddleware(['admin', 'super_admin']),
  gateVerifyEntry
)

module.exports = router
