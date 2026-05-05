const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');

const authMiddleware = require('../middleware/authMiddleware');
const { createOrder, verifyPaymentSignature, getPaymentDetails, refundPayment } = require('../service/razorpayService');
const { getEvent, mintTicket } = require('../service/blockchainService');
const { getIdentityByRawId } = require('../service/identityService');
const { createSignupOtp, verifySignupOtp } = require('../service/otpService');
const { sendOtpSms } = require('../service/smsService');

/**
 * POST /api/payment/create-order
 *
 * Merged: /tickets/request  +  /payment/create-order
 *
 * Body: { eventId, identity_id }
 *
 * 1. Validates identity & event from blockchain
 * 2. Sends OTP to identity's registered phone
 * 3. Creates Razorpay order (price from blockchain)
 *
 * Returns: { order_id, amount, currency, key_id, event }
 */
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { eventId, identity_id } = req.body;

    if (eventId === undefined || eventId === null || !identity_id) {
      return res.status(400).json({ success: false, message: 'eventId and identity_id are required' });
    }

    // ── 1. Validate identity ──
    const identity = await getIdentityByRawId(identity_id);
    if (!identity) {
      return res.status(404).json({ success: false, message: 'Identity not found. Please check your Aadhaar / Identity ID.' });
    }

    // ── 2. Fetch event from blockchain ──
    let event;
    try {
      event = await getEvent(Number(eventId));
    } catch (err) {
      return res.status(404).json({ success: false, message: 'Event not found on blockchain', error: err.message });
    }

    // ── 3. Check sold out ──
    if (event.ticketsMinted >= event.totalTickets) {
      return res.status(410).json({ success: false, message: 'Event is sold out' });
    }

    const amount = Number(event.price);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'This event is free — no payment required', event });
    }

    // ── 4. Send OTP ──
    const otpData = createSignupOtp(identity_id, String(eventId));
    try {
      await sendOtpSms(identity.phone_number, otpData.otp);
    } catch (smsErr) {
      return res.status(502).json({ success: false, message: 'Failed to send OTP', error: smsErr.message });
    }

    // ── 5. Create Razorpay order ──
    const result = await createOrder(amount, 'INR', {
      eventId: String(event.eventId),
      eventTitle: event.title,
      userId: String(req.user?.id),
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: 'Failed to create payment order', error: result.error });
    }

    console.log('✅ Order created:', result.order_id, '| OTP sent to:', identity.phone_number);
    return res.json({
      success: true,
      order_id: result.order_id,
      amount: result.amount,       // in paise
      currency: result.currency,
      key_id: result.key_id,
      otp_expires_in_minutes: otpData.expiresInMinutes,
      event: {
        eventId: event.eventId,
        title: event.title,
        venue: event.venue,
        date: event.date,
        price: amount,
        totalTickets: event.totalTickets,
        ticketsMinted: event.ticketsMinted,
      },
    });
  } catch (error) {
    console.error('❌ create-order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
});

/**
 * POST /api/payment/verify
 *
 * Merged: /payment/verify  +  /tickets/confirm
 *
 * Body: { order_id, payment_id, signature, eventId, identity_id, otp }
 *
 * 1. Verifies Razorpay signature (payment authenticity)
 * 2. Verifies OTP (identity authenticity)
 * 3. Mints NFT ticket on blockchain
 *
 * Returns: { success, token_id, tx_hash, payment_id }
 */
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { order_id, payment_id, signature, eventId, identity_id, otp } = req.body;
    const wallet_address = req.user?.wallet_address;

    if (!order_id || !payment_id || !signature || !eventId || !identity_id || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Required: order_id, payment_id, signature, eventId, identity_id, otp',
      });
    }

    if (!wallet_address) {
      return res.status(401).json({ success: false, message: 'User wallet address not found in token' });
    }

    // ── 1. Verify Razorpay signature ──
    const sigValid = verifyPaymentSignature(order_id, payment_id, signature);
    if (!sigValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature — payment not verified' });
    }

    // ── 2. Confirm payment is captured ──
    const paymentDetails = await getPaymentDetails(payment_id);
    if (!paymentDetails.success) {
      return res.status(400).json({ success: false, message: paymentDetails.error });
    }
    if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
      return res.status(400).json({ success: false, message: `Payment status is ${paymentDetails.status}` });
    }

    // ── 3. Verify OTP ──
    if (!verifySignupOtp(identity_id, String(eventId), otp)) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // ── 4. Verify identity exists ──
    const identity = await getIdentityByRawId(identity_id);
    if (!identity) {
      return res.status(404).json({ success: false, message: 'Identity not found' });
    }

    // ── 5. Verify event exists ──
    let event;
    try {
      event = await getEvent(Number(eventId));
    } catch (err) {
      return res.status(404).json({ success: false, message: 'Event not found', error: err.message });
    }

    // ── 6. Build commitment hash ──
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes(secret + identity_id + eventId));

    // ── 7. Mint NFT ticket ──
    let txResult;
    try {
      txResult = await mintTicket(wallet_address, eventId, messageHash);
    } catch (err) {
      return res.status(502).json({ success: false, message: 'Payment verified but failed to mint ticket', error: err.message });
    }

    console.log('✅ Ticket minted:', txResult.tokenId, '| tx:', txResult.transactionHash);
    return res.status(201).json({
      success: true,
      message: 'Payment verified and ticket minted!',
      token_id: txResult.tokenId,
      tx_hash: txResult.transactionHash,
      payment_id: paymentDetails.payment_id,
      order_id: paymentDetails.order_id,
      amount: paymentDetails.amount,
      event: {
        eventId: event.eventId,
        title: event.title,
        venue: event.venue,
      },
    });
  } catch (error) {
    console.error('❌ verify error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
});

/**
 * POST /api/payment/refund
 */
router.post('/refund', authMiddleware, async (req, res) => {
  try {
    const { payment_id, amount } = req.body;
    if (!payment_id) return res.status(400).json({ success: false, message: 'payment_id is required' });

    const result = await refundPayment(payment_id, amount ? parseFloat(amount) : null, {
      reason: 'Customer requested refund',
      user_id: req.user.id,
    });

    if (!result.success) return res.status(400).json({ success: false, message: result.error });

    return res.json({
      success: true,
      message: 'Refund processed',
      refund_id: result.refund_id,
      payment_id: result.payment_id,
      amount: result.amount,
      status: result.status,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Refund failed', error: error.message });
  }
});

module.exports = router;
