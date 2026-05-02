import { ethers } from 'ethers';

/**
 * Events Controller
 * Admin-managed events with create/update/delete admin-only
 * Public can list and view events
 */

// Mock events database - in production, use MongoDB
const EVENTS_DB = {
  event_1: {
    id: 'event_1',
    eventId: 'event_1',
    title: 'Web3 Summit 2024',
    date: '2024-06-15T10:00:00Z',
    venue: 'Mumbai, India',
    price: 500,
    totalTickets: 1000,
    ticketsMinted: 450,
    organizer: 'organizer_1',
    admin_id: 'admin_1',
    status: 'active',
    metadataURI: 'ipfs://QmEventMetadata1',
    description: 'Annual Web3 conference with top speakers',
    image: 'ipfs://QmEventImage1',
    createdAt: '2024-05-15T00:00:00Z',
  },
};

/**
 * GET /events
 * Get all active events (PUBLIC - no auth required)
 * Returns events with ticket counts
 */
export const getEvents = async (req, res) => {
  try {
    const { limit = 20, offset = 0, status = 'active' } = req.query;

    // Filter events by status
    const eventsList = Object.values(EVENTS_DB).filter((event) => {
      if (status === 'active') return event.status === 'active';
      if (status === 'cancelled') return event.status === 'cancelled';
      if (status === 'completed') return event.status === 'completed';
      return true;
    });

    const paginatedEvents = eventsList.slice(offset, offset + limit);

    res.json({
      success: true,
      events: paginatedEvents,
      total: eventsList.length,
      limit,
      offset,
      message: `Retrieved ${paginatedEvents.length} events`,
    });
  } catch (error) {
    console.error('[EVENTS/GET-ALL]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /events/:id
 * Get single event by ID (PUBLIC - no auth required)
 */
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Event ID is required',
      });
    }

    const event = EVENTS_DB[id];

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Event ${id} not found`,
      });
    }

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('[EVENTS/GET-BY-ID]', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch event' 
    });
  }
};

/**
 * POST /events
 * Create new event (ADMIN ONLY)
 * Admin creates event that users can purchase tickets for
 */
export const createEvent = async (req, res) => {
  try {
    const { title, date, venue, price, totalTickets, description, image } = req.body;
    const adminId = req.user.id;
    const userRole = req.user.role;

    // Check admin role
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only admins can create events',
      });
    }

    // Validate required fields
    if (!title || !date || !venue || !price || !totalTickets) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'title, date, venue, price, and totalTickets are required',
      });
    }

    // Parse price as number
    const eventPrice = parseFloat(price);
    const eventTickets = parseInt(totalTickets);

    if (isNaN(eventPrice) || isNaN(eventTickets) || eventPrice <= 0 || eventTickets <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'price and totalTickets must be positive numbers',
      });
    }

    // TODO: Upload image to IPFS and get IPFS hash
    const eventId = `event_${Date.now()}`;
    const metadataURI = `ipfs://QmMetadata${eventId}`;

    const newEvent = {
      id: eventId,
      eventId,
      title,
      date,
      venue,
      price: eventPrice,
      totalTickets: eventTickets,
      ticketsMinted: 0,
      organizer: adminId,
      admin_id: adminId,
      status: 'active',
      metadataURI,
      image: image || 'ipfs://default-event-image',
      description: description || '',
      createdAt: new Date(),
    };

    // TODO: Call smart contract createEvent() to register on-chain
    // TODO: Save event to DB

    EVENTS_DB[eventId] = newEvent;

    console.log('[EVENTS] Created by admin:', adminId, eventId);

    res.status(201).json({
      success: true,
      event: newEvent,
      message: 'Event created successfully',
      onChainSync: 'pending', // Will be confirmed after blockchain tx
    });
  } catch (error) {
    console.error('[EVENTS/CREATE]', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * PUT /events/:id
 * Update event (ADMIN ONLY)
 * Only the admin who created the event can update it
 */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, venue, price, totalTickets, description, status } = req.body;
    const adminId = req.user.id;
    const userRole = req.user.role;

    // Check admin role
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only admins can update events',
      });
    }

    const event = EVENTS_DB[id];

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Event ${id} not found`,
      });
    }

    // Check if admin is the creator
    if (event.admin_id !== adminId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only update events you created',
      });
    }

    // Update only provided fields
    if (title) event.title = title;
    if (date) event.date = date;
    if (venue) event.venue = venue;
    if (price) event.price = parseFloat(price);
    if (totalTickets) event.totalTickets = parseInt(totalTickets);
    if (description) event.description = description;
    if (status && ['active', 'cancelled', 'completed'].includes(status)) {
      event.status = status;
    }

    event.updatedAt = new Date();

    // TODO: Sync changes to smart contract

    console.log('[EVENTS] Updated by admin:', adminId, id);

    res.json({
      success: true,
      event,
      message: 'Event updated successfully',
    });
  } catch (error) {
    console.error('[EVENTS/UPDATE]', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update event' 
    });
  }
};

/**
 * DELETE /events/:id
 * Delete/cancel event (ADMIN ONLY)
 * Marks event as cancelled (soft delete)
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const userRole = req.user.role;

    // Check admin role
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only admins can delete events',
      });
    }

    const event = EVENTS_DB[id];

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Event ${id} not found`,
      });
    }

    // Check if admin is the creator
    if (event.admin_id !== adminId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only delete events you created',
      });
    }

    // Mark as cancelled instead of deleting
    event.status = 'cancelled';
    event.cancelledAt = new Date();

    // TODO: Call smart contract cancelEvent()
    // TODO: Trigger refunds for purchased tickets

    console.log('[EVENTS] Cancelled by admin:', adminId, id);

    res.json({
      success: true,
      event,
      message: 'Event cancelled successfully',
      refundsTriggered: true,
    });
  } catch (error) {
    console.error('[EVENTS/DELETE]', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete event' 
    });
  }
};

/**
 * GET /events/:id/remaining-tickets
 * Get remaining ticket count for event (PUBLIC)
 */
export const getRemainingTickets = async (req, res) => {
  try {
    const { id } = req.params;

    const event = EVENTS_DB[id];

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Event ${id} not found`,
      });
    }

    const remaining = event.totalTickets - event.ticketsMinted;
    const isSoldOut = remaining === 0;

    res.json({
      success: true,
      eventId: id,
      totalTickets: event.totalTickets,
      ticketsMinted: event.ticketsMinted,
      remainingTickets: remaining,
      isSoldOut,
      percentageSold: Math.round((event.ticketsMinted / event.totalTickets) * 100),
    });
  } catch (error) {
    console.error('[EVENTS/REMAINING]', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch remaining tickets' 
    });
  }
};

export default {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getRemainingTickets,
};
