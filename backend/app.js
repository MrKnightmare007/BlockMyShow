const express = require('express')
const cors = require('cors')
require('./config/env')

const userRoutes = require('./routes/userRoutes')
const adminRoutes = require('./routes/adminRoutes')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/user', userRoutes)
app.use('/api/admin', adminRoutes)

app.get('/', (req, res) => {
  res.send('API Running')
})

module.exports = app
