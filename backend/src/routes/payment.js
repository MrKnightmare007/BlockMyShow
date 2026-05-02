// Payment routes
import express from 'express';
import * as paymentController from '../controllers/payment.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/v1/payment/create-order
 * Create Razorpay payment order for ticket purchase
 * 
 * @auth Required - Bearer token
 * @body {string} eventId - Event ID to purchase tickets for
 * @body {number} ticketCount - Number of tickets to purchase
 * @body {number} amount - Total amount in INR
 * @body {string} [email] - User email (optional, from profile if not provided)
 * @body {string} [phone] - User phone number
 * @returns {object} { orderId, keyId, amount, currency, prefill }
 * 
 * @example
 * POST /api/v1/payment/create-order
 * Headers: Authorization: Bearer <token>
 * {
 *   "eventId": "event_1",
 *   "ticketCount": 2,
 *   "amount": 1000,
 *   "phone": "+91-9876543210"
 * }
 * 
 * Response: {
 *   "orderId": "order_123",
 *   "keyId": "rzp_test_...",
 *   "amount": 100000,
 *   "currency": "INR"
 * }
 */
router.post('/create-order', authenticateToken, paymentController.createPaymentOrder);

/**
 * POST /api/v1/payment/verify
 * Verify Razorpay payment signature and trigger NFT minting
 * 
 * @auth Required - Bearer token
 * @body {string} orderId - Razorpay order ID
 * @body {string} paymentId - Razorpay payment ID from response
 * @body {string} signature - Razorpay payment signature for verification
 * @returns {object} { verified, paymentId, message }
 * 
 * @example
 * POST /api/v1/payment/verify
 * Headers: Authorization: Bearer <token>
 * {
 *   "orderId": "order_123",
 *   "paymentId": "pay_123",
 *   "signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
 * }
 * 
 * Response: {
 *   "verified": true,
 *   "paymentId": "pay_123",
 *   "message": "Payment verified successfully"
 * }
 */
router.post('/verify', authenticateToken, paymentController.verifyPayment);

/**
 * POST /api/v1/payment/webhook
 * Razorpay webhook handler for payment events
 * Webhook signature validated with X-Razorpay-Signature header
 * 
 * @body {string} event - Event type (payment.authorized, payment.captured, etc.)
 * @body {object} payload - Event payload with payment/order details
 * @returns {object} { received: true }
 * 
 * Non-authenticated endpoint - Called by Razorpay servers
 */
router.post('/webhook', paymentController.handleWebhook);

/**
 * GET /api/v1/payment/history
 * Get user's payment history with pagination
 * 
 * @auth Required - Bearer token
 * @query {number} [limit=10] - Number of records per page
 * @query {number} [offset=0] - Pagination offset
 * @returns {object} { payments, total, limit, offset }
 * 
 * @example
 * GET /api/v1/payment/history?limit=20&offset=0
 * Headers: Authorization: Bearer <token>
 * 
 * Response: {
 *   "payments": [
 *     {
 *       "orderId": "order_1",
 *       "eventId": "event_1",
 *       "amount": 500,
 *       "status": "verified",
 *       "paymentDate": "2024-01-15T10:30:00Z",
 *       "ticketIds": ["token_001", "token_002"]
 *     }
 *   ],
 *   "total": 5
 * }
 */
router.get('/history', authenticateToken, paymentController.getPaymentHistory);

/**
 * GET /api/v1/payment/status
 * Get payment status by order ID
 * 
 * @auth Optional - No auth required
 * @query {string} orderId - Order ID to check status for
 * @returns {object} { orderId, status, amount, currency, verifiedAt }
 * 
 * @example
 * GET /api/v1/payment/status?orderId=order_123
 * 
 * Response: {
 *   "orderId": "order_123",
 *   "status": "verified",
 *   "amount": 500,
 *   "currency": "INR"
 * }
 */
router.get('/status', paymentController.getPaymentStatus);

export default router;
