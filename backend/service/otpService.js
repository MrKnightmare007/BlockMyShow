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

module.exports = {
  createSignupOtp,
  verifySignupOtp
}
