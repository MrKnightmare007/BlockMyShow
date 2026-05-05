import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminAuth } from '../context/AdminAuthContext';

const API_BASE = 'http://192.168.29.141:5000/api';

const C = {
  bg:      '#0a0a0a',
  surface: '#111111',
  primary: '#31bbaf',
  border:  '#2a2a2a',
  text:    '#f0f0f0',
  muted:   '#666666',
  red:     '#ef4444',
};

export default function AdminLoginScreen() {
  const { login, setError } = useAdminAuth();
  const router = useRouter();
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
      router.replace('/(tabs)');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setLocalError(msg);
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Grid background lines effect */}
      <View style={s.gridOverlay} pointerEvents="none" />

      <View style={s.card}>
        {/* Logo / Brand */}
        <View style={s.brand}>
          <Text style={s.logo}>⬡ BLOCKMYSHOW</Text>
          <Text style={s.logoSub}>GATE ADMIN PANEL</Text>
        </View>

        <View style={s.divider} />

        <Text style={s.title}>ADMIN LOGIN</Text>
        <Text style={s.subtitle}>Restricted access — authorised personnel only</Text>

        {localError ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>⚠ {localError}</Text>
          </View>
        ) : null}

        <Text style={s.label}>USERNAME</Text>
        <TextInput
          style={s.input}
          placeholder="admin"
          placeholderTextColor={C.muted}
          value={username}
          onChangeText={t => { setUsername(t); setLocalError(''); }}
          editable={!loading}
          autoCapitalize="none"
        />

        <Text style={s.label}>PASSWORD</Text>
        <TextInput
          style={s.input}
          placeholder="••••••••"
          placeholderTextColor={C.muted}
          value={password}
          onChangeText={t => { setPassword(t); setLocalError(''); }}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[s.loginButton, loading && s.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={C.bg} />
            : <Text style={s.loginButtonText}>LOGIN →</Text>
          }
        </TouchableOpacity>

        <View style={s.divider} />
        <Text style={s.footerText}>🔐 Role-based access control enabled</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gridOverlay: {
    position: 'absolute', inset: 0,
    // Simulated grid via border — RN can't do CSS grid backgrounds,
    // but the black bg + card borders give the brutalist feel
  },
  card: {
    backgroundColor: C.surface,
    borderWidth: 3,
    borderColor: C.border,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    shadowColor: C.primary,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 10,
  },
  brand: { alignItems: 'center', marginBottom: 20 },
  logo: {
    fontFamily: 'monospace', fontSize: 16, fontWeight: '900',
    color: C.primary, letterSpacing: 3, textAlign: 'center',
  },
  logoSub: {
    fontFamily: 'monospace', fontSize: 10, color: C.muted,
    letterSpacing: 4, marginTop: 4, textAlign: 'center',
  },
  divider: {
    height: 2, backgroundColor: C.border, marginVertical: 20,
  },
  title: {
    fontFamily: 'monospace', fontSize: 20, fontWeight: '900',
    color: C.text, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'monospace', fontSize: 11, color: C.muted, marginBottom: 24, lineHeight: 16,
  },
  errorBox: {
    borderWidth: 2, borderColor: C.red,
    backgroundColor: 'rgba(239,68,68,0.08)',
    padding: 12, marginBottom: 16,
  },
  errorText: {
    fontFamily: 'monospace', fontSize: 12, color: C.red,
  },
  label: {
    fontFamily: 'monospace', fontSize: 10, color: C.muted,
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
  },
  input: {
    borderWidth: 2, borderColor: C.border,
    backgroundColor: '#0f0f0f', color: C.text,
    padding: 14, marginBottom: 18,
    fontFamily: 'monospace', fontSize: 14,
    borderRadius: 0,
  },
  loginButton: {
    backgroundColor: C.primary,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 2, borderColor: C.primary,
    marginBottom: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 6,
  },
  loginButtonDisabled: { opacity: 0.5 },
  loginButtonText: {
    fontFamily: 'monospace', fontWeight: '900',
    fontSize: 14, color: C.bg, letterSpacing: 2,
  },
  footerText: {
    fontFamily: 'monospace', fontSize: 11,
    color: C.muted, textAlign: 'center',
  },
});
