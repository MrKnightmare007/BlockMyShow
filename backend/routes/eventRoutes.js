const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')
const {
  createEvent,
  updateEvent,
  getEvents,
  getEvent
} = require('../controllers/eventController')

router.get('/', getEvents)
router.get('/:id', getEvent)

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['super_admin']),
  createEvent
)

router.patch(
  '/:id/metadata',
  authMiddleware,
  roleMiddleware(['super_admin']),
  updateEvent
)

router.put(
  '/:id/metadata',
  authMiddleware,
  roleMiddleware(['super_admin']),
  updateEvent
)

module.exports = router
