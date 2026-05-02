/**
 * User Model
 * Stores user account information, wallet addresses, and identity verification status
 */
export const userSchema = {
  name: 'User',
  collection: 'users',
  fields: {
    _id: { type: 'ObjectId', description: 'MongoDB unique identifier' },
    email: { type: 'String', description: 'User email address (optional for MetaMask auth)' },
    passwordHash: { type: 'String', description: 'Bcrypt hashed password (for email auth only)' },
    walletAddress: { type: 'String', unique: true, description: 'Web3 wallet address (0x...) - generated at signin' },
    publicAddress: { type: 'String', description: 'Alias for walletAddress' },
    encryptedPrivateKey: { type: 'String', description: 'Encrypted wallet private key (NOT stored; returned once)' },
    auth_method: { type: 'String', enum: ['email', 'google', 'metamask'], description: 'Primary authentication method' },
    role: { type: 'String', enum: ['user', 'organizer', 'admin'], default: 'user' },
    profile: {
      name: { type: 'String', description: 'Full name (optional)' },
      phone: { type: 'String', description: 'Phone number (optional)' },
      avatar: { type: 'String', description: 'Avatar image URL (optional)' },
    },
    identity: {
      aadhaarId: { type: 'String', description: 'Aadhaar number (encrypted, only at booking)' },
      verified: { type: 'Boolean', default: false },
      commitment: { type: 'String', description: 'ZK commitment hash' },
      verifiedAt: { type: 'Date', description: 'Timestamp of identity verification' },
    },
    oauth: {
      googleId: { type: 'String', description: 'Google OAuth ID' },
      googleEmail: { type: 'String' },
      metamaskAddress: { type: 'String', description: 'MetaMask wallet address for Ethereum signature verification' },
    },
    accountStatus: { type: 'String', enum: ['active', 'suspended', 'deleted'], default: 'active' },
    createdAt: { type: 'Date', default: 'Date.now()' },
    updatedAt: { type: 'Date', default: 'Date.now()' },
  },
  indexes: [{ email: 1 }, { walletAddress: 1, unique: true }, { auth_method: 1 }],
};

/**
 * Admin Model
 * Admin users with role-based access control
 */
export const adminSchema = {
  name: 'Admin',
  collection: 'admins',
  fields: {
    _id: { type: 'ObjectId', description: 'MongoDB unique identifier' },
    username: { type: 'String', unique: true, required: true, description: 'Admin username' },
    passwordHash: { type: 'String', required: true, description: 'Bcrypt hashed password' },
    email: { type: 'String', description: 'Admin email (optional)' },
    role: { type: 'String', enum: ['admin', 'gate_operator', 'event_creator'], default: 'admin', description: 'Admin role with specific permissions' },
    permissions: [{ type: 'String', description: 'List of permissions (e.g., "create_event", "scan_gate", "manage_users")' }],
    accountStatus: { type: 'String', enum: ['active', 'suspended', 'deleted'], default: 'active' },
    lastLogin: { type: 'Date' },
    createdAt: { type: 'Date', default: 'Date.now()' },
    updatedAt: { type: 'Date', default: 'Date.now()' },
  },
  indexes: [{ username: 1, unique: true }, { role: 1 }, { accountStatus: 1 }],
};

/**
 * Event Model
 * Stores event information and links to smart contract
 */
