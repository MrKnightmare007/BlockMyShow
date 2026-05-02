import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment or file
 */
let db = null;
let auth = null;

export const initializeFirebase = async () => {
  try {
    // Check if Firebase Admin SDK is already initialized
    if (db) {
      console.log('✓ Firebase already initialized');
      return { db, auth };
    }

    // Prepare credentials object
    const credentials = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID || 'proofpass-27725',
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk@proofpass-27725.iam.gserviceaccount.com',
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    };

    // Quick validation - if private key is missing or doesn't look right, use mock DB
    if (!credentials.private_key || credentials.private_key.trim().length < 100) {
      console.log('ℹ️  Firebase private key not configured. Using mock database.');
      console.log('To enable Firebase, ensure FIREBASE_PRIVATE_KEY is set with actual newlines.');
      return { db: null, auth: null };
    }

    // Validate private key exists and is a string
    if (!credentials.private_key || typeof credentials.private_key !== 'string') {
      console.warn('⚠️  WARNING: FIREBASE_PRIVATE_KEY is not properly configured');
      console.warn('Private key length:', credentials.private_key?.length || 0);
      throw new Error(`Service account object must contain a string "private_key" property. Got: ${typeof credentials.private_key}`);
    }

    // Check if private key has the right format
    if (!credentials.private_key.includes('BEGIN PRIVATE KEY')) {
      console.warn('⚠️  WARNING: FIREBASE_PRIVATE_KEY does not contain valid PEM format');
    }

    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
        projectId: credentials.project_id,
        databaseURL: `https://${credentials.project_id}.firebaseio.com`,
      });

      console.log('[FIREBASE] Admin SDK initialized successfully');
    }

    db = admin.firestore();
    auth = admin.auth();

    // Set Firestore settings
    db.settings({
      ignoreUndefinedProperties: true,
      timestampsInSnapshots: true,
    });

    console.log('✓ Firestore database connected');
    console.log('✓ Firebase Auth initialized');

    return { db, auth };
  } catch (error) {
    console.error('[FIREBASE] Initialization error:', error.message);
    console.log('ℹ️  Continuing with mock database...');
    return { db: null, auth: null };
  }
};

/**
 * Get Firestore database instance
 */
export const getFirestore = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
};

/**
 * Get Firebase Auth instance
 */
export const getAuth = () => {
  if (!auth) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return auth;
};

/**
 * Get reference to a Firestore collection
 */
export const getCollection = (collectionName) => {
  return getFirestore().collection(collectionName);
};

/**
 * Get reference to a Firestore document
 */
export const getDocument = (collectionName, documentId) => {
  return getFirestore().collection(collectionName).doc(documentId);
};

/**
 * Create a new document
 */
export const createDocument = async (collectionName, data) => {
  try {
    const docRef = await getCollection(collectionName).add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`[FIRESTORE] Document created in ${collectionName}:`, docRef.id);
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('[FIRESTORE] Error creating document:', error);
    throw error;
  }
};

/**
 * Set a document with specific ID (overwrites)
 */
export const setDocument = async (collectionName, documentId, data) => {
  try {
    await getDocument(collectionName, documentId).set({
      ...data,
      updatedAt: new Date(),
    }, { merge: false });
    console.log(`[FIRESTORE] Document set in ${collectionName}:`, documentId);
    return { id: documentId, ...data };
  } catch (error) {
    console.error('[FIRESTORE] Error setting document:', error);
    throw error;
  }
};

/**
 * Update a document (merge with existing data)
 */
export const updateDocument = async (collectionName, documentId, data) => {
  try {
    await getDocument(collectionName, documentId).update({
      ...data,
      updatedAt: new Date(),
    });
    console.log(`[FIRESTORE] Document updated in ${collectionName}:`, documentId);
    return { id: documentId, ...data };
  } catch (error) {
    console.error('[FIRESTORE] Error updating document:', error);
    throw error;
  }
};

/**
 * Get a single document
 */
export const getDocumentData = async (collectionName, documentId) => {
  try {
    const doc = await getDocument(collectionName, documentId).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('[FIRESTORE] Error getting document:', error);
    throw error;
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (collectionName, documentId) => {
  try {
    await getDocument(collectionName, documentId).delete();
    console.log(`[FIRESTORE] Document deleted from ${collectionName}:`, documentId);
  } catch (error) {
    console.error('[FIRESTORE] Error deleting document:', error);
    throw error;
  }
};

/**
 * Query collection
 */
export const queryCollection = async (collectionName, whereConditions = []) => {
  try {
    let query = getCollection(collectionName);

    // Apply where conditions: [{field: 'name', operator: '==', value: 'John'}, ...]
    for (const condition of whereConditions) {
      query = query.where(condition.field, condition.operator, condition.value);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[FIRESTORE] Error querying collection:', error);
    throw error;
  }
};

/**
 * Create Firebase auth user
 */
export const createAuthUser = async (email, password, displayName) => {
  try {
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName,
    });
    console.log('[FIREBASE-AUTH] User created:', userRecord.uid);
    return userRecord;
  } catch (error) {
    console.error('[FIREBASE-AUTH] Error creating user:', error);
    throw error;
  }
};

/**
 * Verify Firebase ID token
 */
export const verifyIdToken = async (token) => {
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('[FIREBASE-AUTH] Error verifying token:', error);
    throw error;
  }
};

export default {
  initializeFirebase,
  getFirestore,
  getAuth,
  getCollection,
  getDocument,
  createDocument,
  setDocument,
  updateDocument,
  getDocumentData,
  deleteDocument,
  queryCollection,
  createAuthUser,
  verifyIdToken,
};
