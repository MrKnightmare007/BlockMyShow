const {
  createEventOnChain,
  updateEventMetadataOnChain,
  getEventFromChain,
  listEventsFromChain
} = require('../models/eventModel')

const pickEventPayload = (body) => {
  const {
    title,
    venue,
    date,
    price,
    totalTickets,
    photoUrl
  } = body

  const payload = {}

  if (title !== undefined) payload.title = title
  if (venue !== undefined) payload.venue = venue
  if (date !== undefined) payload.date = date
  if (price !== undefined) payload.price = price
  if (totalTickets !== undefined) payload.totalTickets = totalTickets
  if (photoUrl !== undefined) payload.photoUrl = photoUrl

  return payload
}

const validateCreateEvent = (payload) => {
  const requiredFields = ['title', 'venue', 'date', 'price', 'totalTickets']
  return requiredFields.filter((field) => payload[field] === undefined || payload[field] === '')
}

const normalizeEventDate = (date) => {
  if (typeof date === 'number') return date

  const parsedDate = Date.parse(date)

  if (Number.isNaN(parsedDate)) {
    return Number(date)
  }

  return Math.floor(parsedDate / 1000)
}

const normalizeCreatePayload = (payload) => {
  return {
    ...payload,
    date: normalizeEventDate(payload.date),
    price: Number(payload.price),
    totalTickets: Number(payload.totalTickets)
  }
}

const createEvent = async (req, res) => {
  try {
    const payload = pickEventPayload(req.body)
    const missingFields = validateCreateEvent(payload)

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      })
    }

    const normalizedPayload = normalizeCreatePayload(payload)

    if (!Number.isFinite(normalizedPayload.date) || normalizedPayload.date <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Event date must be a valid Unix timestamp or date string'
      })
    }

    if (!Number.isFinite(normalizedPayload.price) || normalizedPayload.price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid number'
      })
    }

    if (!Number.isInteger(normalizedPayload.totalTickets) || normalizedPayload.totalTickets <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total tickets must be a positive integer'
      })
    }

    const event = await createEventOnChain(normalizedPayload)

    res.status(201).json({
      success: true,
      message: 'Event created on chain',
      event
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

const updateEvent = async (req, res) => {
  try {
    const allowedFields = ['photoUrl']
    const unsupportedFields = Object.keys(req.body).filter((field) => {
      return !allowedFields.includes(field)
    })

    if (unsupportedFields.length) {
      return res.status(400).json({
        success: false,
        message: 'Only photoUrl can be updated',
        unsupportedFields
      })
    }

    const { photoUrl } = req.body

    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        message: 'photoUrl is required'
      })
    }

    const event = await updateEventMetadataOnChain(req.params.id, photoUrl)

    res.json({
      success: true,
      message: 'Event metadata updated on chain',
      event
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

const getEvents = async (req, res) => {
  try {
    const events = await listEventsFromChain()

    res.json({
      success: true,
      events
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

const getEvent = async (req, res) => {
  try {
    const event = await getEventFromChain(req.params.id)

    res.json({
      success: true,
      event
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

module.exports = {
  createEvent,
  updateEvent,
  getEvents,
  getEvent
}