export const eventSchema = {
  name: 'Event',
  collection: 'events',
  fields: {
    _id: { type: 'ObjectId' },
    eventId: { type: 'String', unique: true, description: 'On-chain event ID' },
    title: { type: 'String', required: true, description: 'Event title' },
    description: { type: 'String', description: 'Event description' },
    date: { type: 'Date', required: true, description: 'Event date and time' },
    venue: { type: 'String', required: true, description: 'Event venue location' },
    price: { type: 'Number', required: true, description: 'Ticket price in INR' },
    currency: { type: 'String', default: 'INR' },
    totalTickets: { type: 'Number', required: true, description: 'Total tickets available' },
    ticketsMinted: { type: 'Number', default: 0, description: 'NFT tickets already minted' },
    organizer: { type: 'String', required: true, description: 'Organizer user ID' },
    admin_id: { type: 'String', required: true, description: 'Admin user ID who created the event' },
    organizerAddress: { type: 'String', description: 'Organizer wallet address' },
    image: { type: 'String', description: 'Event image URL (IPFS or HTTP)' },
    metadataURI: { type: 'String', description: 'IPFS metadata URI' },
    contractAddress: { type: 'String', description: 'Smart contract deployment address' },
    status: { type: 'String', enum: ['active', 'cancelled', 'completed'], default: 'active', description: 'Event status' },
    active: { type: 'Boolean', default: true, description: 'Is event still active (deprecated, use status)' },
    cancelled: { type: 'Boolean', default: false },
    cancelledAt: { type: 'Date' },
    refundsTriggered: { type: 'Boolean', default: false },
    createdAt: { type: 'Date', default: 'Date.now()' },
    updatedAt: { type: 'Date', default: 'Date.now()' },
  },
  indexes: [{ eventId: 1, unique: true }, { admin_id: 1 }, { organizer: 1 }, { date: 1 }, { status: 1 }],
};

/**
 * Ticket Model
 * Stores NFT ticket information and verification status
 */
export const ticketSchema = {
  name: 'Ticket',
  collection: 'tickets',
  fields: {
    _id: { type: 'ObjectId' },
    tokenId: { type: 'String', unique: true, description: 'On-chain NFT token ID' },
    userId: { type: 'String', required: true, description: 'Owner user ID' },
    userAddress: { type: 'String', description: 'Owner wallet address' },
    eventId: { type: 'String', required: true, description: 'Event ID' },
    orderId: { type: 'String', description: 'Payment order ID' },
    aadhaarId: { type: 'String', description: 'Identity verification Aadhaar (encrypted)' },
    commitment: { type: 'String', description: 'ZK commitment hash' },
    metadataURI: { type: 'String', description: 'IPFS metadata URL' },
    qrCode: { type: 'String', description: 'QR code data URL' },
    used: { type: 'Boolean', default: false, description: 'Has ticket been used for entry' },
    usedAt: { type: 'Date', description: 'Timestamp of entry' },
    usedBy: { type: 'String', description: 'Gate operator ID who marked as used' },
    transferable: { type: 'Boolean', default: false, description: 'Is ticket transferable (soulbound by default)' },
    createdAt: { type: 'Date', default: 'Date.now()' },
    updatedAt: { type: 'Date', default: 'Date.now()' },
  },
  indexes: [
    { tokenId: 1, unique: true },
    { userId: 1 },
    { eventId: 1 },
    { used: 1 },
  ],
};

/**
 * Payment Model
 * Stores Razorpay payment records
 */
export const paymentSchema = {
  name: 'Payment',
  collection: 'payments',
  fields: {
    _id: { type: 'ObjectId' },
    orderId: { type: 'String', unique: true, description: 'Razorpay order ID' },
    paymentId: { type: 'String', description: 'Razorpay payment ID' },
    userId: { type: 'String', required: true },
    eventId: { type: 'String', required: true },
    amount: { type: 'Number', required: true, description: 'Amount in INR' },
    currency: { type: 'String', default: 'INR' },
    ticketCount: { type: 'Number', default: 1 },
    email: { type: 'String' },
    phone: { type: 'String' },
    status: {
      type: 'String',
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'created',
    },
    signature: { type: 'String', description: 'Razorpay signature for verification' },
    notes: { type: 'Object', description: 'Custom notes and metadata' },
    ticketIds: [{ type: 'String', description: 'Minted NFT token IDs' }],
    webhookReceived: { type: 'Boolean', default: false },
    createdAt: { type: 'Date', default: 'Date.now()' },
    authorizedAt: { type: 'Date' },
    capturedAt: { type: 'Date' },
    refundedAt: { type: 'Date' },
  },
  indexes: [{ orderId: 1, unique: true }, { userId: 1 }, { status: 1 }],
};

