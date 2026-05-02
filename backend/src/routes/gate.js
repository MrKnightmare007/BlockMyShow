// Gate verification routes
// Used primarily by gate scanner application at event venues
import express from 'express';
import * as gateController from '../controllers/gate.js';

const router = express.Router();

/**
 * POST /api/v1/gate/verify
 * Verify ticket at event entry gate
 * Multi-step verification: QR check → OTP validation → Identity verification
 * 
 * @body {string} tokenId - NFT token ID from QR code
 * @body {string} eventId - Event ID for ticket
 * @body {string} [aadhaarId] - Aadhaar ID for identity verification
 * @body {string} [currentOTP] - OTP sent to Aadhaar-linked phone
 * @returns {object} { tokenId, eventId, verified, identity, verificationTime, nextStep }
 * 
 * @example
 * POST /api/v1/gate/verify
 * {
 *   "tokenId": "token_001",
 *   "eventId": "event_1",
 *   "aadhaarId": "111111111111",
 *   "currentOTP": "123456"
 * }
 * 
 * Response: {
 *   "tokenId": "token_001",
 *   "eventId": "event_1",
 *   "verified": true,
 *   "identity": {
 *     "aadhaarId": "111111111111",
 *     "name": "Rajesh Kumar",
 *     "photoUrl": "ipfs://QmPhoto",
 *     "verified": true
 *   },
 *   "verificationTime": "2024-01-15T15:30:00Z",
 *   "nextStep": "Mark as used on entry"
 * }
 */
router.post('/verify', gateController.verifyTicketAtGate);

/**
 * POST /api/v1/gate/mark-used
 * Mark ticket as successfully used after gate entry
 * Final step of entry verification process
 * 
 * @body {string} tokenId - Token ID of ticket
 * @body {string} eventId - Event ID
 * @returns {object} { tokenId, marked, usedAt, message, entryGranted }
 * 
 * @example
 * POST /api/v1/gate/mark-used
 * {
 *   "tokenId": "token_001",
 *   "eventId": "event_1"
 * }
 * 
 * Response: {
 *   "tokenId": "token_001",
 *   "marked": true,
 *   "usedAt": "2024-01-15T15:35:00Z",
 *   "message": "Ticket marked as used successfully",
 *   "entryGranted": true
 * }
 */
router.post('/mark-used', gateController.markTicketUsed);

/**
 * GET /api/v1/gate/stats
 * Get gate verification statistics for an event
 * Shows total verified, used, and failed verification counts
 * 
 * @query {string} eventId - Event ID to get stats for (required)
 * @returns {object} { eventId, totalVerified, totalUsed, verificationFailed, lastUpdated }
 * 
 * @example
 * GET /api/v1/gate/stats?eventId=event_1
 * 
 * Response: {
 *   "eventId": "event_1",
 *   "totalVerified": 450,
 *   "totalUsed": 450,
 *   "verificationFailed": 2,
 *   "duplicateAttempts": 1,
 *   "lastUpdated": "2024-01-15T15:40:00Z"
 * }
 */
router.get('/stats', gateController.getGateStats);

/**
 * POST /api/v1/gate/verify-qr
 * Verify ticket via QR code data (scanner app format)
 * Accepts raw QR code data and extracts ticket information
 * 
 * @body {object|string} qrData - QR code data (JSON with tokenId, eventId, etc.)
 * @returns {object} Verification result (same as /verify endpoint)
 * 
 * @example
 * POST /api/v1/gate/verify-qr
 * {
 *   "qrData": "{\"tokenId\": \"token_001\", \"eventId\": \"event_1\"}"
 * }
 * 
 * Response: {
 *   "tokenId": "token_001",
 *   "eventId": "event_1",
 *   "verified": true,
 *   ...
 * }
 */
router.post('/verify-qr', gateController.verifyQRCode);

/**
 * GET /api/v1/gate/operator-stats
 * Get verification statistics for a specific gate operator
 * Tracks individual scanner app operator performance
 * 
 * @query {string} eventId - Event ID (required)
 * @query {string} operatorId - Gate operator/scanner ID (required)
 * @returns {object} { eventId, operatorId, verified, used, efficiency }
 * 
 * @example
 * GET /api/v1/gate/operator-stats?eventId=event_1&operatorId=scanner_1
 * 
 * Response: {
 *   "eventId": "event_1",
 *   "operatorId": "scanner_1",
 *   "verified": 150,
 *   "used": 150,
 *   "efficiency": "100.00%"
 * }
 */
router.get('/operator-stats', gateController.getOperatorStats);

export default router;
