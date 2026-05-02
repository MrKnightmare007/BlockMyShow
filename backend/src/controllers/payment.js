import crypto from 'crypto';
import { sendTicketConfirmationEmail } from '../utils/email.js';

/**
 * Payment Controller
 * Handles Razorpay payment integration, order creation, and verification
 */

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'test_key';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook';

/**
 * Create Razorpay payment order
 * Initiates payment flow for ticket purchase
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { eventId, ticketCount, amount, email, phone } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!eventId || !ticketCount || !amount) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'eventId, ticketCount, and amount are required',
      });
    }

    // TODO: Fetch actual event details from DB
    // TODO: Verify ticket availability before creating order

    // Mock Razorpay order creation
    const orderId = `order_${Date.now()}`;
    const orderData = {
      orderId,
      userId,
      eventId,
      ticketCount,
      amount,
      currency: 'INR',
      email: email || req.user.email,
      phone,
      status: 'created',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };

    // TODO: Save order to DB (orders collection)

    console.log('[PAYMENT] Order created:', orderId);

    res.status(201).json({
      orderId,
      keyId: RAZORPAY_KEY_ID,
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      email: orderData.email,
      phone: orderData.phone,
      prefill: {
        name: req.user.email?.split('@')[0],
        email: orderData.email,
        contact: phone,
      },
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('[PAYMENT/CREATE-ORDER]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Verify payment signature from Razorpay
 * Confirms successful payment before minting NFT
 */
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    // Validate input
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'orderId, paymentId, and signature are required',
      });
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({
        error: 'Signature Verification Failed',
        message: 'Payment signature does not match',
      });
    }

    // TODO: Update order status in DB to 'verified'
    // TODO: Trigger NFT minting on-chain

    console.log('[PAYMENT] Payment verified:', paymentId);

    res.json({
      verified: true,
      paymentId,
      message: 'Payment verified successfully',
      nextStep: 'NFT will be minted shortly',
    });
  } catch (error) {
    console.error('[PAYMENT/VERIFY]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Razorpay webhook handler
 * Receives payment events from Razorpay servers
 */
export const handleWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;

    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({
        error: 'Signature Verification Failed',
        message: 'Webhook signature invalid',
      });
    }

    console.log('[PAYMENT/WEBHOOK]', event);

    // Handle different webhook events
    switch (event) {
      case 'payment.authorized':
        // Payment authorized but not captured
        await handlePaymentAuthorized(payload);
        break;
      case 'payment.failed':
        // Payment failed
        await handlePaymentFailed(payload);
        break;
      case 'payment.captured':
        // Payment captured successfully - trigger NFT minting
        await handlePaymentCaptured(payload);
        break;
      case 'order.paid':
        // Order marked as paid
        await handleOrderPaid(payload);
        break;
      default:
        console.log('[PAYMENT/WEBHOOK] Unknown event:', event);
    }

    // Always return success to Razorpay
    res.json({ received: true });
  } catch (error) {
    console.error('[PAYMENT/WEBHOOK]', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Handle payment.authorized webhook event
 */
async function handlePaymentAuthorized(payload) {
  const { payment } = payload;
  console.log('[PAYMENT] Authorized:', payment.id);
  // TODO: Update DB with authorization status
}

/**
 * Handle payment.failed webhook event
 */
async function handlePaymentFailed(payload) {
  const { payment } = payload;
  console.error('[PAYMENT] Failed:', payment.id, payment.error_description);
  // TODO: Update DB with failure status
  // TODO: Notify user of failed payment
}

/**
 * Handle payment.captured webhook event - CRITICAL
 * This is when we trigger NFT minting
 */
async function handlePaymentCaptured(payload) {
  const { payment } = payload;
  const { id, order_id, notes, email } = payment;

  console.log('[PAYMENT] Captured - Triggering NFT mint:', id);

  // TODO: Extract ticket metadata from notes
  // TODO: Call TicketNFT contract to mint ticket
  // TODO: Store NFT tokenId in DB
  // TODO: Generate QR code with tokenId

  // Send confirmation email if email is available
  if (email && notes) {
    try {
      const ticketData = {
        eventTitle: notes.eventTitle || 'Ticket Event',
        ticketId: notes.tokenId || id,
        price: notes.amount || 'TBD',
        date: notes.eventDate || 'TBD',
        venue: notes.eventVenue || 'TBD',
      };
      await sendTicketConfirmationEmail(email, ticketData);
      console.log('[PAYMENT] Confirmation email sent to', email);
    } catch (emailError) {
      console.error('[PAYMENT] Failed to send confirmation email:', emailError.message);
      // Don't fail the payment process if email fails
    }
  }
}

/**
 * Handle order.paid webhook event
 */
async function handleOrderPaid(payload) {
  const { order } = payload;
  console.log('[PAYMENT] Order paid:', order.id);
  // TODO: Update order status in DB
}

/**
 * Get payment history for user
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    // TODO: Query orders from DB for this user
    const mockOrders = [
      {
        orderId: 'order_1',
        eventId: 'event_1',
        amount: 500,
        currency: 'INR',
        status: 'verified',
        ticketCount: 2,
        paymentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ticketIds: ['token_001', 'token_002'],
      },
    ];

    res.json({
      payments: mockOrders,
      total: mockOrders.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[PAYMENT/HISTORY]', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

/**
 * Get payment status
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'orderId query parameter is required',
      });
    }

    // TODO: Query order status from DB
    const mockOrder = {
      orderId,
      status: 'verified',
      amount: 500,
      currency: 'INR',
      ticketCount: 2,
      createdAt: new Date(),
      verifiedAt: new Date(),
    };

    res.json(mockOrder);
  } catch (error) {
    console.error('[PAYMENT/STATUS]', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};

export default {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  getPaymentStatus,
};

/**
 * Create order - Mobile app wrapper
 * Simplified endpoint for mobile payment flow
 */
export const createOrder = async (req, res) => {
  try {
    const { eventId, amount, ticketCount } = req.body;

    if (!eventId || !amount || !ticketCount) {
      return res.status(400).json({
        success: false,
        message: 'eventId, amount, and ticketCount are required'
      });
    }

    // Mock order creation
    const orderId = `order_${Date.now()}`;

    console.log('[PAYMENT] Mobile order created:', orderId);

    return res.status(200).json({
      success: true,
      orderId,
      amount,
      currency: 'INR',
      ticketCount,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('[PAYMENT/CREATE-ORDER]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
};
