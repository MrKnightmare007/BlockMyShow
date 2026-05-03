const express = require('express')
const router = express.Router()

const {
  auth
} = require('../controllers/userController')

router.post('/auth', auth)

module.exports = router