/**
 * Identity Verification Model (for Aadhaar)
 * Stores Aadhaar data, OTP, commitment, and verification state
 */
export const identitySchema = {
  name: 'Identity',
  collection: 'identities',
  fields: {
    _id: { type: 'ObjectId' },
    user_id: { type: 'String', description: 'User ID attempting verification' },
    masked_id: { type: 'String', unique: true, description: 'Masked Aadhaar ID (last 4 digits)' },
    phone_number: { type: 'String', required: true, description: 'Phone number linked to Aadhaar' },
    name: { type: 'String', description: 'Name from Aadhaar (optional)' },
    profile_photo: { type: 'String', description: 'Photo from Aadhaar (IPFS URL)' },
    verified: { type: 'Boolean', default: false, description: 'Is Aadhaar identity verified?' },
    otp: {
      code: { type: 'String', description: 'Current OTP' },
      expiresAt: { type: 'Date' },
      attempts: { type: 'Number', default: 0 },
      verified: { type: 'Boolean', default: false },
    },
    commitment: {
      hash: { type: 'String', description: 'ZK commitment hash' },
      secret: { type: 'String', description: 'Secret for commitment' },
      generatedAt: { type: 'Date' },
    },
    verificationStatus: {
      type: 'String',
      enum: ['unverified', 'otp_sent', 'otp_verified', 'commitment_generated', 'complete'],
      default: 'unverified',
    },
    verifiedAt: { type: 'Date' },
    createdAt: { type: 'Date', default: 'Date.now()' },
    updatedAt: { type: 'Date', default: 'Date.now()' },
  },
  indexes: [{ masked_id: 1, unique: true }, { phone_number: 1 }, { user_id: 1 }],
};

/**
 * Gate Verification Log Model
 * Audit trail for gate verification events
 */
export const gateVerificationSchema = {
  name: 'GateVerification',
  collection: 'gate_verifications',
  fields: {
    _id: { type: 'ObjectId' },
    tokenId: { type: 'String', required: true },
    eventId: { type: 'String', required: true },
    userId: { type: 'String', required: true },
    aadhaarId: { type: 'String', description: 'Identity verified' },
    operatorId: { type: 'String', description: 'Scanner/gate operator ID' },
    verificationTime: { type: 'Date', required: true },
    verified: { type: 'Boolean', required: true },
    identityPhotoURL: { type: 'String', description: 'Photo shown at gate' },
    markedUsedAt: { type: 'Date', description: 'When ticket was marked as used' },
    entryGranted: { type: 'Boolean', default: false },
    notes: { type: 'String', description: 'Gate operator notes' },
    createdAt: { type: 'Date', default: 'Date.now()' },
  },
  indexes: [{ tokenId: 1 }, { eventId: 1 }, { userId: 1 }, { verificationTime: -1 }],
};

/**
 * Mock Aadhaar Registry (Production would use UIDAI API)
 * Stores trusted Aadhaar data for testing
 */
export const aadhaarRegistrySchema = {
  name: 'AadhaarRegistry',
  collection: 'aadhaar_registry',
  fields: {
    _id: { type: 'ObjectId' },
    aadhaarId: { type: 'String', unique: true, description: '12-digit Aadhaar' },
    name: { type: 'String', required: true },
    phone: { type: 'String', required: true },
    dob: { type: 'Date', description: 'Date of birth' },
    gender: { type: 'String', enum: ['M', 'F', 'O'] },
    address: { type: 'String' },
    photoURL: { type: 'String', description: 'IPFS URL of Aadhaar photo' },
    secret: { type: 'String', description: 'Secret for commitment' },
    active: { type: 'Boolean', default: true },
    createdAt: { type: 'Date', default: 'Date.now()' },
  },
  indexes: [{ aadhaarId: 1, unique: true }],
};

export default {
  userSchema,
  eventSchema,
  ticketSchema,
  paymentSchema,
  identitySchema,
  gateVerificationSchema,
  aadhaarRegistrySchema,
};
