const crypto = require('crypto')

const DEFAULT_OTP_WINDOW_MS = 10 * 60 * 1000
const configuredOtpWindowMs = Number(process.env.OTP_WINDOW_MS || DEFAULT_OTP_WINDOW_MS)
const OTP_WINDOW_MS = configuredOtpWindowMs > 0
  ? configuredOtpWindowMs
  : DEFAULT_OTP_WINDOW_MS

const getOtpSecret = () => {
  return process.env.OTP_SECRET || process.env.JWT_SECRET
}

const getTimeWindow = (time = Date.now()) => {
  return Math.floor(time / OTP_WINDOW_MS)
}

const buildOtpPayload = (email, password, timeWindow) => {
  return `${email}:${password}:${timeWindow}`
}

const generateOtpForWindow = (email, password, timeWindow) => {
  const secret = getOtpSecret()

  if (!secret) {
    throw new Error('OTP_SECRET or JWT_SECRET is required')
  }

  const digest = crypto
    .createHmac('sha256', secret)
    .update(buildOtpPayload(email, password, timeWindow))
    .digest('hex')

  const code = parseInt(digest.slice(0, 8), 16) % 1000000
  return String(code).padStart(6, '0')
}

const createSignupOtp = (email, password) => {
  return {
    otp: generateOtpForWindow(email, password, getTimeWindow()),
    expiresInMinutes: Math.ceil(OTP_WINDOW_MS / 60000)
  }
}

const verifySignupOtp = (email, password, otp) => {
  const cleanOtp = String(otp).trim()
  const currentWindow = getTimeWindow()
  const allowedWindows = [currentWindow, currentWindow - 1]

  return allowedWindows.some((timeWindow) => {
    return generateOtpForWindow(email, password, timeWindow) === cleanOtp
  })
}

/**
 * @notice Generate OTP for ticket resale (two-step verification)
 * @param tokenId Ticket ID being purchased
 * @param buyerIdentity Buyer's identity (e.g., passport/ID number)
 * @returns Object with OTP code and expiration time
 */
const createResaleOtp = (tokenId, buyerIdentity) => {
  return {
    otp: generateOtpForWindow(String(tokenId), buyerIdentity, getTimeWindow()),
    expiresInMinutes: Math.ceil(OTP_WINDOW_MS / 60000)
  }
}

/**
 * @notice Verify OTP for ticket resale purchase
 * @param tokenId Ticket ID being purchased
 * @param buyerIdentity Buyer's identity (e.g., passport/ID number)
 * @param otp OTP code to verify
 * @returns Boolean indicating if OTP is valid
 */
const verifyResaleOtp = (tokenId, buyerIdentity, otp) => {
  const cleanOtp = String(otp).trim()
  const currentWindow = getTimeWindow()
  const allowedWindows = [currentWindow, currentWindow - 1]

  return allowedWindows.some((timeWindow) => {
    return generateOtpForWindow(String(tokenId), buyerIdentity, timeWindow) === cleanOtp
  })
}

module.exports = {
  createSignupOtp,
  verifySignupOtp,
  createResaleOtp,
  verifyResaleOtp
}
