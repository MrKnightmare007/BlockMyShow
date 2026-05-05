const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in rupees (will be converted to paise)
 * @param {string} currency - Currency code (default: INR)
 * @param {object} notes - Additional notes for the order
 */
const createOrder = async (amount, currency = 'INR', notes = {}) => {
  try {
    const amountInPaise = Math.round(amount * 100);
    
    const options = {
      amount: amountInPaise,
      currency,
      notes
    };

    const order = await razorpay.orders.create(options);
    
    return {
      success: true,
      order_id: order.id,
      amount: amountInPaise,
      currency,
      key_id: process.env.RAZORPAY_KEY_ID
    };
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Signature from payment response
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature Verification Error:', error);
    return false;
  }
};

/**
 * Get payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 */
const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    
    return {
      success: true,
      payment_id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email,
      contact: payment.contact
    };
  } catch (error) {
    console.error('Get Payment Details Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Refund a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund in rupees (optional, full refund if not specified)
 * @param {object} notes - Refund notes
 */
const refundPayment = async (paymentId, amount = null, notes = {}) => {
  try {
    const options = {
      notes
    };

    if (amount) {
      options.amount = Math.round(amount * 100);
    }

    const refund = await razorpay.payments.refund(paymentId, options);
    
    return {
      success: true,
      refund_id: refund.id,
      payment_id: refund.payment_id,
      amount: refund.amount,
      status: refund.status
    };
  } catch (error) {
    console.error('Refund Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  refundPayment
};
