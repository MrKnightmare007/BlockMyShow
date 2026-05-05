const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')
const {
  ticketsRequest,
  ticketsConfirm,
  myTickets,
  listForResale,
  updateListPrice,
  cancelListing,
  getMarketplace,
  getTicketDetails
} = require('../controllers/ticketsController')

// ──── EXISTING ENDPOINTS ────
router.post('/request', authMiddleware, ticketsRequest)
router.post('/confirm', authMiddleware, ticketsConfirm)
router.get('/my-tickets', authMiddleware, myTickets)

// ──── RESALE MARKETPLACE ENDPOINTS ────

// List ticket for resale
router.post('/list', authMiddleware, listForResale)

// Update resale price
router.post('/update-list-price', authMiddleware, updateListPrice)

// Cancel resale listing
router.post('/cancel-listing', authMiddleware, cancelListing)

// Get all listed tickets (public marketplace)
router.get('/marketplace', getMarketplace)

// Buy resale - Step 1: Request OTP + Create Payment Order
router.post('/buy-resale/request', authMiddleware, async (req, res) => {
  try {
    const { token_id, tokenId, buyer_identity, buyerIdentity } = req.body;
    const tokenID = token_id || tokenId;
    const buyerIdentity_ = buyer_identity || buyerIdentity;
    const wallet_address = req.user?.wallet_address;

    console.log('🎫 Buy Resale Request:', { tokenID, buyerIdentity_, wallet_address });

    // Validate
    if (!tokenID || !buyerIdentity_) {
      return res.status(400).json({
        success: false,
        message: 'tokenId and buyerIdentity are required'
      });
    }

    if (!wallet_address) {
      return res.status(401).json({
        success: false,
        message: 'User wallet address not found'
      });
    }

    // Get Razorpay service
    const { createOrder } = require('../service/razorpayService');
    const { getTicketInfo, getTicketOwner } = require('../service/blockchainService');
    const { getIdentityByRawId } = require('../service/identityService');
    const { createResaleOtp } = require('../service/otpService');
    const { sendOtpSms } = require('../service/smsService');

    // ── 1. Verify ticket exists and is listed ──
    let ticket;
    try {
      ticket = await getTicketInfo(tokenID);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (!ticket.isListed) {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not listed for resale'
      });
    }

    if (ticket.used) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been used'
      });
    }

    // ── 2. Verify buyer identity exists ──
    const identity = await getIdentityByRawId(buyerIdentity_);
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Buyer identity not found'
      });
    }

    // ── 3. Verify seller still owns the ticket ──
    let seller;
    try {
      seller = await getTicketOwner(tokenID);
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Failed to verify ticket ownership',
        error: err.message
      });
    }

    if (!seller) {
      return res.status(400).json({
        success: false,
        message: 'Could not determine ticket seller'
      });
    }

    // ── 4. Generate and send OTP ──
    const otpData = createResaleOtp(tokenID, buyerIdentity_);
    try {
      await sendOtpSms(identity.phone_number, otpData.otp);
    } catch (smsErr) {
      return res.status(502).json({
        success: false,
        message: 'Failed to send OTP',
        error: smsErr.message
      });
    }

    // ── 5. Create Razorpay order for resale price ──
    const resalePrice = Number(ticket.salePrice) || 0;
    if (!resalePrice || resalePrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resale price'
      });
    }

    const orderResult = await createOrder(resalePrice, 'INR', {
      tokenId: String(tokenID),
      buyerIdentity: buyerIdentity_,
      sellerAddress: seller,
      buyerAddress: wallet_address
    });

    if (!orderResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment order',
        error: orderResult.error
      });
    }

    console.log('✅ Resale order created:', orderResult.order_id);
    return res.json({
      success: true,
      message: 'OTP sent and payment order created',
      order_id: orderResult.order_id,
      amount: orderResult.amount,
      currency: orderResult.currency,
      key_id: orderResult.key_id,
      otp_expires_in_minutes: otpData.expiresInMinutes,
      ticket: {
        tokenId: tokenID,
        resalePrice: resalePrice,
        sellerAddress: seller
      }
    });
  } catch (error) {
    console.error('❌ buy-resale/request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process resale request',
      error: error.message
    });
  }
});

