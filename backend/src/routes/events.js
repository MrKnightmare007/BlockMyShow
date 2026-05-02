// Event routes
import express from 'express';
import * as eventController from '../controllers/events.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/events
 * List all active events with pagination and filters
 * 
 * @query {number} [limit=20] - Number of events per page
 * @query {number} [offset=0] - Pagination offset
 * @query {string} [status=active] - Filter by status (active, inactive, all)
 * @returns {object} { events, total, limit, offset }
 * 
 * @example
 * GET /api/v1/events?limit=10&offset=0&status=active
 * 
 * Response: {
 *   "events": [
 *     {
 *       "id": "event_1",
 *       "title": "Web3 Summit",
 *       "date": "2024-06-15T10:00:00Z",
 *       "venue": "Mumbai, India",
 *       "price": 500,
 *       "totalTickets": 1000,
 *       "ticketsMinted": 450,
 *       "remainingTickets": 550
 *     }
 *   ],
 *   "total": 15,
 *   "limit": 10,
 *   "offset": 0
 * }
 */
router.get('/', eventController.getEvents);

/**
 * GET /api/v1/events/:id
 * Get detailed information for a specific event
 * 
 * @param {string} id - Event ID (path parameter)
 * @returns {object} Event object with full details
 * 
 * @example
 * GET /api/v1/events/event_1
 * 
 * Response: {
 *   "id": "event_1",
 *   "title": "Web3 Summit 2024",
 *   "date": "2024-06-15T10:00:00Z",
 *   "venue": "Mumbai, India",
 *   "price": 500,
 *   "totalTickets": 1000,
 *   "ticketsMinted": 450,
 *   "description": "Annual Web3 conference...",
 *   "image": "ipfs://QmEventImage1"
 * }
 */
router.get('/:id', eventController.getEventById);

/**
 * POST /api/v1/events
 * Create new event (organizer role required)
 * 
 * @auth Required - Bearer token (organizer)
 * @body {string} title - Event title
 * @body {string} date - Event date ISO 8601 format
 * @body {string} venue - Event venue location
 * @body {number} price - Ticket price in INR
 * @body {number} totalTickets - Total tickets available
 * @body {string} [description] - Event description
 * @body {string} [image] - Image URL or file
 * @returns {object} { event, message, onChainSync }
 * 
 * @example
 * POST /api/v1/events
 * Headers: Authorization: Bearer <token>
 * {
 *   "title": "Web3 Summit 2024",
 *   "date": "2024-06-15T10:00:00Z",
 *   "venue": "Mumbai, India",
 *   "price": 500,
 *   "totalTickets": 1000,
 *   "description": "Annual Web3 conference"
 * }
 * 
 * Response: {
 *   "event": {...},
 *   "message": "Event created successfully",
 *   "onChainSync": "pending"
 * }
 */
router.post('/', authenticateToken, eventController.createEvent);

/**
 * PUT /api/v1/events/:id
 * Update event details (organizer only)
 * 
 * @auth Required - Bearer token (organizer)
 * @param {string} id - Event ID
 * @body {string} [title] - Updated title
 * @body {string} [date] - Updated date
 * @body {string} [venue] - Updated venue
 * @body {number} [price] - Updated price
 * @body {boolean} [active] - Activate/deactivate event
 * @returns {object} { event, message }
 * 
 * @example
 * PUT /api/v1/events/event_1
 * Headers: Authorization: Bearer <token>
 * {
 *   "price": 600,
 *   "description": "Updated description"
 * }
 * 
 * Response: { "event": {...}, "message": "Event updated successfully" }
 */
router.put('/:id', authenticateToken, eventController.updateEvent);

/**
 * DELETE /api/v1/events/:id
 * Cancel/delete event (organizer only)
 * Triggers refunds for purchased tickets
 * 
 * @auth Required - Bearer token (organizer)
 * @param {string} id - Event ID
 * @returns {object} { event, message, refundsTriggered }
 * 
 * @example
 * DELETE /api/v1/events/event_1
 * Headers: Authorization: Bearer <token>
 * 
 * Response: {
 *   "event": {...},
 *   "message": "Event cancelled successfully",
 *   "refundsTriggered": true
 * }
 */
router.delete('/:id', authenticateToken, eventController.deleteEvent);

/**
 * GET /api/v1/events/:id/tickets
 * Get remaining tickets count for an event
 * 
 * @param {string} id - Event ID
 * @returns {object} { eventId, totalTickets, ticketsMinted, remainingTickets, isSoldOut }
 * 
 * @example
 * GET /api/v1/events/event_1/tickets
 * 
 * Response: {
 *   "eventId": "event_1",
 *   "totalTickets": 1000,
 *   "ticketsMinted": 450,
 *   "remainingTickets": 550,
 *   "isSoldOut": false,
 *   "percentageSold": 45
 * }
 */
router.get('/:id/tickets', eventController.getRemainingTickets);

export default router;
