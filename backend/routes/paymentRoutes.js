const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getEvent } = require('../service/blockchainService');
const {
  createOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  refundPayment
} = require('../service/razorpayService');

/**
 * POST /api/payment/create-order
 * Create a Razorpay order for ticket purchase.
 * Only requires `eventId` — price and event info are fetched from the blockchain.
 * Optionally accepts `amount` override for resale purchases.
 */
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { eventId, amount: overrideAmount } = req.body;
    const userId = req.user?.id;

    if (eventId === undefined || eventId === null) {
      return res.status(400).json({ success: false, message: 'eventId is required' });
    }

    // ── Fetch event from blockchain ──
    let event;
    try {
      event = await getEvent(Number(eventId));
    } catch (err) {
      console.error('❌ Failed to fetch event from chain:', err.message);
      return res.status(404).json({
        success: false,
        message: 'Event not found on blockchain',
        error: err.message
      });
    }

    // Use override amount (for resale) or blockchain price
    const amount = overrideAmount ? parseFloat(overrideAmount) : Number(event.price);

    console.log('📦 Payment Order:', {
      eventId,
      eventTitle: event.title,
      amount,
      userId,
      source: overrideAmount ? 'override (resale)' : 'blockchain'
    });

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Event has no valid price (free event?)',
        event: {
          eventId: event.eventId,
          title: event.title,
          price: event.price
        }
      });
    }

    // Check if sold out (only for primary sales)
    if (!overrideAmount && event.ticketsMinted >= event.totalTickets) {
      return res.status(410).json({
        success: false,
        message: 'Event is sold out',
        event: {
          eventId: event.eventId,
          title: event.title,
          ticketsMinted: event.ticketsMinted,
          totalTickets: event.totalTickets
        }
      });
    }

    // ── Create Razorpay order ──
    const result = await createOrder(amount, 'INR', {
      eventId: String(event.eventId),
      eventTitle: event.title,
      userId: String(userId)
    });

    if (!result.success) {
      console.error('❌ Razorpay order failed:', result.error);
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment order',
        error: result.error
      });
    }

    console.log('✅ Order created:', result.order_id);
    return res.json({
      success: true,
      order_id: result.order_id,
      amount: result.amount,
      currency: result.currency,
      key_id: result.key_id,
      event: {
        eventId: event.eventId,
        title: event.title,
        venue: event.venue,
        date: event.date,
        price: Number(event.price),
        totalTickets: event.totalTickets,
        ticketsMinted: event.ticketsMinted
      }
    });
  } catch (error) {
    console.error('❌ Payment Order Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
});

/**
 * POST /api/payment/verify
 * Verify Razorpay payment signature after checkout completes.
 */
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { order_id, payment_id, signature, eventId } = req.body;

    console.log('🔐 Payment Verify:', { order_id, payment_id, signature: signature?.slice(0, 20) + '...', eventId });

    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required: order_id, payment_id, signature'
      });
    }

    // Verify HMAC signature
    const isValid = verifyPaymentSignature(order_id, payment_id, signature);
    console.log('🔐 Signature valid:', isValid);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature — payment verification failed'
      });
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await getPaymentDetails(payment_id);
    if (!paymentDetails.success) {
      return res.status(400).json({
        success: false,
        message: paymentDetails.error
      });
    }

    // Payment must be captured or authorized
    if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
      return res.status(400).json({
        success: false,
        message: `Payment status is ${paymentDetails.status}`
      });
    }

    console.log('✅ Payment verified:', paymentDetails.payment_id);

    return res.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: paymentDetails.payment_id,
      order_id: paymentDetails.order_id,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      status: paymentDetails.status,
      next_step: 'otp_verification'
    });
  } catch (error) {
    console.error('❌ Payment Verification Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

/**
 * POST /api/payment/refund
 * Refund a payment (full or partial).
 */
router.post('/refund', authMiddleware, async (req, res) => {
  try {
    const { payment_id, amount } = req.body;

    console.log('🔄 Refund Request:', { payment_id, amount, userId: req.user?.id });

    if (!payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const refundAmount = amount ? parseFloat(amount) : null;
    const result = await refundPayment(payment_id, refundAmount, {
      reason: 'Customer requested refund',
      user_id: req.user.id
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    console.log('✅ Refund successful:', result.refund_id);
    return res.json({
      success: true,
      message: 'Refund processed successfully',
      refund_id: result.refund_id,
      payment_id: result.payment_id,
      amount: result.amount,
      status: result.status
    });
  } catch (error) {
    console.error('❌ Refund Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Refund failed',
      error: error.message
    });
  }
});

module.exports = router;
