const express = require('express')
const cors = require('cors')
require('./config/env')

const userRoutes = require('./routes/userRoutes')
const adminRoutes = require('./routes/adminRoutes')
const eventRoutes = require('./routes/eventRoutes')
const identityRoutes = require('./routes/identityRoutes')
const ticketsRoutes = require('./routes/ticketsRoutes')
const gateRoutes = require('./routes/gateRoutes')
const paymentRoutes = require('./routes/paymentRoutes')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})
app.use('/api/user', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/identity', identityRoutes)
app.use('/api/tickets', ticketsRoutes)
app.use('/api/gate', gateRoutes)
app.use('/api/payment', paymentRoutes)

app.get('/', (req, res) => {
  res.send('API Running')
})

module.exports = app
