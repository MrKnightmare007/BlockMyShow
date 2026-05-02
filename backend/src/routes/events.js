// Event routes
import express from 'express';
import * as eventController from '../controllers/events.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * ========================
 * PUBLIC ENDPOINTS
 * ========================
 */

/**
 * GET /api/v1/events
 * List all active events (PUBLIC - no auth required)
 * 
 * @query {number} [limit=20] - Number of events per page
 * @query {number} [offset=0] - Pagination offset
 * @query {string} [status=active] - Filter by status (active, cancelled, completed)
 * @returns {object} { events, total, limit, offset, message }
 * 
 * @example
 * GET /api/v1/events?limit=10&offset=0&status=active
 * 
 * Response: {
 *   "success": true,
 *   "events": [{...}, {...}],
 *   "total": 15,
 *   "limit": 10,
 *   "offset": 0
 * }
 */
router.get('/', eventController.getEvents);

/**
 * GET /api/v1/events/:id
 * Get detailed information for a specific event (PUBLIC)
 * 
 * @param {string} id - Event ID (path parameter)
 * @returns {object} Event object with full details
 * 
 * @example
 * GET /api/v1/events/event_1
 * 
 * Response: {
 *   "success": true,
 *   "event": {
 *     "id": "event_1",
 *     "title": "Web3 Summit 2024",
 *     "date": "2024-06-15T10:00:00Z",
 *     "venue": "Mumbai, India",
 *     "price": 500,
 *     "totalTickets": 1000,
 *     "ticketsMinted": 450,
 *     ...
 *   }
 * }
 */
router.get('/:id', eventController.getEventById);

/**
 * GET /api/v1/events/:id/remaining-tickets
 * Get remaining ticket count for an event (PUBLIC)
 * 
 * @param {string} id - Event ID
 * @returns {object} { eventId, totalTickets, ticketsMinted, remainingTickets, isSoldOut, percentageSold }
 * 
 * @example
 * GET /api/v1/events/event_1/remaining-tickets
 * 
 * Response: {
 *   "success": true,
 *   "eventId": "event_1",
 *   "totalTickets": 1000,
 *   "ticketsMinted": 450,
 *   "remainingTickets": 550,
 *   "isSoldOut": false,
 *   "percentageSold": 45
 * }
 */
router.get('/:id/remaining-tickets', eventController.getRemainingTickets);

/**
 * ========================
 * ADMIN ONLY ENDPOINTS
 * ========================
 */

/**
 * POST /api/v1/events
 * Create new event (ADMIN ONLY)
 * 
 * @auth Required - Bearer token (admin role)
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
 * Headers: Authorization: Bearer <admin-token>
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
 *   "success": true,
 *   "event": {...},
 *   "message": "Event created successfully",
 *   "onChainSync": "pending"
 * }
 */
router.post('/', authenticateToken, requireRole(['admin']), eventController.createEvent);

/**
 * PUT /api/v1/events/:id
 * Update event details (ADMIN ONLY)
 * Only the admin who created the event can update it
 * 
 * @auth Required - Bearer token (admin role)
 * @param {string} id - Event ID
 * @body {string} [title] - Updated title
 * @body {string} [date] - Updated date
 * @body {string} [venue] - Updated venue
 * @body {number} [price] - Updated price
 * @body {number} [totalTickets] - Updated total tickets
 * @body {string} [description] - Updated description
 * @body {string} [status] - Updated status (active, cancelled, completed)
 * @returns {object} { event, message }
 * 
 * @example
 * PUT /api/v1/events/event_1
 * Headers: Authorization: Bearer <admin-token>
 * {
 *   "price": 600,
 *   "description": "Updated description"
 * }
 * 
 * Response: {
 *   "success": true,
 *   "event": {...},
 *   "message": "Event updated successfully"
 * }
 */
router.put('/:id', authenticateToken, requireRole(['admin']), eventController.updateEvent);

/**
 * DELETE /api/v1/events/:id
 * Cancel/delete event (ADMIN ONLY)
 * Marks event as cancelled and can trigger refunds
 * Only the admin who created the event can delete it
 * 
 * @auth Required - Bearer token (admin role)
 * @param {string} id - Event ID
 * @returns {object} { event, message, refundsTriggered }
 * 
 * @example
 * DELETE /api/v1/events/event_1
 * Headers: Authorization: Bearer <admin-token>
 * 
 * Response: {
 *   "success": true,
 *   "event": {...},
 *   "message": "Event cancelled successfully",
 *   "refundsTriggered": true
 * }
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), eventController.deleteEvent);

export default router;
