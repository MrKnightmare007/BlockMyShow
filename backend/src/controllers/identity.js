import crypto from 'crypto';

/**
 * Identity Verification Controller
 * Handles OTP verification, Aadhaar lookup, and ZK commitments
 */

// Mock Aadhaar registry - in production, connect to real source
const AADHAAR_REGISTRY = {
  '111111111111': {
    name: 'Rajesh Kumar',
    phone: '+91-9876543210',
    photo: 'ipfs://QmSample1',
    secret: crypto.randomBytes(32).toString('hex'),
  },
  '222222222222': {
    name: 'Priya Singh',
    phone: '+91-8765432109',
    photo: 'ipfs://QmSample2',
    secret: crypto.randomBytes(32).toString('hex'),
  },
};

// Mock OTP store - in production, use Redis
const OTP_STORE = new Map();
const COMMITMENT_STORE = new Map();

/**
 * Send OTP to Aadhaar-linked phone number
 */
export const sendOTP = async (req, res) => {
  try {
    const { aadhaarId, phone } = req.body;

    // Validate input
    if (!aadhaarId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'aadhaarId is required',
      });
    }

    // Validate Aadhaar format (simplified)
    if (aadhaarId.length !== 12 || isNaN(aadhaarId)) {
      return res.status(400).json({
        error: 'Invalid Aadhaar',
        message: 'Aadhaar ID must be 12 digits',
      });
    }

    // TODO: In production, verify Aadhaar with UIDAI
    // For now, check mock registry
    const aadhaarData = AADHAAR_REGISTRY[aadhaarId];
    if (!aadhaarData) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Aadhaar ID not found in registry',
      });
    }

    // Verify phone number matches
    if (phone && phone !== aadhaarData.phone) {
      return res.status(400).json({
        error: 'Phone Mismatch',
        message: 'Phone number does not match Aadhaar record',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP temporarily
    OTP_STORE.set(aadhaarId, {
      otp,
      expiresAt,
      attempts: 0,
    });

    console.log('[IDENTITY] OTP sent to', aadhaarData.phone, '- OTP:', otp);

    // TODO: Actually send SMS via provider
    // await sendSMSViaProvider(aadhaarData.phone, `Your OTP is: ${otp}`);

    res.json({
      aadhaarId,
      phone: aadhaarData.phone, // Masked in production
      message: 'OTP sent successfully',
      expiresIn: 600, // seconds
    });
  } catch (error) {
    console.error('[IDENTITY/SEND-OTP]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Verify OTP and return identity information
 */
export const verifyOTP = async (req, res) => {
  try {
    const { aadhaarId, otp } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!aadhaarId || !otp) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'aadhaarId and otp are required',
      });
    }

    const storedOTP = OTP_STORE.get(aadhaarId);

    // Check if OTP exists
    if (!storedOTP) {
      return res.status(400).json({
        error: 'OTP Not Found',
        message: 'No OTP requested for this Aadhaar ID',
      });
    }

    // Check if OTP expired
    if (Date.now() > storedOTP.expiresAt) {
      OTP_STORE.delete(aadhaarId);
      return res.status(400).json({
        error: 'OTP Expired',
        message: 'OTP has expired. Request a new OTP.',
      });
    }

    // Check attempt limit
    if (storedOTP.attempts >= 5) {
      OTP_STORE.delete(aadhaarId);
      return res.status(429).json({
        error: 'Too Many Attempts',
        message: 'Too many failed OTP verification attempts. Request a new OTP.',
      });
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      storedOTP.attempts += 1;
      return res.status(400).json({
        error: 'Invalid OTP',
        message: 'OTP does not match. Please try again.',
        attemptsRemaining: 5 - storedOTP.attempts,
      });
    }

    // OTP verified successfully
    OTP_STORE.delete(aadhaarId);

    const aadhaarData = AADHAAR_REGISTRY[aadhaarId];
    const identityInfo = {
      aadhaarId,
      name: aadhaarData.name,
      phone: aadhaarData.phone,
      photoUrl: aadhaarData.photo,
      verified: true,
      verifiedAt: new Date(),
    };

    // TODO: Store in user's identity record in DB
    console.log('[IDENTITY] OTP verified for', aadhaarId);

    res.json({
      identity: identityInfo,
      message: 'Identity verified successfully',
      readyForCommitment: true,
    });
  } catch (error) {
    console.error('[IDENTITY/VERIFY-OTP]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Generate ZK commitment hash
 * Creates commitment for privacy-preserving identity storage
 */
export const generateCommitment = async (req, res) => {
  try {
    const { aadhaarId } = req.body;
    const userId = req.user.id;

    if (!aadhaarId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'aadhaarId is required',
      });
    }

    const aadhaarData = AADHAAR_REGISTRY[aadhaarId];
    if (!aadhaarData) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Aadhaar not found',
      });
    }

    // Create commitment hash: H(aadhaarId || secret || userAddress)
    const secret = aadhaarData.secret;
    const userAddress = req.user.walletAddress;
    const commitmentString = `${aadhaarId}${secret}${userAddress}`;

    const commitment = crypto
      .createHash('sha256')
      .update(commitmentString)
      .digest('hex');

    // Store commitment reference
    COMMITMENT_STORE.set(commitment, {
      userId,
      aadhaarId,
      userAddress,
      createdAt: new Date(),
    });

    console.log('[IDENTITY] Commitment generated:', commitment.slice(0, 16) + '...');

    res.json({
      commitment: `0x${commitment}`, // Format for smart contract
      message: 'Commitment generated successfully',
      readyForMinting: true,
    });
  } catch (error) {
    console.error('[IDENTITY/COMMITMENT]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Get identity information by Aadhaar ID
 */
export const getIdentityInfo = async (req, res) => {
  try {
    const { aadhaarId } = req.params;

    if (!aadhaarId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'aadhaarId is required',
      });
    }

    const aadhaarData = AADHAAR_REGISTRY[aadhaarId];
    if (!aadhaarData) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Aadhaar not found',
      });
    }

    // Return public information only
    res.json({
      name: aadhaarData.name,
      photoUrl: aadhaarData.photo,
      verified: true,
    });
  } catch (error) {
    console.error('[IDENTITY/GET-INFO]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Verify commitment on-chain
 * Checks if commitment matches stored value for gate verification
 */
export const verifyCommitment = async (req, res) => {
  try {
    const { commitment, aadhaarId } = req.body;

    if (!commitment || !aadhaarId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'commitment and aadhaarId are required',
      });
    }

    const storedCommitment = COMMITMENT_STORE.get(commitment.replace('0x', ''));

    if (!storedCommitment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Commitment not found',
      });
    }

    if (storedCommitment.aadhaarId !== aadhaarId) {
      return res.status(400).json({
        error: 'Mismatch',
        message: 'Commitment does not match Aadhaar ID',
      });
    }

    res.json({
      verified: true,
      aadhaarId: storedCommitment.aadhaarId,
      timestamp: storedCommitment.createdAt,
      message: 'Commitment verified successfully',
    });
  } catch (error) {
    console.error('[IDENTITY/VERIFY-COMMITMENT]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

export default {
  sendOTP,
  verifyOTP,
  generateCommitment,
  getIdentityInfo,
  verifyCommitment,
};
