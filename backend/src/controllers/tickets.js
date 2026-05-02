import QRCode from 'qrcode';
import { ethers } from 'ethers';

/**
 * Tickets Controller
 * Handles NFT ticket minting, verification, and management
 */

// Mock tickets database - in production, use MongoDB
const TICKETS_DB = {};

/**
 * Get all user's tickets
 */
export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, status = 'active' } = req.query;

    // TODO: Query tickets from DB for this user
    const userTickets = Object.values(TICKETS_DB).filter((ticket) => ticket.userId === userId);

    // Filter by status
    const filteredTickets = userTickets.filter((ticket) => {
      if (status === 'active') return !ticket.used;
      if (status === 'used') return ticket.used;
      return true;
    });

    const paginatedTickets = filteredTickets.slice(offset, offset + limit);

    res.json({
      tickets: paginatedTickets,
      total: filteredTickets.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[TICKETS/GET-MY]', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

/**
 * Get ticket details by token ID
 */
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Ticket ID is required',
      });
    }

    // TODO: Query from smart contract or DB
    const ticket = TICKETS_DB[id];

    if (!ticket) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Ticket ${id} not found`,
      });
    }

    res.json({
      ticket,
      qrCode: ticket.qrCode,
      verification: {
        used: ticket.used,
        usedAt: ticket.usedAt || null,
      },
    });
  } catch (error) {
    console.error('[TICKETS/GET-BY-ID]', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
};

/**
 * Mint NFT ticket after successful payment
 * Called by payment webhook handler
 */
export const mintTicket = async (req, res) => {
  try {
    const { eventId, orderId, aadhaarId, commitment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!eventId || !orderId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'eventId and orderId are required',
      });
    }

    // TODO: Verify order is paid via payment DB
    // TODO: Call TicketNFT.mintTicket() on smart contract

    const tokenId = `token_${Date.now()}`;
    const qrCode = await QRCode.toDataURL(
      JSON.stringify({
        tokenId,
        eventId,
        aadhaarId,
        userAddress: req.user.walletAddress,
      })
    );

    const newTicket = {
      tokenId,
      userId,
      eventId,
      orderId,
      aadhaarId,
      commitment: commitment || '0x' + '0'.repeat(64),
      qrCode,
      used: false,
      createdAt: new Date(),
    };

    // TODO: Store in DB
    TICKETS_DB[tokenId] = newTicket;

    console.log('[TICKETS] Minted:', tokenId);

    res.status(201).json({
      ticket: newTicket,
      message: 'Ticket minted successfully',
      onChainSync: 'pending',
    });
  } catch (error) {
    console.error('[TICKETS/MINT]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Verify ticket authenticity
 * Checks on-chain for valid NFT
 */
export const verifyTicket = async (req, res) => {
  try {
    const { tokenId } = req.params;

    if (!tokenId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'tokenId is required',
      });
    }

    const ticket = TICKETS_DB[tokenId];

    if (!ticket) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Ticket not found',
      });
    }

    // TODO: Query smart contract to verify NFT ownership
    // TODO: Check commitment matches stored value

    res.json({
      valid: true,
      ticket: {
        tokenId,
        eventId: ticket.eventId,
        owner: ticket.userId,
        used: ticket.used,
      },
      message: 'Ticket verified successfully',
    });
  } catch (error) {
    console.error('[TICKETS/VERIFY]', error);
    res.status(500).json({ error: 'Failed to verify ticket' });
  }
};

/**
 * Get QR code for ticket
 */
export const getTicketQR = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const userId = req.user.id;

    if (!tokenId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'tokenId is required',
      });
    }

    const ticket = TICKETS_DB[tokenId];

    if (!ticket) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Ticket not found',
      });
    }

    // Verify ownership
    if (ticket.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not own this ticket',
      });
    }

    // Generate fresh QR code with current data
    const qrData = {
      tokenId,
      eventId: ticket.eventId,
      aadhaarId: ticket.aadhaarId,
      timestamp: Date.now(),
      userAddress: req.user.walletAddress,
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    res.json({
      tokenId,
      qrCode,
      scanURL: `/api/v1/gate/verify-qr?data=${encodeURIComponent(JSON.stringify(qrData))}`,
    });
  } catch (error) {
    console.error('[TICKETS/QR]', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

export default {
  getMyTickets,
  getTicketById,
  mintTicket,
  verifyTicket,
  getTicketQR,
};
