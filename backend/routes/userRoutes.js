const express = require('express')
const router = express.Router()

const {
  auth,
  googleAuth,
  walletAuth
} = require('../controllers/userController')

router.post('/auth', auth)
router.post('/auth-google', googleAuth)
router.post('/auth-wallet', walletAuth)

module.exports = router
