import React, { useState } from 'react';
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
  SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAdminAuth } from '@/context/AdminAuthContext';

const API_BASE = 'https://blockmyshow.onrender.com/api';

// ── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg:      '#0a0a0a',
  surface: '#111111',
  primary: '#31bbaf',
  border:  '#2a2a2a',
  text:    '#f0f0f0',
  muted:   '#666666',
  red:     '#ef4444',
};

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function LoginScreen() {
  const { login, setError } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [localError, setLocalError] = useState('');

  const handleLogin = async () => {
    if (!username || !password) { setLocalError('Username and password are required'); return; }
    setLoading(true); setLocalError('');
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Login failed');
      if (!['super_admin', 'admin', 'event_creator', 'gate_operator'].includes(data.admin.role)) {
        throw new Error('Invalid admin role');
      }
      await login(data.admin, data.token);
      setError(null);
      // No navigation needed — index.tsx re-renders when isAuthenticated becomes true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.loginCard}>
        {/* Brand */}
        <View style={s.brand}>
          <Text style={s.logo}>⬡ BLOCKMYSHOW</Text>
          <Text style={s.logoSub}>GATE ADMIN PANEL</Text>
        </View>
        <View style={s.divider} />

        <Text style={s.title}>ADMIN LOGIN</Text>
        <Text style={s.subtitle}>Restricted access — authorised personnel only</Text>

        {localError ? (
          <View style={s.errorBox}><Text style={s.errorText}>⚠ {localError}</Text></View>
        ) : null}

        <Text style={s.label}>USERNAME</Text>
        <TextInput
          style={s.input} placeholder="admin" placeholderTextColor={C.muted}
          value={username} onChangeText={t => { setUsername(t); setLocalError(''); }}
          editable={!loading} autoCapitalize="none"
        />

        <Text style={s.label}>PASSWORD</Text>
        <TextInput
          style={s.input} placeholder="••••••••" placeholderTextColor={C.muted}
          value={password} onChangeText={t => { setPassword(t); setLocalError(''); }}
          secureTextEntry editable={!loading}
        />

        <TouchableOpacity
          style={[s.primaryBtn, loading && s.disabled]}
          onPress={handleLogin} disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={C.bg} />
            : <Text style={s.primaryBtnText}>LOGIN →</Text>
          }
        </TouchableOpacity>

        <View style={s.divider} />
        <Text style={s.footerText}>🔐 Role-based access control enabled</Text>
      </View>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GATE SCANNER SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function GateScannerScreen() {
  const { token, admin, logout } = useAdminAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const [step, setStep] = useState<'scan' | 'entry' | 'otp' | 'verified'>('scan');
  const [tokenId, setTokenId]               = useState<number | null>(null);
  const [manualTokenId, setManualTokenId]   = useState('');
  const [identityId, setIdentityId]         = useState('');
  const [identityManual, setIdentityManual] = useState('');
  const [entryData, setEntryData]           = useState<any>(null);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [otp, setOtp]                       = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // ── QR Parser ──────────────────────────────────────────────────────────
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    // BLOCKMYSHOW:TOKEN:{id}:EVENT:{eventId}
    const bmsMatch = data.match(/^BLOCKMYSHOW:TOKEN:(\d+):EVENT:(\d+)$/i);
    if (bmsMatch) { setTokenId(parseInt(bmsMatch[1], 10)); setStep('entry'); return; }
    // JSON { tokenId: N }
    try {
      const decoded = JSON.parse(data);
      if (decoded.tokenId !== undefined) { setTokenId(Number(decoded.tokenId)); setStep('entry'); return; }
    } catch {/* not JSON */}
    // Plain number
    const n = parseInt(data, 10);
    if (!isNaN(n)) { setTokenId(n); setStep('entry'); return; }
    Alert.alert('Invalid QR Code', 'Could not extract a token ID.');
    setScanned(false);
  };

  const handleManualTokenSubmit = () => {
    const n = parseInt(manualTokenId, 10);
    if (isNaN(n) || n < 0) { Alert.alert('Invalid Token ID', 'Enter a valid ticket token ID'); return; }
    setTokenId(n); setStep('entry');
  };

  // ── Step 1: POST /api/gate/entry ──────────────────────────────────────
  const handleEntry = async () => {
    const finalId = identityManual || identityId;
    if (!tokenId || !finalId) { setError('Token ID and Identity ID are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/gate/entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ token_id: tokenId, identity_id: finalId }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Failed to verify ticket'); return; }
      setEntryData(data); setIdentityId(finalId); setStep('otp');
    } catch (e: any) { setError(e.message || 'Request failed'); }
    finally { setLoading(false); }
  };

  // ── Step 2: POST /api/gate/verify-entry ───────────────────────────────
  const handleOtpVerification = async () => {
    if (!otp || !tokenId || !identityId) { setError('OTP is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/gate/verify-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ token_id: tokenId, identity_id: identityId, otp }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'OTP verification failed'); return; }
      setVerificationResult(data); setStep('verified');
    } catch (e: any) { setError(e.message || 'Request failed'); }
    finally { setLoading(false); }
  };

  const resetScan = () => {
    setStep('scan'); setScanned(false); setTokenId(null); setManualTokenId('');
    setIdentityId(''); setIdentityManual(''); setEntryData(null);
    setOtp(''); setVerificationResult(null); setError('');
  };

  // Logout — clears auth state → index.tsx re-renders → shows LoginScreen
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  // ── Header ──────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={s.header}>
      <View>
        <Text style={s.headerTitle}>⬡ GATE SCANNER</Text>
        {admin && <Text style={s.headerSub}>{admin.username} · {admin.role.replace('_', ' ').toUpperCase()}</Text>}
      </View>
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>LOGOUT ⏻</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Camera permission ──────────────────────────────────────────────────
  if (!permission) return <View style={s.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.container}>
        <Header />
        <View style={s.centerContent}>
          <Text style={s.icon}>📷</Text>
          <Text style={s.sectionTitle}>CAMERA PERMISSION REQUIRED</Text>
          <Text style={s.muted}>Grant camera access to scan QR codes at the gate.</Text>
          <TouchableOpacity style={[s.primaryBtn, { marginTop: 20 }]} onPress={requestPermission}>
            <Text style={s.primaryBtnText}>GRANT PERMISSION</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <Text style={s.label}>MANUAL ENTRY</Text>
          <TextInput
            style={s.input} placeholder="Enter Token ID" placeholderTextColor={C.muted}
            value={manualTokenId} onChangeText={setManualTokenId} keyboardType="numeric"
          />
          <TouchableOpacity style={s.secondaryBtn} onPress={handleManualTokenSubmit}>
            <Text style={s.secondaryBtnText}>USE TOKEN ID</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── STEP: Scan ────────────────────────────────────────────────────────
  if (step === 'scan') {
    return (
      <SafeAreaView style={s.container}>
        <Header />
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={{ flex: 1 }}
        >
          <View style={s.scanOverlay}>
            <View style={s.scanFrame}>
              <View style={[s.corner, s.cornerTL]} /><View style={[s.corner, s.cornerTR]} />
              <View style={[s.corner, s.cornerBL]} /><View style={[s.corner, s.cornerBR]} />
            </View>
            <Text style={s.scanHint}>POINT CAMERA AT QR CODE</Text>
          </View>
        </CameraView>
        <View style={s.bottomPanel}>
          <Text style={s.panelLabel}>MANUAL ENTRY</Text>
          <View style={s.row}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
              placeholder="Token ID" placeholderTextColor={C.muted}
              value={manualTokenId} onChangeText={setManualTokenId}
              keyboardType="numeric" editable={!loading}
            />
            <TouchableOpacity style={[s.primaryBtn, { marginBottom: 0, paddingHorizontal: 20 }]} onPress={handleManualTokenSubmit}>
              <Text style={s.primaryBtnText}>GO</Text>
            </TouchableOpacity>
          </View>
          {scanned && tokenId !== null && (
            <View style={s.scanResult}>
              <Text style={s.scanResultText}>✓ QR SCANNED — Token #{tokenId}</Text>
              <View style={s.row}>
                <TouchableOpacity style={[s.secondaryBtn, { flex: 1, marginRight: 8, marginBottom: 0 }]} onPress={() => { setScanned(false); setTokenId(null); }}>
                  <Text style={s.secondaryBtnText}>RESCAN</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.primaryBtn, { flex: 1, marginBottom: 0 }]} onPress={() => setStep('entry')}>
                  <Text style={s.primaryBtnText}>PROCEED →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── STEP: Identity ────────────────────────────────────────────────────
  if (step === 'entry') {
    return (
      <SafeAreaView style={s.container}>
        <Header />
        <ScrollView contentContainerStyle={s.formContainer}>
          <View style={s.stepBadge}><Text style={s.stepBadgeText}>STEP 1 OF 2</Text></View>
          <Text style={s.sectionTitle}>VERIFY IDENTITY</Text>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>TOKEN ID</Text>
            <Text style={s.infoVal}>#{tokenId}</Text>
          </View>
          <Text style={s.label}>AADHAAR / IDENTITY ID</Text>
          <TextInput
            style={s.input} placeholder="Enter 12-digit Identity ID"
            placeholderTextColor={C.muted} value={identityManual}
            onChangeText={setIdentityManual} keyboardType="numeric" editable={!loading}
          />
          {error ? <View style={s.errorBox}><Text style={s.errorText}>⚠ {error}</Text></View> : null}
          <TouchableOpacity style={[s.primaryBtn, loading && s.disabled]} onPress={handleEntry} disabled={loading}>
            {loading ? <ActivityIndicator color={C.bg} /> : <Text style={s.primaryBtnText}>VERIFY & SEND OTP →</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={resetScan}>
            <Text style={s.secondaryBtnText}>← BACK TO SCAN</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── STEP: OTP ─────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <SafeAreaView style={s.container}>
        <Header />
        <ScrollView contentContainerStyle={s.formContainer}>
          <View style={s.stepBadge}><Text style={s.stepBadgeText}>STEP 2 OF 2</Text></View>
          <Text style={s.sectionTitle}>OTP VERIFICATION</Text>
          {entryData?.identity?.profile_photo_url && (
            <Image source={{ uri: entryData.identity.profile_photo_url }} style={s.profilePhoto} />
          )}
          <View style={s.identityCard}>
            <Text style={s.identityName}>{entryData?.identity?.name || 'ATTENDEE'}</Text>
            <Text style={s.identityPhone}>{entryData?.identity?.phone_number}</Text>
          </View>
          <Text style={s.label}>OTP SENT TO REGISTERED PHONE</Text>
          <TextInput
            style={[s.input, s.otpInput]} placeholder="• • • • • •"
            placeholderTextColor={C.muted} value={otp}
            onChangeText={setOtp} keyboardType="numeric" maxLength={6} editable={!loading}
          />
          <Text style={s.testHint}>Testing OTP: <Text style={{ color: C.primary }}>123456</Text></Text>
          {error ? <View style={s.errorBox}><Text style={s.errorText}>⚠ {error}</Text></View> : null}
          <TouchableOpacity style={[s.primaryBtn, (loading || otp.length !== 6) && s.disabled]} onPress={handleOtpVerification} disabled={loading || otp.length !== 6}>
            {loading ? <ActivityIndicator color={C.bg} /> : <Text style={s.primaryBtnText}>✓ CONFIRM ENTRY</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={resetScan}>
            <Text style={s.secondaryBtnText}>✕ CANCEL</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── STEP: Verified ────────────────────────────────────────────────────
  if (step === 'verified') {
    return (
      <SafeAreaView style={s.container}>
        <Header />
        <View style={s.centerContent}>
          <View style={s.successBox}>
            <Text style={s.successIcon}>✓</Text>
          </View>
          <Text style={s.successTitle}>ENTRY VERIFIED</Text>
          <Text style={s.muted}>{verificationResult?.message}</Text>
          {verificationResult?.ticket_info && (
            <View style={[s.infoRow, { marginTop: 24, width: '100%' }]}>
              <Text style={s.infoKey}>EVENT ID</Text>
              <Text style={s.infoVal}>#{verificationResult.ticket_info.eventId}</Text>
            </View>
          )}
          <TouchableOpacity style={[s.primaryBtn, { marginTop: 32, width: '100%' }]} onPress={resetScan}>
            <Text style={s.primaryBtnText}>SCAN NEXT TICKET →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT — switches between Login and Gate based on auth state
// ═══════════════════════════════════════════════════════════════════════════
export default function Index() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={{ fontFamily: 'monospace', color: C.muted, marginTop: 16, letterSpacing: 2 }}>LOADING…</Text>
      </View>
    );
  }

  // When logout() is called, isAuthenticated becomes false → this re-renders → LoginScreen shown
  return isAuthenticated ? <GateScannerScreen /> : <LoginScreen />;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },

  // Login
  loginCard:    { backgroundColor: C.surface, borderWidth: 3, borderColor: C.border, padding: 28, margin: 24, shadowColor: C.primary, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 0.25, shadowRadius: 0, elevation: 10 },
  brand:        { alignItems: 'center', marginBottom: 20 },
  logo:         { fontFamily: 'monospace', fontSize: 16, fontWeight: '900', color: C.primary, letterSpacing: 3, textAlign: 'center' },
  logoSub:      { fontFamily: 'monospace', fontSize: 10, color: C.muted, letterSpacing: 4, marginTop: 4, textAlign: 'center' },
  footerText:   { fontFamily: 'monospace', fontSize: 11, color: C.muted, textAlign: 'center' },

  // Header
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 3, borderBottomColor: C.border, backgroundColor: C.surface },
  headerTitle:  { fontFamily: 'monospace', fontSize: 14, fontWeight: '900', color: C.primary, letterSpacing: 2 },
  headerSub:    { fontFamily: 'monospace', fontSize: 10, color: C.muted, marginTop: 2 },
  logoutBtn:    { paddingVertical: 8, paddingHorizontal: 14, borderWidth: 2, borderColor: C.red },
  logoutText:   { fontFamily: 'monospace', fontSize: 11, color: C.red, fontWeight: '700' },

  // Scanner
  scanOverlay:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  scanFrame:    { width: 240, height: 240, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner:       { position: 'absolute', width: 32, height: 32, borderColor: C.primary, borderWidth: 3 },
  cornerTL:     { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR:     { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL:     { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR:     { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint:     { marginTop: 24, fontFamily: 'monospace', fontSize: 12, color: '#fff', letterSpacing: 2, fontWeight: '700' },
  bottomPanel:  { backgroundColor: C.surface, padding: 16, borderTopWidth: 3, borderTopColor: C.border },
  panelLabel:   { fontFamily: 'monospace', fontSize: 10, color: C.muted, letterSpacing: 2, marginBottom: 10 },
  row:          { flexDirection: 'row', alignItems: 'center' },
  scanResult:   { marginTop: 14, padding: 12, borderWidth: 2, borderColor: C.primary, backgroundColor: 'rgba(49,187,175,0.08)' },
  scanResultText: { fontFamily: 'monospace', fontSize: 12, color: C.primary, fontWeight: '700', marginBottom: 10 },

  // Form
  formContainer: { padding: 20, flexGrow: 1 },
  stepBadge:    { paddingVertical: 4, paddingHorizontal: 10, borderWidth: 2, borderColor: C.primary, alignSelf: 'flex-start', marginBottom: 16 },
  stepBadgeText: { fontFamily: 'monospace', fontSize: 10, color: C.primary, fontWeight: '700', letterSpacing: 2 },
  sectionTitle: { fontFamily: 'monospace', fontSize: 18, fontWeight: '900', color: C.text, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 },
  label:        { fontFamily: 'monospace', fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title:        { fontFamily: 'monospace', fontSize: 20, fontWeight: '900', color: C.text, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  subtitle:     { fontFamily: 'monospace', fontSize: 11, color: C.muted, marginBottom: 20, lineHeight: 18 },
  input:        { borderWidth: 2, borderColor: C.border, backgroundColor: '#0f0f0f', color: C.text, padding: 14, marginBottom: 16, fontFamily: 'monospace', fontSize: 15, borderRadius: 0 },
  otpInput:     { fontSize: 24, letterSpacing: 16, textAlign: 'center' },
  testHint:     { fontFamily: 'monospace', fontSize: 12, color: C.muted, textAlign: 'center', marginBottom: 16 },

  // Buttons
  primaryBtn:   { backgroundColor: C.primary, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: C.primary },
  primaryBtnText: { fontFamily: 'monospace', fontWeight: '900', fontSize: 13, color: C.bg, letterSpacing: 1 },
  secondaryBtn: { backgroundColor: 'transparent', paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: C.border },
  secondaryBtnText: { fontFamily: 'monospace', fontWeight: '700', fontSize: 13, color: C.muted, letterSpacing: 1 },
  disabled:     { opacity: 0.5 },

  // Error / info
  errorBox:     { borderWidth: 2, borderColor: C.red, backgroundColor: 'rgba(239,68,68,0.08)', padding: 12, marginBottom: 16 },
  errorText:    { fontFamily: 'monospace', fontSize: 12, color: C.red },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: C.border, padding: 14, marginBottom: 16, backgroundColor: '#181818' },
  infoKey:      { fontFamily: 'monospace', fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  infoVal:      { fontFamily: 'monospace', fontSize: 15, color: C.primary, fontWeight: '700' },
  identityCard: { borderWidth: 3, borderColor: C.primary, backgroundColor: 'rgba(49,187,175,0.06)', padding: 16, marginBottom: 20, alignItems: 'center' },
  identityName: { fontFamily: 'monospace', fontSize: 18, fontWeight: '900', color: C.text, textTransform: 'uppercase', letterSpacing: 2 },
  identityPhone: { fontFamily: 'monospace', fontSize: 13, color: C.muted, marginTop: 4 },
  profilePhoto: { width: 90, height: 90, borderWidth: 3, borderColor: C.primary, borderRadius: 0, alignSelf: 'center', marginBottom: 16 },

  // Center / Success
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  icon:         { fontSize: 48, marginBottom: 16 },
  muted:        { fontFamily: 'monospace', fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 8 },
  successBox:   { width: 100, height: 100, borderWidth: 4, borderColor: C.primary, backgroundColor: 'rgba(49,187,175,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: C.primary, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 8 },
  successIcon:  { fontSize: 44, color: C.primary, fontWeight: '900' },
  successTitle: { fontFamily: 'monospace', fontSize: 22, fontWeight: '900', color: C.primary, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 },

  // Misc
  divider:      { height: 2, backgroundColor: C.border, marginVertical: 20 },
});
