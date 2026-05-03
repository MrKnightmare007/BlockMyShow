const { getAdminByUsername } = require('../models/adminModel')
const { comparePassword } = require('../utils/hash')
const { generateToken } = require('../service/jwtService')

const sanitizeAdmin = (admin) => {
  if (!admin) return admin

  const { password, ...safeAdmin } = admin
  return safeAdmin
}

const adminLogin = async (req, res) => {

  try {

    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      })
    }

    const normalizedUsername = username.trim().toLowerCase()
    const admin = await getAdminByUsername(normalizedUsername)

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      })
    }

    const valid = await comparePassword(password, admin.password)

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    const token = generateToken({
      id: admin.$id,
      role: admin.role
    })

    res.json({
      success: true,
      token,
      admin: sanitizeAdmin(admin)
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

module.exports = {
  adminLogin
}
