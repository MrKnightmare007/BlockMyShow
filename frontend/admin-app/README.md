# ProofPass Admin Mobile Application

**React Native + Expo admin app for event management and gate scanning**

## Overview

The admin mobile application provides role-based access for event management and gate entry verification. Built with React Native and Expo, it supports three user roles: Super Admin, Event Creator, and Gate Operator.

## Features

- **Role-Based Authentication**: Super admin, event creator, gate operator access
- **Event Management**: Create, edit, delete events with revenue tracking
- **QR Scanner**: Real-time camera scanning for ticket verification
- **Gate Verification**: Multi-step entry verification process
- **Dashboard**: Comprehensive admin overview with statistics
- **Offline Support**: Works without internet for basic scanning

## Tech Stack

- **Framework**: React Native 0.81.5
- **Platform**: Expo ~54.0.33
- **Navigation**: Expo Router 6.0.23
- **Camera**: Expo Camera 16.0.8
- **Storage**: AsyncStorage 2.1.0
- **Language**: TypeScript 5.9.2

## Quick Start

```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start

# Run on specific platforms
npx expo start --android
npx expo start --ios
npx expo start --web
```

## User Roles & Permissions

### Super Admin (`admin`)
- **Full Access**: All features available
- **Event Management**: Create, edit, delete events
- **Gate Scanner**: Verify tickets at entry
- **User Management**: Manage other admin accounts
- **Analytics**: View comprehensive statistics

### Event Creator (`event_creator`)
- **Event Management**: Create, edit, delete own events
- **Analytics**: View event-specific statistics
- **Revenue Reports**: Track ticket sales and revenue

### Gate Operator (`gate_operator`)
- **Gate Scanner**: Verify tickets at entry
- **Entry Logs**: View verification history
- **Basic Stats**: Entry verification metrics

## App Flow & API Integration

### 1. Authentication Screen

**Component**: `AdminLoginScreen.tsx`

#### Login Flow
- **Input Fields**: Username, password
- **Test Credentials**: `admin_user` / `admin123`
- **API Call**: `POST /api/v1/auth/admin-login`
- **Response**: Admin object with role and JWT token
- **Storage**: Saves token and admin data to AsyncStorage
- **Navigation**: Redirects to role-based tab layout

#### Role Validation
- Backend validates admin role permissions
- Frontend shows/hides tabs based on role
- Unauthorized access attempts blocked

### 2. Dashboard Screen (`index.tsx`)

**Component**: `AdminDashboard`

#### Statistics Display
- **API Calls**: Multiple endpoints for dashboard data
- **Mock Stats**: Currently shows sample data
- **Real Implementation**: Would call analytics endpoints

#### Quick Actions
- **Create Event**: Navigate to events tab
- **Scan Tickets**: Navigate to gate scanner
- **View Reports**: Open analytics (coming soon)

#### Role-Based Features
- Different action cards based on user role
- Permission indicators show available features
- System information and logout option

### 3. Events Management (`events.tsx`)

**Component**: `EventsManagementScreen`

#### Event List Display
- **Page Load**: 
  - **API Call**: `GET /api/v1/events`
  - Shows all events with pagination
  - Pull-to-refresh functionality

#### Event Cards
- **Event Information**:
  - Title, date, venue, price
  - Ticket sales progress (sold/total)
  - Revenue generated
  - Status (active/cancelled)

#### Event Actions
- **Edit Button**: Opens edit modal (coming soon)
- **Stats Button**: Shows detailed event statistics
- **Cancel Button**: 
  - **API Call**: `DELETE /api/v1/events/:id`
  - Confirms cancellation with refund info

#### Create Event Modal
- **Form Fields**:
  - Title, venue, date, price
  - Total tickets, description
- **API Call**: `POST /api/v1/events`
- **Validation**: Client-side and server-side validation
- **Success**: Refreshes event list

### 4. Gate Scanner (`gate.tsx`)

**Component**: `GateScannerScreen`

#### Camera Permissions
- **Permission Request**: Uses `useCameraPermissions`
- **Permission Denied**: Shows permission request UI
- **Permission Granted**: Activates camera scanner

#### QR Code Scanning
- **Camera View**: Full-screen camera with overlay
- **Scan Frame**: Visual guide for QR code alignment
- **Barcode Types**: QR codes, Code128, Code39
- **Auto-Focus**: Continuous autofocus for clear scanning

#### Verification Process
1. **QR Scan**: 
   - **API Call**: `POST /api/v1/gate/verify-qr`
   - Validates QR code format and ticket existence

2. **Multi-Step Verification**:
   - **API Call**: `POST /api/v1/gate/verify`
   - Verifies identity, OTP, commitment
   - Shows verification progress

3. **Mark as Used**:
   - **API Call**: `POST /api/v1/gate/mark-used`
   - Updates ticket status on blockchain
   - Prevents duplicate entry

#### Manual Entry Mode
- **Toggle Button**: Switch to manual ticket entry
- **Input Field**: Enter ticket ID manually
- **Verification**: Same API calls as QR scanning
- **Use Case**: Backup when QR codes are damaged

#### Statistics Tracking
- **Real-time Counters**: Verified, failed attempts
- **Operator Performance**: Individual scanner metrics
- **Session Stats**: Current scanning session data

#### Verification Results
- **Success Overlay**: Green overlay with checkmark
- **Failure Overlay**: Red overlay with error message
- **Auto-Reset**: Returns to scanning after 3 seconds
- **Audio Feedback**: Success/failure sounds (optional)

## API Integration Summary

### Authentication APIs
```typescript
// Admin login
POST /api/v1/auth/admin-login
{
  username: string,
  password: string
}
```

