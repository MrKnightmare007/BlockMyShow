/**
 * User Model
 * Stores user account information, wallet addresses, and identity verification status
 */
export const userSchema = {
  name: 'User',
  collection: 'users',
  fields: {
    _id: { type: 'ObjectId', description: 'MongoDB unique identifier' },
    email: { type: 'String', unique: true, required: true, description: 'User email address' },
    passwordHash: { type: 'String', description: 'Bcrypt hashed password' },
    walletAddress: { type: 'String', unique: true, description: 'Web3 wallet address (0x...)' },
    encryptedPrivateKey: { type: 'String', description: 'Encrypted wallet private key' },
    role: { type: 'String', enum: ['user', 'organizer', 'admin'], default: 'user' },
    profile: {
      name: { type: 'String', description: 'Full name' },
      phone: { type: 'String', description: 'Phone number' },
      avatar: { type: 'String', description: 'Avatar image URL' },
    },
    identity: {
      aadhaarId: { type: 'String', description: 'Aadhaar number (encrypted)' },
      verified: { type: 'Boolean', default: false },
      commitment: { type: 'String', description: 'ZK commitment hash' },
      verifiedAt: { type: 'Date', description: 'Timestamp of identity verification' },
    },
    oauth: {
      googleId: { type: 'String', description: 'Google OAuth ID' },
      googleEmail: { type: 'String' },
    },
    accountStatus: { type: 'String', enum: ['active', 'suspended', 'deleted'], default: 'active' },
    createdAt: { type: 'Date', default: 'Date.now()' },
    updatedAt: { type: 'Date', default: 'Date.now()' },
  },
  indexes: [{ email: 1, unique: true }, { walletAddress: 1 }],
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
    organizerAddress: { type: 'String', description: 'Organizer wallet address' },
    image: { type: 'String', description: 'Event image URL (IPFS or HTTP)' },
    metadataURI: { type: 'String', description: 'IPFS metadata URI' },
    contractAddress: { type: 'String', description: 'Smart contract deployment address' },
    active: { type: 'Boolean', default: true, description: 'Is event still active' },
    cancelled: { type: 'Boolean', default: false },
    cancelledAt: { type: 'Date' },
    refundsTriggered: { type: 'Boolean', default: false },
    createdAt: { type: 'Date', default: 'Date.now()' },
    updatedAt: { type: 'Date', default: 'Date.now()' },
  },
  indexes: [{ eventId: 1, unique: true }, { organizer: 1 }, { date: 1 }],
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
 * Identity Verification Model
 * Stores OTP, commitment, and identity verification state
 */
export const identitySchema = {
  name: 'Identity',
  collection: 'identities',
  fields: {
    _id: { type: 'ObjectId' },
    aadhaarId: { type: 'String', unique: true, description: 'Aadhaar number (hashed)' },
    phoneNumber: { type: 'String', description: 'Phone number linked to Aadhaar' },
    name: { type: 'String', description: 'Name from Aadhaar' },
    photoURL: { type: 'String', description: 'Photo from Aadhaar (IPFS)' },
    secret: { type: 'String', description: 'Secret for commitment generation' },
    otp: {
      code: { type: 'String', description: 'Current OTP' },
      expiresAt: { type: 'Date' },
      attempts: { type: 'Number', default: 0 },
      verified: { type: 'Boolean', default: false },
    },
    commitment: {
      hash: { type: 'String', description: 'ZK commitment hash' },
      generatedAt: { type: 'Date' },
      generatedBy: { type: 'String', description: 'User ID who generated commitment' },
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
  indexes: [{ aadhaarId: 1, unique: true }],
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
