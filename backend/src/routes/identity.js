// Identity verification routes
import express from 'express';
import * as identityController from '../controllers/identity.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/v1/identity/send-otp
 * Send OTP to Aadhaar-linked phone number
 * Initiates identity verification process
 * 
 * @body {string} aadhaarId - 12-digit Aadhaar number
 * @body {string} [phone] - Optional phone verification
 * @returns {object} { aadhaarId, phone, message, expiresIn }
 * 
 * @example
 * POST /api/v1/identity/send-otp
 * {
 *   "aadhaarId": "111111111111",
 *   "phone": "+91-9876543210"
 * }
 * 
 * Response: {
 *   "aadhaarId": "111111111111",
 *   "phone": "+91-9876543210",
 *   "message": "OTP sent successfully",
 *   "expiresIn": 600
 * }
 */
router.post('/send-otp', identityController.sendOTP);

/**
 * POST /api/v1/identity/verify-otp
 * Verify OTP and retrieve identity information
 * After successful verification, user can proceed to commitment generation
 * 
 * @auth Required - Bearer token
 * @body {string} aadhaarId - Aadhaar ID which received OTP
 * @body {string} otp - 6-digit OTP provided by user
 * @returns {object} { identity, message, readyForCommitment }
 * 
 * @example
 * POST /api/v1/identity/verify-otp
 * Headers: Authorization: Bearer <token>
 * {
 *   "aadhaarId": "111111111111",
 *   "otp": "123456"
 * }
 * 
 * Response: {
 *   "identity": {
 *     "aadhaarId": "111111111111",
 *     "name": "Rajesh Kumar",
 *     "phone": "+91-9876543210",
 *     "photoUrl": "ipfs://QmPhoto",
 *     "verified": true,
 *     "verifiedAt": "2024-01-15T10:35:00Z"
 *   },
 *   "message": "Identity verified successfully",
 *   "readyForCommitment": true
 * }
 */
router.post('/verify-otp', authenticateToken, identityController.verifyOTP);

/**
 * POST /api/v1/identity/commitment
 * Generate ZK (Zero-Knowledge) commitment
 * Creates hash commitment for privacy-preserving identity storage on blockchain
 * Commitment = Hash(aadhaarId || secret || userWalletAddress)
 * 
 * @auth Required - Bearer token
 * @body {string} aadhaarId - Aadhaar ID (must be OTP verified)
 * @returns {object} { commitment, message, readyForMinting }
 * 
 * @example
 * POST /api/v1/identity/commitment
 * Headers: Authorization: Bearer <token>
 * {
 *   "aadhaarId": "111111111111"
 * }
 * 
 * Response: {
 *   "commitment": "0xabcdef1234567890...",
 *   "message": "Commitment generated successfully",
 *   "readyForMinting": true
 * }
 */
router.post('/commitment', authenticateToken, identityController.generateCommitment);

/**
 * GET /api/v1/identity/:aadhaarId
 * Get public identity information from registry
 * Returns only public data (name, photo)
 * 
 * @param {string} aadhaarId - Aadhaar ID to lookup
 * @returns {object} { name, photoUrl, verified }
 * 
 * @example
 * GET /api/v1/identity/111111111111
 * 
 * Response: {
 *   "name": "Rajesh Kumar",
 *   "photoUrl": "ipfs://QmPhoto",
 *   "verified": true
 * }
 */
router.get('/:aadhaarId', identityController.getIdentityInfo);

/**
 * POST /api/v1/identity/verify-commitment
 * Verify ZK commitment matches stored hash
 * Used during gate verification to confirm identity without revealing details
 * 
 * @body {string} commitment - Commitment hash to verify
 * @body {string} aadhaarId - Associated Aadhaar ID
 * @returns {object} { verified, aadhaarId, timestamp, message }
 * 
 * @example
 * POST /api/v1/identity/verify-commitment
 * {
 *   "commitment": "0xabcdef...",
 *   "aadhaarId": "111111111111"
 * }
 * 
 * Response: {
 *   "verified": true,
 *   "aadhaarId": "111111111111",
 *   "timestamp": "2024-01-15T10:40:00Z",
 *   "message": "Commitment verified successfully"
 * }
 */
router.post('/verify-commitment', identityController.verifyCommitment);

/**
 * POST /api/v1/identity/verify-otp
 * Mobile app endpoint - request OTP (with masked_id parameter)
 * 
 * @body {string} masked_id - Masked Aadhaar ID (last 4 digits)
 * @body {string} phone_number - Phone number for verification
 * @returns {object} { success, message, masked_id, expiresIn }
 */
router.post('/verify-otp', identityController.verifyOtpRequest);

/**
 * POST /api/v1/identity/verify-otp-code
 * Mobile app endpoint - verify OTP code
 * 
 * @body {string} masked_id - Masked Aadhaar ID
 * @body {string} otp_code - OTP code entered by user
 * @returns {object} { success, message, identity }
 */
router.post('/verify-otp-code', identityController.verifyOtpCode);

export default router;
