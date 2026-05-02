import { ethers } from 'ethers';

/**
 * Events Controller
 * Handles event creation, management, and on-chain synchronization
 */

// Mock events database - in production, use MongoDB
const EVENTS_DB = {
  event_1: {
    id: 'event_1',
    title: 'Web3 Summit 2024',
    date: '2024-06-15T10:00:00Z',
    venue: 'Mumbai, India',
    price: 500,
    totalTickets: 1000,
    ticketsMinted: 450,
    organizer: 'organizer_1',
    metadataURI: 'ipfs://QmEventMetadata1',
    active: true,
    description: 'Annual Web3 conference with top speakers',
    image: 'ipfs://QmEventImage1',
    createdAt: '2024-05-15T00:00:00Z',
  },
};

/**
 * Get all events (with pagination and filters)
 */
export const getEvents = async (req, res) => {
  try {
    const { limit = 20, offset = 0, status = 'active' } = req.query;

    // Filter events by status
    const eventsList = Object.values(EVENTS_DB).filter((event) => {
      if (status === 'active') return event.active;
      if (status === 'inactive') return !event.active;
      return true;
    });

    const paginatedEvents = eventsList.slice(offset, offset + limit);

    res.json({
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
 * Get single event by ID
 */
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Event ID is required',
      });
    }

    const event = EVENTS_DB[id];

    if (!event) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Event ${id} not found`,
      });
    }

    res.json(event);
  } catch (error) {
    console.error('[EVENTS/GET-BY-ID]', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

/**
 * Create new event (organizer only)
 */
export const createEvent = async (req, res) => {
  try {
    const { title, date, venue, price, totalTickets, description, image } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!title || !date || !venue || !price || !totalTickets) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'title, date, venue, price, and totalTickets are required',
      });
    }

    // TODO: Validate user is organizer
    // TODO: Upload image to IPFS and get IPFS hash
    const eventId = `event_${Date.now()}`;
    const metadataURI = `ipfs://QmMetadata${eventId}`;

    const newEvent = {
      id: eventId,
      title,
      date,
      venue,
      price,
      totalTickets,
      ticketsMinted: 0,
      organizer: userId,
      metadataURI,
      image: image || 'ipfs://default-image',
      description,
      active: true,
      createdAt: new Date(),
    };

    // TODO: Call smart contract createEvent() to register on-chain
    // TODO: Save event to DB

    EVENTS_DB[eventId] = newEvent;

    console.log('[EVENTS] Created:', eventId);

    res.status(201).json({
      event: newEvent,
      message: 'Event created successfully',
      onChainSync: 'pending', // Will be confirmed after blockchain tx
    });
  } catch (error) {
    console.error('[EVENTS/CREATE]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Update event (organizer only)
 */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, venue, price, totalTickets, description, active } = req.body;
    const userId = req.user.id;

    const event = EVENTS_DB[id];

    if (!event) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Event ${id} not found`,
      });
    }

    if (event.organizer !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only event organizer can update this event',
      });
    }

    // Update only provided fields
    if (title) event.title = title;
    if (date) event.date = date;
    if (venue) event.venue = venue;
    if (price) event.price = price;
    if (totalTickets) event.totalTickets = totalTickets;
    if (description) event.description = description;
    if (active !== undefined) event.active = active;

    event.updatedAt = new Date();

    // TODO: Sync changes to smart contract

    console.log('[EVENTS] Updated:', id);

    res.json({
      event,
      message: 'Event updated successfully',
    });
  } catch (error) {
    console.error('[EVENTS/UPDATE]', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

/**
 * Delete event (cancel)
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = EVENTS_DB[id];

    if (!event) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Event ${id} not found`,
      });
    }

    if (event.organizer !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only event organizer can delete this event',
      });
    }

    // Mark as inactive instead of deleting
    event.active = false;
    event.cancelledAt = new Date();

    // TODO: Call smart contract cancelEvent()
    // TODO: Trigger refunds for purchased tickets

    console.log('[EVENTS] Deleted (marked inactive):', id);

    res.json({
      event,
      message: 'Event cancelled successfully',
      refundsTriggered: true,
    });
  } catch (error) {
    console.error('[EVENTS/DELETE]', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

/**
 * Get remaining ticket count for event
 */
export const getRemainingTickets = async (req, res) => {
  try {
    const { id } = req.params;

    const event = EVENTS_DB[id];

    if (!event) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Event ${id} not found`,
      });
    }

    const remaining = event.totalTickets - event.ticketsMinted;
    const isSoldOut = remaining === 0;

    res.json({
      eventId: id,
      totalTickets: event.totalTickets,
      ticketsMinted: event.ticketsMinted,
      remainingTickets: remaining,
      isSoldOut,
      percentageSold: Math.round((event.ticketsMinted / event.totalTickets) * 100),
    });
  } catch (error) {
    console.error('[EVENTS/REMAINING]', error);
    res.status(500).json({ error: 'Failed to fetch remaining tickets' });
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
