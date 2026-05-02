import { ethers } from 'ethers';

/**
 * Gate Verification Controller
 * Handles entry gate verification, QR scanning, and ticket validation
 * Used by gate scanner application at event venues
 */

// Mock gate statistics - in production, use MongoDB
const GATE_STATS = new Map();

/**
 * Verify ticket at gate
 * Multi-step verification: QR → OTP → Commitment → Mark Used
 */
export const verifyTicketAtGate = async (req, res) => {
  try {
    const { tokenId, eventId, aadhaarId, currentOTP } = req.body;
    const gateOperatorId = req.user?.id || 'scanner_app'; // May not be authenticated

    // Validate input
    if (!tokenId || !eventId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'tokenId and eventId are required',
      });
    }

    console.log('[GATE] Verification request:', tokenId, 'at event:', eventId);

    // Step 1: Verify QR and ticket exists
    // TODO: Query smart contract for ticket ownership
    const ticketExists = true; // Mock check
    if (!ticketExists) {
      return res.status(404).json({
        error: 'Invalid Ticket',
        message: 'Ticket QR code not found on-chain',
      });
    }

    // Step 2: Check if ticket already used
    // TODO: Query smart contract for ticket.used status
    const ticketAlreadyUsed = false; // Mock check
    if (ticketAlreadyUsed) {
      return res.status(400).json({
        error: 'Ticket Already Used',
        message: 'This ticket has already been used for entry',
      });
    }

    // Step 3: Verify OTP if Aadhaar provided
    if (aadhaarId && currentOTP) {
      // In production, verify against OTP sent to Aadhaar phone
      const otpValid = currentOTP.length === 6; // Mock validation
      if (!otpValid) {
        return res.status(400).json({
          error: 'Invalid OTP',
          message: 'OTP verification failed',
        });
      }
    }

    // Step 4: Get identity information
    const identityInfo = {
      aadhaarId: aadhaarId || 'not_provided',
      name: 'Verified User',
      photoUrl: 'ipfs://QmPhotoSample',
      verified: !!aadhaarId,
    };

    // Step 5: Prepare response with ticket details
    const verificationResult = {
      tokenId,
      eventId,
      verified: true,
      identity: identityInfo,
      verificationTime: new Date(),
      nextStep: 'Mark as used on entry',
    };

    // TODO: In production, call smart contract markUsed() here
    // await ticketContract.markUsed(tokenId);

    // Update gate statistics
    updateGateStats(eventId, gateOperatorId, 'verified');

    console.log('[GATE] Verification successful:', tokenId);

    res.json(verificationResult);
  } catch (error) {
    console.error('[GATE/VERIFY]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Mark ticket as used after gate entry
 * Called after successful verification and physical entry
 */
export const markTicketUsed = async (req, res) => {
  try {
    const { tokenId, eventId } = req.body;
    const gateOperatorId = req.user?.id || 'scanner_app';

    // Validate input
    if (!tokenId || !eventId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'tokenId and eventId are required',
      });
    }

    // TODO: Call smart contract markUsed(tokenId)
    // const tx = await ticketContract.markUsed(tokenId);
    // const receipt = await tx.wait();

    console.log('[GATE] Marked as used:', tokenId);

    updateGateStats(eventId, gateOperatorId, 'used');

    res.json({
      tokenId,
      marked: true,
      usedAt: new Date(),
      message: 'Ticket marked as used successfully',
      entryGranted: true,
    });
  } catch (error) {
    console.error('[GATE/MARK-USED]', error);
    res.status(500).json({ error: 'Failed to mark ticket as used' });
  }
};

/**
 * Get gate verification statistics
 */
export const getGateStats = async (req, res) => {
  try {
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'eventId query parameter is required',
      });
    }

    const stats = GATE_STATS.get(eventId) || {
      eventId,
      totalVerified: 0,
      totalUsed: 0,
      verificationFailed: 0,
      duplicateAttempts: 0,
      lastUpdated: new Date(),
    };

    res.json(stats);
  } catch (error) {
    console.error('[GATE/STATS]', error);
    res.status(500).json({ error: 'Failed to fetch gate statistics' });
  }
};

/**
 * Verify QR Code scanned from ticket
 * Alternative endpoint for scanner apps that send raw QR data
 */
export const verifyQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'qrData is required',
      });
    }

    // Parse QR data
    let parsedData;
    try {
      parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid QR Data',
        message: 'QR data is not valid JSON',
      });
    }

    const { tokenId, eventId } = parsedData;

    // Forward to main verification endpoint
    req.body = { tokenId, eventId };
    return verifyTicketAtGate(req, res);
  } catch (error) {
    console.error('[GATE/QR-VERIFY]', error);
    res.status(500).json({ error: 'Failed to verify QR code' });
  }
};

/**
 * Helper function to update gate statistics
 */
function updateGateStats(eventId, operatorId, action) {
  if (!GATE_STATS.has(eventId)) {
    GATE_STATS.set(eventId, {
      eventId,
      totalVerified: 0,
      totalUsed: 0,
      verificationFailed: 0,
      duplicateAttempts: 0,
      operators: new Map(),
      lastUpdated: new Date(),
    });
  }

  const stats = GATE_STATS.get(eventId);

  if (action === 'verified') {
    stats.totalVerified += 1;
  } else if (action === 'used') {
    stats.totalUsed += 1;
  } else if (action === 'failed') {
    stats.verificationFailed += 1;
  } else if (action === 'duplicate') {
    stats.duplicateAttempts += 1;
  }

  stats.lastUpdated = new Date();

  // Track per-operator stats
  if (!stats.operators.has(operatorId)) {
    stats.operators.set(operatorId, { verified: 0, used: 0 });
  }
  const opStats = stats.operators.get(operatorId);
  if (action === 'verified') opStats.verified += 1;
  if (action === 'used') opStats.used += 1;
}

/**
 * Get operator verification stats
 */
export const getOperatorStats = async (req, res) => {
  try {
    const { eventId, operatorId } = req.query;

    if (!eventId || !operatorId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'eventId and operatorId query parameters are required',
      });
    }

    const stats = GATE_STATS.get(eventId);
    if (!stats) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No statistics found for this event',
      });
    }

    const opStats = stats.operators?.get(operatorId) || { verified: 0, used: 0 };

    res.json({
      eventId,
      operatorId,
      verified: opStats.verified,
      used: opStats.used,
      efficiency: opStats.verified > 0 ? ((opStats.used / opStats.verified) * 100).toFixed(2) + '%' : 'N/A',
    });
  } catch (error) {
    console.error('[GATE/OPERATOR-STATS]', error);
    res.status(500).json({ error: 'Failed to fetch operator statistics' });
  }
};

export default {
  verifyTicketAtGate,
  markTicketUsed,
  getGateStats,
  verifyQRCode,
  getOperatorStats,
};

export const markEntryComplete = async (req, res) => {
  // Mark ticket as used in smart contract
};

export const getVerificationStats = async (req, res) => {
  // Get gate verification statistics
};
