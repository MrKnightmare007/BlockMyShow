# Appwrite Dashboard Setup Guide - Identities Collection

## Current Configuration
Your `.env` file already has:
```
APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=69f6d0770039ceb5acb4
APPWRITE_API_KEY=standard_14c0fea99e64fb0dfd6e0734be8b746fd559218e2a427e600a4b7a875c52f815e3137a91743d6ab1e430b7eba6d542798792b8d7dae309e93211ec84c5e5ba4b307415feafc22fdc1b14b8511c3a07cb2ecdb3addc5c4c0351a0fd37a013bd6dbd0bba9e81d6fdeae8189ddfe13d47be0fba13bcc62e5e63b7725dc3d1441327
APPWRITE_DATABASE_ID=69f6d0a9001b7cbc199b
APPWRITE_IDENTITIES_COLLECTION_ID=identities
```

---

## Steps to Setup Identities Collection in Appwrite

### 1. **Login to Appwrite Dashboard**
   - Go to: https://sgp.cloud.appwrite.io/
   - Login with your credentials

### 2. **Navigate to Your Project**
   - Select Project ID: `69f6d0770039ceb5acb4`
   - Click on it

### 3. **Go to Databases**
   - In the left sidebar, click **Databases**
   - Select Database ID: `69f6d0a9001b7cbc199b`

### 4. **Create/Verify Identities Collection**
   - Click **Create Collection** or verify `identities` collection exists
   - If creating:
     - **Collection ID**: `identities`
     - **Collection Name**: Identities
     - Click **Create**

### 5. **Add Attributes to Identities Collection**

Add the following attributes (fields) to the collection:

#### Attribute 1: `hashed_identity_id`
- **Attribute ID**: `hashed_identity_id`
- **Type**: String
- **Size**: 64 (SHA256 hash is 64 chars)
- **Required**: ✅ Yes
- **Unique**: ✅ Yes (Important! Prevents duplicates)
- **Default Value**: (empty)

#### Attribute 2: `phone_number`
- **Attribute ID**: `phone_number`
- **Type**: String
- **Size**: 20
- **Required**: ✅ Yes
- **Unique**: ❌ No (Multiple identities can have same phone)
- **Default Value**: (empty)

#### Attribute 3: `name`
- **Attribute ID**: `name`
- **Type**: String
- **Size**: 255
- **Required**: ✅ Yes
- **Unique**: ❌ No
- **Default Value**: (empty)

#### Attribute 4: `profile_photo_url`
- **Attribute ID**: `profile_photo_url`
- **Type**: String
- **Size**: 500
- **Required**: ❌ No
- **Unique**: ❌ No
- **Default Value**: (empty string)

### 6. **Create Document Permissions (Important!)**

After creating the collection:
- Click on **Settings** (gear icon)
- Under **Document Permissions**, select:
  - **Read**: User / Admin
  - **Create**: User / Admin
  - **Update**: User / Admin
  - **Delete**: Admin Only

Or use custom role-based access if you have specific requirements.

---

## What Changed in Your Codebase

### Files Modified:
1. **Created**: `/backend/models/identityModel.js`
   - New Appwrite model using SDK
   - Methods: `createIdentity()`, `getIdentityByHashedId()`, `checkIdentityExists()`

2. **Updated**: `/backend/service/identityService.js`
   - Removed JSON file operations
   - Now uses Appwrite via the model
   - All functions are now `async`

3. **Updated**: `/backend/controllers/identityController.js`
   - Added `await` to `addIdentity()` call

4. **Updated**: `/backend/controllers/ticketsController.js`
   - Added `await` to `getIdentityByRawId()` calls (2 places)

5. **Updated**: `/backend/controllers/gateController.js`
   - Added `await` to `getIdentityByHashedId()` call

---

## Data Migration (If Needed)

If you have existing identity data in `data/identity.json`, migrate it:

### Option 1: Manual Migration via API
```bash
# For each identity in data/identity.json:
curl -X POST https://sgp.cloud.appwrite.io/v1/databases/69f6d0a9001b7cbc199b/collections/identities/documents \
  -H "X-Appwrite-Key: [YOUR_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "hashed_identity_id": "...",
    "phone_number": "+91...",
    "name": "...",
    "profile_photo_url": "..."
  }'
```

### Option 2: Using Node.js Script (Recommended)
Create a migration script if you have test data to move.

---

## Testing

### Test the Identity API:
```bash
# Add Identity
curl -X POST http://localhost:5000/api/identity/add \
  -H "Content-Type: application/json" \
  -d '{
    "identity_id": "123456789012",
    "phone_number": "+919876543210",
    "name": "John Doe",
    "profile_photo_url": "https://example.com/photo.jpg"
  }'

# Response:
# {
#   "success": true,
#   "message": "Identity added"
# }
```

Try adding the same identity again → should get 409 Conflict (Unique constraint).

---

## Benefits of Appwrite Storage

✅ **Scalable**: Database-backed, not file-system dependent  
✅ **Secure**: Built-in access control & permissions  
✅ **Reliable**: Backup & recovery built-in  
✅ **Query-able**: Can query identities by any field  
✅ **Real-time**: Set up webhooks for real-time updates  
✅ **Concurrent**: Handles multiple requests safely  

---

## Next Steps

1. Set up the collection in Appwrite dashboard (follow steps 1-6 above)
2. Install dependencies: `npm install` in backend folder
3. Test the `/api/identity/add` endpoint
4. Run: `npm run dev` to start the server
5. Test with Postman collection
