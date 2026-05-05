const { createUser, getUserByEmail, getUserByWallet } = require('../models/userModel')
const { hashPassword, comparePassword } = require('../utils/hash')
const { generateToken } = require('../service/jwtService')
const {
  createSignupOtp,
  verifySignupOtp
} = require('../service/otpService')
const {
  sendOtpEmail,
  sendWalletEmail
} = require('../service/mailService')
const { generateWallet } = require('../utils/generateWallet')

const sanitizeUser = (user) => {
  if (!user) return user

  const { password, ...safeUser } = user
  return safeUser
}

const buildUserToken = (user) => {
  return generateToken({
    id: user.$id,
    role: 'user',
    wallet_address: user.wallet_address
  })
}

const auth = async (req, res) => {
  try {
    const { email, password, otp } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existing = await getUserByEmail(normalizedEmail)

    if (existing) {
      const valid = await comparePassword(password, existing.password)

      if (!valid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        })
      }

      const token = buildUserToken(existing)

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: sanitizeUser(existing)
      })
    }

    if (otp) {
      if (!verifySignupOtp(normalizedEmail, password, otp)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid OTP'
        })
      }

      const hashedPassword = await hashPassword(password)
      const wallet = generateWallet()

      await sendWalletEmail(normalizedEmail, wallet.privateKey, wallet.address)

      const user = await createUser({
        email: normalizedEmail,
        password: hashedPassword,
        wallet_address: wallet.address
      })

      const token = buildUserToken(user)

      return res.status(201).json({
        success: true,
        message: 'Signup verified successfully',
        token,
        wallet_address: wallet.address,
        user: sanitizeUser(user)
      })
    }

    const signupOtp = createSignupOtp(normalizedEmail, password)

    try {
      await sendOtpEmail(normalizedEmail, signupOtp.otp)
    } catch (mailError) {
      return res.status(502).json({
        success: false,
        message: 'Could not send OTP email',
        error: mailError.message
      })
    }

    return res.status(202).json({
      success: true,
      message: 'OTP sent to email',
      otpRequired: true,
      expiresInMinutes: signupOtp.expiresInMinutes
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

const googleAuth = async (req, res) => {
  try {
    const { email, name, uid } = req.body
    if (!email) return res.status(400).json({ success: false, message: 'Email required' })

    const normalizedEmail = email.trim().toLowerCase()
    let user = await getUserByEmail(normalizedEmail)

    if (!user) {
      // Create new user for first-time Google login
      const wallet = generateWallet()
      await sendWalletEmail(normalizedEmail, wallet.privateKey, wallet.address)
      
      user = await createUser({
        email: normalizedEmail,
        name: name || email.split('@')[0],
        wallet_address: wallet.address,
        auth_provider: 'google',
        firebase_uid: uid
      })
    }

    const token = buildUserToken(user)
    res.json({
      success: true,
      token,
      user: sanitizeUser(user)
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

const walletAuth = async (req, res) => {
  try {
    const { walletAddress } = req.body
    if (!walletAddress) return res.status(400).json({ success: false, message: 'Wallet address required' })

    let user = await getUserByWallet(walletAddress)

    if (!user) {
      // Create new user for first-time Wallet login
      user = await createUser({
        wallet_address: walletAddress,
        auth_provider: 'metamask',
        email: `wallet_${walletAddress.slice(0, 8)}@blockmyshow.internal` // Fallback email
      })
    }

    const token = buildUserToken(user)
    res.json({
      success: true,
      token,
      user: sanitizeUser(user)
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

module.exports = {
  auth,
  googleAuth,
  walletAuth
}
