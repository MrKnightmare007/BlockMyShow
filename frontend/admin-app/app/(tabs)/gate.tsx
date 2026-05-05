import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAdminAuth } from '@/context/AdminAuthContext';

const API_BASE = 'http://192.168.29.141:5000/api';

interface GateEntry {
  tokenId: number;
  identityId: string;
  name: string;
  profilePhotoUrl?: string;
}

interface GateVerification {
  tokenId: number;
  identityId: string;
  otp: string;
}

export default function GateScannerScreen() {
  const { token } = useAdminAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);

  // Step 1: Scan & Entry
  const [step, setStep] = useState<'scan' | 'entry' | 'otp' | 'verified'>('scan');
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [manualTokenId, setManualTokenId] = useState('');
  const [identityId, setIdentityId] = useState('');
  const [identityManual, setIdentityManual] = useState('');

  // Step 2: Entry Result
  const [entryData, setEntryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 3: OTP Verification
  const [otp, setOtp] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Permissions
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.permissionText}>📷 Camera Permission Required</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>

          <View style={styles.manualPanel}>
            <Text style={styles.manualTitle}>Manual Token ID</Text>
            <Text style={styles.manualText}>You can still enter the ticket token ID without scanning a QR code.</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter token ID"
              value={manualTokenId}
              onChangeText={setManualTokenId}
              keyboardType="numeric"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, styles.manualButton]}
              onPress={handleManualTokenSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Use Token ID</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Handle QR code scan
  // Supports formats:
  //   JSON: { "tokenId": 1 }
  //   BlockMyShow QR: BLOCKMYSHOW:TOKEN:1:EVENT:0
  //   Plain number:   1
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);

      // Format: BLOCKMYSHOW:TOKEN:{id}:EVENT:{eventId}
      const bmsMatch = data.match(/^BLOCKMYSHOW:TOKEN:(\d+):EVENT:(\d+)$/i);
      if (bmsMatch) {
        setTokenId(parseInt(bmsMatch[1], 10));
        setStep('entry');
        return;
      }

      // Format: JSON { tokenId: N }
      try {
        const decoded = JSON.parse(data);
        if (decoded.tokenId !== undefined) {
          setTokenId(Number(decoded.tokenId));
          setStep('entry');
          return;
        }
      } catch {/* not JSON */}

      // Format: plain number
      const tokenIdNum = parseInt(data, 10);
      if (!isNaN(tokenIdNum)) {
        setTokenId(tokenIdNum);
        setStep('entry');
        return;
      }

      Alert.alert('Invalid QR Code', 'QR code does not contain a valid token ID');
      setScanned(false);
    }
  };

  function handleManualTokenSubmit() {
    const tokenValue = parseInt(manualTokenId, 10);

    if (Number.isNaN(tokenValue) || tokenValue <= 0) {
      Alert.alert('Invalid Token ID', 'Enter a valid ticket token ID');
      return;
    }

    setTokenId(tokenValue);
    setStep('entry');
  }

  // Step 1: Request Entry (calls /api/gate/entry)
  const handleEntry = async () => {
    if (!tokenId || (!identityId && !identityManual)) {
      setError('Token ID and Identity ID are required');
      return;
    }

    const finalIdentityId = identityManual || identityId;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/gate/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          token_id: tokenId,
          identity_id: finalIdentityId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Failed to verify ticket');
        return;
      }

      // Store identity info and move to OTP step
      setEntryData(data);
      setIdentityId(finalIdentityId);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Entry with OTP (calls /api/gate/verify-entry)
  const handleOtpVerification = async () => {
    if (!otp || !tokenId || !identityId) {
      setError('OTP is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/gate/verify-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          token_id: tokenId,
          identity_id: identityId,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'OTP verification failed');
        return;
      }

      setVerificationResult(data);
      setStep('verified');
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  // Reset to scanning
  const resetScan = () => {
    setStep('scan');
    setScanned(false);
    setScanning(true);
    setTokenId(null);
    setManualTokenId('');
    setIdentityId('');
    setIdentityManual('');
    setEntryData(null);
    setOtp('');
    setVerificationResult(null);
    setError('');
  };

  // ========== RENDER BASED ON STEP ==========

  // STEP 1: QR Scanning
  if (step === 'scan') {
    return (
      <View style={styles.container}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          style={styles.camera}
        >
          <View style={styles.scanOverlay}>
            <View style={styles.scanBox} />
            <Text style={styles.scanText}>Point camera at QR code</Text>
          </View>
        </CameraView>

        <View style={styles.manualPanel}>
          <Text style={styles.manualTitle}>Manual Token ID</Text>
          <Text style={styles.manualText}>Enter the ticket token ID if you do not have the QR code.</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter token ID"
            value={manualTokenId}
            onChangeText={setManualTokenId}
            keyboardType="numeric"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.button, styles.manualButton]}
            onPress={handleManualTokenSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Use Token ID</Text>
          </TouchableOpacity>
        </View>

        {scanned && (
          <View style={styles.scanResultContainer}>
            <Text style={styles.scanResultText}>QR Code Detected: {tokenId}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setScanned(false);
                setTokenId(null);
              }}
            >
              <Text style={styles.buttonText}>Scan Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.proceedButton]}
              onPress={() => setStep('entry')}
            >
              <Text style={styles.buttonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // STEP 2: Entry - Ask for Identity ID
  if (step === 'entry') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formContainer}>
        <Text style={styles.title}>Verify Identity</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Token ID:</Text>
          <Text style={styles.infoValue}>{tokenId}</Text>
        </View>

        <Text style={styles.label}>Identity ID (Aadhaar/ID Number)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 12-digit Identity ID"
          value={identityManual}
          onChangeText={setIdentityManual}
          keyboardType="numeric"
          editable={!loading}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleEntry}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify & Send OTP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={resetScan}>
          <Text style={styles.buttonText}>Back to Scan</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // STEP 3: OTP Verification
  if (step === 'otp') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formContainer}>
        <Text style={styles.title}>Verify with OTP</Text>

        {entryData?.identity?.profile_photo_url && (
          <Image
            source={{ uri: entryData.identity.profile_photo_url }}
            style={styles.profilePhoto}
          />
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{entryData?.identity?.name || 'N/A'}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Message:</Text>
          <Text style={styles.infoValue}>{entryData?.message || ''}</Text>
        </View>

        <Text style={styles.label}>Enter OTP sent to {entryData?.identity?.phone_number}</Text>
        <TextInput
          style={styles.input}
          placeholder="6-digit OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={6}
          editable={!loading}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleOtpVerification}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={resetScan}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // STEP 4: Verified Success
  if (step === 'verified') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Entry Verified!</Text>
          <Text style={styles.successMessage}>{verificationResult?.message}</Text>

          {verificationResult?.ticket_info && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Event ID:</Text>
              <Text style={styles.infoValue}>{verificationResult.ticket_info.eventId}</Text>
            </View>
          )}

          <TouchableOpacity style={[styles.button, styles.proceedButton]} onPress={resetScan}>
            <Text style={styles.buttonText}>Scan Next Ticket</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanText: {
    marginTop: 20,
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  scanResultContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scanResultText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  manualPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  manualTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
  },
  manualText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },

  formContainer: {
    padding: 20,
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  infoBox: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 20,
  },

  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  proceedButton: {
    backgroundColor: '#2196F3',
  },
  manualButton: {
    marginBottom: 0,
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  errorText: {
    color: '#f44336',
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '500',
  },

  successIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#4CAF50',
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});