### Event Management APIs
```typescript
// Get all events
GET /api/v1/events

// Create event (admin only)
POST /api/v1/events
{
  title: string,
  venue: string,
  date: string,
  price: number,
  totalTickets: number,
  description?: string
}

// Update event (admin only)
PUT /api/v1/events/:id

// Cancel event (admin only)
DELETE /api/v1/events/:id
```

### Gate Verification APIs
```typescript
// Verify QR code
POST /api/v1/gate/verify-qr
{
  qrData: string
}

// Multi-step verification
POST /api/v1/gate/verify
{
  tokenId: number,
  eventId: string,
  step: string
}

// Mark ticket as used
POST /api/v1/gate/mark-used
{
  tokenId: number,
  timestamp: string
}

// Get verification stats
GET /api/v1/gate/stats?eventId=event_1

// Get operator performance
GET /api/v1/gate/operator-stats?eventId=event_1&operatorId=op_1
```

## Screen Structure

```
app/
├── (tabs)/
│   ├── _layout.tsx             # Tab navigation with role-based access
│   ├── index.tsx               # Dashboard screen
│   ├── events.tsx              # Event management (admin/event_creator)
│   ├── gate.tsx                # QR scanner (admin/gate_operator)
│   └── explore.tsx             # Settings screen
├── _layout.tsx                 # Root layout with auth provider
├── modal.tsx                   # Modal screens
└── +not-found.tsx              # 404 screen

screens/
└── AdminLoginScreen.tsx        # Authentication screen

context/
└── AdminAuthContext.tsx        # Authentication state management
```

## State Management

### AdminAuthContext
```typescript
interface AdminAuthContextType {
  admin: Admin | null;          // Admin user object
  token: string | null;         // JWT token
  isLoading: boolean;           // Loading state
  error: string | null;         // Error messages
  isAuthenticated: boolean;     // Auth status
  login: (admin: Admin, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
}
```

### AsyncStorage Persistence
- `admin_token`: JWT token
- `admin_user`: Admin object with role

## Role-Based Navigation

### Tab Visibility Logic
```typescript
const showEventsTab = admin?.role === 'admin' || admin?.role === 'event_creator';
const showGateTab = admin?.role === 'admin' || admin?.role === 'gate_operator';
```

### Permission Checks
- Events tab: Only admin and event_creator
- Gate tab: Only admin and gate_operator
- Dashboard: Available to all roles
- Settings: Available to all roles

## Camera Integration

### QR Code Scanning Setup
```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

const [permission, requestPermission] = useCameraPermissions();

<CameraView
  style={styles.camera}
  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
  barcodeScannerSettings={{
    barcodeTypes: ['qr', 'code128', 'code39'],
  }}
>
```

### Scan Overlay Design
- Corner brackets for scan frame
- Instruction text below frame
- Statistics header at top
- Control buttons at bottom

## Testing Credentials

### Admin Login
- **Username**: `admin_user`
- **Password**: `admin123`
- **Role**: `admin` (full access)

### Test Event Data
- Events are fetched from backend API
- Mock events available for testing
- Create new events through the app

### QR Code Testing
- Use user web app to generate ticket QR codes
- Scan with admin app gate scanner
- Test verification flow end-to-end

## Build & Deployment

### Development
```bash
# Start development server
npx expo start

# Run on device/simulator
npx expo start --android
npx expo start --ios

# Web version (limited functionality)
npx expo start --web
```

### Production Build

#### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure build
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

#### Local Build
```bash
# Android APK
npx expo run:android --variant release

# iOS IPA (requires macOS + Xcode)
npx expo run:ios --configuration Release
```

### Environment Configuration
```javascript
// app.config.js
export default {
  expo: {
    name: "ProofPass Admin",
    slug: "proofpass-admin",
    version: "1.0.0",
    platforms: ["ios", "android"],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api/v1"
    }
  }
};
```

## Performance Optimization

### Camera Performance
- Optimized barcode scanning settings
- Efficient re-rendering with React.memo
- Proper cleanup of camera resources

### Network Optimization
- Request caching for event data
- Offline support for basic operations
- Retry logic for failed API calls

### Memory Management
- Proper cleanup of event listeners
- Image optimization for event thumbnails
- Efficient list rendering with FlatList

## Security Features

### Authentication Security
- JWT token validation
- Role-based access control
- Secure token storage in AsyncStorage

### Camera Security
- Permission-based camera access
- No image/video recording
- QR data validation before API calls

### Network Security
- HTTPS-only API calls in production
- Request/response validation
- Error handling without data exposure

## Offline Support

### Basic Functionality
- View cached event data
- Display previously scanned tickets
- Queue verification requests

### Sync on Reconnection
- Upload queued verifications
- Refresh event data
- Sync statistics

## Device Compatibility

### Android
- **Minimum SDK**: 21 (Android 5.0)
- **Target SDK**: 34 (Android 14)
- **Camera**: Camera2 API support
- **Storage**: 50MB minimum

### iOS
- **Minimum Version**: iOS 13.0
- **Target Version**: iOS 17.0
- **Camera**: AVFoundation support
- **Storage**: 50MB minimum

## Troubleshooting

### Common Issues

#### Camera Not Working
- Check camera permissions in device settings
- Restart app after granting permissions
- Ensure device has working camera

#### Login Failed
- Verify backend server is running
- Check network connectivity
- Confirm admin credentials

#### QR Scan Not Working
- Ensure QR code is clear and well-lit
- Try manual entry mode
- Check if ticket is already used

### Debug Mode
```bash
# Enable debug logging
npx expo start --dev-client

# View logs
npx expo logs --platform android
npx expo logs --platform ios
```

## License

MIT License - See LICENSE file for details
