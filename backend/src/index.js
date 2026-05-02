import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeContract, getBlockchainInfo } from './utils/blockchain.js';
import { initializeFirebase } from './utils/firebase-config.js';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import ticketRoutes from './routes/tickets.js';
import paymentRoutes from './routes/payment.js';
import identityRoutes from './routes/identity.js';
import gateRoutes from './routes/gate.js';

const app = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';
const API_BASE = `/api/${API_VERSION}`;

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─────────────────────────────────────────────
// Health Check Route
// ─────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ProofPass Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: API_VERSION,
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

/**
 * Authentication Endpoints
 * POST   /api/v1/auth/login      - Login/register user
 * GET    /api/v1/auth/wallet     - Get user wallet
 * POST   /api/v1/auth/logout     - Logout user
 * GET    /api/v1/auth/profile    - Get user profile
 */
app.use(`${API_BASE}/auth`, authRoutes);

/**
 * Event Management Endpoints
 * GET    /api/v1/events         - List all events
 * GET    /api/v1/events/:id     - Get event details
 * POST   /api/v1/events         - Create event (organizer)
 * PUT    /api/v1/events/:id     - Update event
 * DELETE /api/v1/events/:id     - Delete event
 */
app.use(`${API_BASE}/events`, eventRoutes);

/**
 * Ticket Endpoints
 * GET    /api/v1/tickets/my-tickets  - Get user tickets
 * GET    /api/v1/tickets/:id         - Get ticket details
 * POST   /api/v1/tickets/mint        - Mint NFT ticket
 * GET    /api/v1/tickets/verify/:id  - Verify ticket
 */
app.use(`${API_BASE}/tickets`, ticketRoutes);

/**
 * Payment Endpoints
 * POST   /api/v1/payment/create-order  - Create order
 * POST   /api/v1/payment/verify        - Verify payment
 * POST   /api/v1/payment/webhook       - Razorpay webhook
 * GET    /api/v1/payment/history       - Payment history
 */
app.use(`${API_BASE}/payment`, paymentRoutes);

/**
 * Identity Verification Endpoints
 * POST   /api/v1/identity/send-otp       - Send OTP
 * POST   /api/v1/identity/verify-otp     - Verify OTP
 * POST   /api/v1/identity/commitment     - Generate commitment
 * GET    /api/v1/identity/:aadhaarId     - Get identity info
 */
app.use(`${API_BASE}/identity`, identityRoutes);

/**
 * Gate Verification Endpoints (Scanner App)
 * POST   /api/v1/gate/verify      - Verify at entry
 * POST   /api/v1/gate/mark-used   - Mark ticket used
 * GET    /api/v1/gate/stats       - Verification stats
 */
app.use(`${API_BASE}/gate`, gateRoutes);

// ─────────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    available: [
      `${API_BASE}/auth`,
      `${API_BASE}/events`,
      `${API_BASE}/tickets`,
      `${API_BASE}/payment`,
      `${API_BASE}/identity`,
      `${API_BASE}/gate`,
    ],
  });
});

// ─────────────────────────────────────────────
// Error Handling Middleware
// ─────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      status: statusCode,
      message: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// ─────────────────────────────────────────────
// Server Startup
// ─────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         BlockMyShow Backend API Server                     ║
╚════════════════════════════════════════════════════════════╝

🚀 Server started on port ${PORT}
📡 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Base URL: http://localhost:${PORT}
📝 API Version: ${API_VERSION}
🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);

  // Initialize Firebase Firestore
  try {
    console.log('\n[STARTUP] Initializing Firebase...');
    await initializeFirebase();
    console.log('✓ Firebase Firestore connected');
  } catch (error) {
    console.warn('⚠ Firebase initialization skipped:', error.message);
    console.warn('  Running with mock database. Data will not persist.');
  }

  // Initialize Smart Contract
  try {
    console.log('\n[STARTUP] Initializing Smart Contract...');
    await initializeContract();
    const blockchainInfo = await getBlockchainInfo();
    if (blockchainInfo) {
      console.log('✓ Smart Contract connected');
      console.log(`  Network: ${blockchainInfo.network} (Chain ID: ${blockchainInfo.chainId})`);
      console.log(`  Contract: ${blockchainInfo.contractAddress}`);
    }
  } catch (error) {
    console.warn('⚠ Smart Contract initialization skipped:', error.message);
    console.warn('  Running with mock blockchain. NFTs will not be minted on-chain.');
  }

  console.log(`
Available Endpoints:
  Auth:     ${API_BASE}/auth
  Events:   ${API_BASE}/events
  Tickets:  ${API_BASE}/tickets
  Payment:  ${API_BASE}/payment
  Identity: ${API_BASE}/identity
  Gate:     ${API_BASE}/gate

Health Check: http://localhost:${PORT}/health
API Health:   http://localhost:${PORT}/api/health

Ready to accept requests! ✅
  `);
});

export default app;

