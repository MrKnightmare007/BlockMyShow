// Ticket routes
import express from 'express';
import * as ticketController from '../controllers/tickets.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/tickets/my-tickets
 * Get authenticated user's purchased tickets
 * 
 * @auth Required - Bearer token
 * @query {number} [limit=20] - Number of tickets per page
 * @query {number} [offset=0] - Pagination offset
 * @query {string} [status=active] - Filter: active, used, all
 * @returns {object} { tickets, total, limit, offset }
 * 
 * @example
 * GET /api/v1/tickets/my-tickets?status=active
 * Headers: Authorization: Bearer <token>
 * 
 * Response: {
 *   "tickets": [
 *     {
 *       "tokenId": "token_001",
 *       "eventId": "event_1",
 *       "used": false,
 *       "createdAt": "2024-01-15T10:30:00Z"
 *     }
 *   ],
 *   "total": 3
 * }
 */
router.get('/my-tickets', authenticateToken, ticketController.getMyTickets);

/**
 * GET /api/v1/tickets/:id
 * Get ticket details by token ID
 * 
 * @param {string} id - Token ID (NFT token ID on blockchain)
 * @returns {object} { ticket, qrCode, verification }
 * 
 * @example
 * GET /api/v1/tickets/token_001
 * 
 * Response: {
 *   "ticket": {
 *     "tokenId": "token_001",
 *     "eventId": "event_1",
 *     "used": false,
 *     "createdAt": "2024-01-15T10:30:00Z"
 *   },
 *   "qrCode": "data:image/png;base64,...",
 *   "verification": {
 *     "used": false,
 *     "usedAt": null
 *   }
 * }
 */
router.get('/:id', ticketController.getTicketById);

/**
 * POST /api/v1/tickets/mint
 * Mint NFT ticket after successful payment and identity verification
 * Called after payment webhook confirms order completion
 * 
 * @auth Required - Bearer token
 * @body {string} eventId - Event ID to mint ticket for
 * @body {string} orderId - Payment order ID (proof of payment)
 * @body {string} aadhaarId - Aadhaar ID for identity verification
 * @body {string} [commitment] - ZK commitment hash (optional)
 * @returns {object} { ticket, message, onChainSync }
 * 
 * @example
 * POST /api/v1/tickets/mint
 * Headers: Authorization: Bearer <token>
 * {
 *   "eventId": "event_1",
 *   "orderId": "order_123",
 *   "aadhaarId": "111111111111",
 *   "commitment": "0xabcd..."
 * }
 * 
 * Response: {
 *   "ticket": {
 *     "tokenId": "token_001",
 *     "eventId": "event_1",
 *     "used": false,
 *     "qrCode": "data:image/png;base64,..."
 *   },
 *   "message": "Ticket minted successfully",
 *   "onChainSync": "pending"
 * }
 */
router.post('/mint', authenticateToken, ticketController.mintTicket);

/**
 * GET /api/v1/tickets/verify/:tokenId
 * Verify ticket authenticity on blockchain
 * 
 * @param {string} tokenId - Token ID to verify
 * @returns {object} { valid, ticket, message }
 * 
 * @example
 * GET /api/v1/tickets/verify/token_001
 * 
 * Response: {
 *   "valid": true,
 *   "ticket": {
 *     "tokenId": "token_001",
 *     "eventId": "event_1",
 *     "owner": "user_123",
 *     "used": false
 *   },
 *   "message": "Ticket verified successfully"
 * }
 */
router.get('/verify/:tokenId', ticketController.verifyTicket);

/**
 * GET /api/v1/tickets/:tokenId/qr
 * Get QR code for ticket scanning at gate
 * 
 * @auth Required - Bearer token
 * @param {string} tokenId - Token ID
 * @returns {object} { tokenId, qrCode, scanURL }
 * 
 * @example
 * GET /api/v1/tickets/token_001/qr
 * Headers: Authorization: Bearer <token>
 * 
 * Response: {
 *   "tokenId": "token_001",
 *   "qrCode": "data:image/png;base64,...",
 *   "scanURL": "/api/v1/gate/verify-qr?data=..."
 * }
 */
router.get('/:tokenId/qr', authenticateToken, ticketController.getTicketQR);

/**
 * POST /api/v1/tickets/mint (Mobile app wrapper)
 * Simplified mint endpoint for mobile payment flow
 * 
 * @body {string} eventId - Event ID
 * @body {string} buyerWallet - Buyer wallet address
 * @body {number} ticketCount - Number of tickets
 * @body {string} [orderId] - Order ID for reference
 * @returns {object} { success, tickets, message }
 */
router.post('/mint', ticketController.mint);

export default router;
