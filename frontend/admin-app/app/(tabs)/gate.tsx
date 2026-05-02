import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAdminAuth } from '@/context/AdminAuthContext';

const API_BASE = 'http://localhost:5000/api/v1';

interface VerificationResult {
  success: boolean;
  message: string;
  ticket?: any;
  identity?: any;
}

export default function GateScannerScreen() {
  const { token, admin } = useAdminAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<VerificationResult | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualTicketId, setManualTicketId] = useState('');
  const [stats, setStats] = useState({ verified: 0, failed: 0 });
  const cameraRef = useRef(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.noPermissionText}>📷 Camera Access Required</Text>
          <Text style={styles.permissionSubtext}>
            Camera permission is needed to scan QR codes on tickets
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const verifyTicket = async (ticketData: string) => {
    setVerifying(true);
    
    try {
      let qrData;
      try {
        qrData = JSON.parse(ticketData);
      } catch {
        // If not JSON, treat as plain ticket ID
        qrData = { tokenId: ticketData };
      }

      // Step 1: Verify QR code
      const qrResponse = await fetch(`${API_BASE}/gate/verify-qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData: ticketData }),
      });

      const qrResult = await qrResponse.json();
      if (!qrResult.success) {
        throw new Error(qrResult.error || 'Invalid QR code');
      }

      // Step 2: Multi-step verification (simplified for demo)
      const verifyResponse = await fetch(`${API_BASE}/gate/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tokenId: qrData.tokenId,
          step: 'complete' // Simplified verification
        }),
      });

      const verifyResult = await verifyResponse.json();
      
      if (verifyResult.success) {
        // Step 3: Mark ticket as used
        await fetch(`${API_BASE}/gate/mark-used`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            tokenId: qrData.tokenId,
            timestamp: new Date().toISOString()
          }),
        });

        setStats(prev => ({ ...prev, verified: prev.verified + 1 }));
        setLastResult({ 
          success: true, 
          message: '✅ Entry Approved', 
          ticket: qrData,
          identity: verifyResult.identity
        });
        
        Alert.alert('✅ Entry Approved', 'Ticket verified successfully');
      } else {
        throw new Error(verifyResult.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
      setLastResult({ 
        success: false, 
        message: '❌ Entry Denied: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
      
      Alert.alert('❌ Entry Denied', error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setVerifying(false);
      setTimeout(() => {
        setScanned(false);
        setLastResult(null);
      }, 3000);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    await verifyTicket(data);
  };

  const handleManualVerify = async () => {
    if (!manualTicketId.trim()) {
      Alert.alert('Error', 'Please enter a ticket ID');
      return;
    }
    
    setScanned(true);
    await verifyTicket(manualTicketId);
    setManualTicketId('');
    setManualEntry(false);
  };

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.verified}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.failed}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statRole}>{admin?.role}</Text>
          <Text style={styles.statLabel}>Role</Text>
        </View>
      </View>

      {manualEntry ? (
        /* Manual Entry Mode */
        <View style={styles.manualContainer}>
          <Text style={styles.manualTitle}>Manual Ticket Entry</Text>
          <TextInput
            style={styles.manualInput}
            placeholder="Enter Ticket ID or Token ID"
            value={manualTicketId}
            onChangeText={setManualTicketId}
            autoCapitalize="none"
          />
          <View style={styles.manualButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setManualEntry(false);
                setManualTicketId('');
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.verifyButton]}
              onPress={handleManualVerify}
              disabled={verifying}
            >
              <Text style={styles.buttonText}>
                {verifying ? 'Verifying...' : 'Verify Ticket'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Camera Scanner Mode */
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'code128', 'code39'],
          }}
        >
          <View style={styles.overlay}>
            {/* Scan Frame */}
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            
            <Text style={styles.scanInstruction}>
              {scanned ? 'Processing...' : 'Align QR code within the frame'}
            </Text>
          </View>

          {/* Verification Overlay */}
          {verifying && (
            <View style={styles.verifyingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.verifyingText}>Verifying Ticket...</Text>
            </View>
          )}

          {/* Result Overlay */}
          {lastResult && (
            <View style={[
              styles.resultOverlay, 
              lastResult.success ? styles.successOverlay : styles.failureOverlay
            ]}>
              <Text style={styles.resultIcon}>
                {lastResult.success ? '✅' : '❌'}
              </Text>
              <Text style={styles.resultText}>{lastResult.message}</Text>
              {lastResult.ticket && (
                <Text style={styles.resultSubtext}>
                  Token ID: {lastResult.ticket.tokenId}
                </Text>
              )}
              {lastResult.identity && (
                <Text style={styles.resultSubtext}>
                  Identity: {lastResult.identity.name}
                </Text>
              )}
            </View>
          )}
        </CameraView>
      )}

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <TouchableOpacity
          style={[styles.controlButton, styles.resetButton]}
          onPress={() => {
            setScanned(false);
            setLastResult(null);
          }}
          disabled={verifying}
        >
          <Text style={styles.controlButtonText}>🔄 Reset Scanner</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.manualButton]}
          onPress={() => setManualEntry(true)}
          disabled={verifying}
        >
          <Text style={styles.controlButtonText}>⌨️ Manual Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a90e2',
    textTransform: 'uppercase',
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4a90e2',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanInstruction: {
    marginTop: 32,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  verifyingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  resultOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  successOverlay: {
    backgroundColor: '#10b981',
  },
  failureOverlay: {
    backgroundColor: '#ef4444',
  },
  resultIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  resultSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
  controlPanel: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#4a90e2',
  },
  manualButton: {
    backgroundColor: '#6b7280',
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  manualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  manualTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  manualInput: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  manualButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  verifyButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noPermissionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