// Buy resale - Step 2: Verify Payment + OTP + Transfer Ticket
router.post('/buy-resale/confirm', authMiddleware, async (req, res) => {
  try {
    const { token_id, tokenId, buyer_identity, buyerIdentity, otp, order_id, payment_id, signature } = req.body;
    const tokenID = token_id || tokenId;
    const buyerIdentity_ = buyer_identity || buyerIdentity;
    const wallet_address = req.user?.wallet_address;

    console.log('💳 Buy Resale Confirm:', { tokenID, buyerIdentity_, otp: otp ? '***' : 'missing', paymentId: payment_id ? '***' : 'missing' });

    // Validate
    if (!tokenID || !buyerIdentity_ || !otp || !order_id || !payment_id || !signature) {
      return res.status(400).json({
        success: false,
        message: 'tokenId, buyerIdentity, otp, order_id, payment_id, and signature are required'
      });
    }

    if (!wallet_address) {
      return res.status(401).json({
        success: false,
        message: 'User wallet address not found'
      });
    }

    // Get services
    const { verifyPaymentSignature, getPaymentDetails } = require('../service/razorpayService');
    const { getTicketInfo, buyResale } = require('../service/blockchainService');
    const { verifyResaleOtp } = require('../service/otpService');

    // ── 1. Verify Razorpay signature ──
    const sigValid = verifyPaymentSignature(order_id, payment_id, signature);
    if (!sigValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature — payment not verified'
      });
    }

    // ── 2. Confirm payment is captured ──
    const paymentDetails = await getPaymentDetails(payment_id);
    if (!paymentDetails.success) {
      return res.status(400).json({
        success: false,
        message: paymentDetails.error
      });
    }

    if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
      return res.status(400).json({
        success: false,
        message: `Payment status is ${paymentDetails.status}`
      });
    }

    // ── 3. Verify OTP ──
    const { verifyResaleOtp: verify } = require('../service/otpService');
    if (!verify(tokenID, buyerIdentity_, otp)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // ── 4. Verify ticket still exists and is listed ──
    let ticket;
    try {
      ticket = await getTicketInfo(tokenID);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (!ticket.isListed) {
      return res.status(400).json({
        success: false,
        message: 'Ticket is no longer listed for resale'
      });
    }

    if (ticket.used) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been used'
      });
    }

    // ── 5. Transfer ticket on blockchain ──
    let txResult;
    try {
      console.log('🔄 Transferring ticket:', tokenID, '→', wallet_address);
      // Generate new commitment for the buyer
      const crypto = require('crypto');
      const newCommitment = '0x' + crypto.randomBytes(32).toString('hex');
      txResult = await buyResale(tokenID, wallet_address, newCommitment);
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Payment verified but failed to transfer ticket',
        error: err.message
      });
    }

    console.log('✅ Resale completed:', tokenID, '| tx:', txResult.transactionHash);
    return res.status(201).json({
      success: true,
      message: 'Payment verified and ticket transferred!',
      token_id: tokenID,
      tx_hash: txResult.transactionHash,
      payment_id: paymentDetails.payment_id,
      order_id: paymentDetails.order_id,
      amount: paymentDetails.amount,
      buyer_address: wallet_address,
      seller_address: ticket.seller
    });
  } catch (error) {
    console.error('❌ buy-resale/confirm error:', error);
    return res.status(500).json({
      success: false,
      message: 'Resale confirmation failed',
      error: error.message
    });
  }
});

// Get single ticket details
router.get('/:tokenId', getTicketDetails)

module.exports = router
