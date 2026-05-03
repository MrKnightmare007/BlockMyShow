const express = require('express')
const router = express.Router()

const { addIdentityController } = require('../controllers/identityController')

router.post('/add', addIdentityController)

module.exports = router
