import fs from 'fs';
import path from 'path';

// Path to JSON file that stores users. Ensure the folder exists.
const DATA_DIR = path.resolve(); // project root
const USERS_FILE = path.join(DATA_DIR, 'data', 'users.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/** Load all users from the JSON file */
export const loadUsers = () => {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([] , null, 2));
    return [];
  }
  const raw = fs.readFileSync(USERS_FILE, { encoding: 'utf-8' });
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse users.json, resetting file:', e);
    fs.writeFileSync(USERS_FILE, JSON.stringify([] , null, 2));
    return [];
  }
};

/** Save user array back to JSON file */
export const saveUsers = (users) => {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

/** Find a user by email (case‑insensitive) */
export const findUserByEmail = (email) => {
  const users = loadUsers();
  return users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
};

/** Find a user by wallet address (case‑insensitive) */
export const findUserByWallet = (walletAddress) => {
  const users = loadUsers();
  return users.find(u => u.walletAddress && u.walletAddress.toLowerCase() === walletAddress.toLowerCase());
};

/** Add a new user and persist */
export const addUser = (user) => {
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
  return user;
};

/** Update an existing user (by id) */
export const updateUser = (id, updates) => {
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  const updated = { ...users[idx], ...updates };
  users[idx] = updated;
  saveUsers(users);
  return updated;
};

export default {
  loadUsers,
  saveUsers,
  findUserByEmail,
  findUserByWallet,
  addUser,
  updateUser,
};
