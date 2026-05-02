import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAdminAuth } from '../context/AdminAuthContext';

const API_BASE = 'http://localhost:5000/api/v1';

export default function AdminLoginScreen() {
  const { login, setError } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Verify role-based access
      if (!['admin', 'event_creator', 'gate_operator'].includes(data.admin.role)) {
        throw new Error('Invalid admin role');
      }

      await login(data.admin, data.token);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Admin Login</Text>
        <Text style={styles.subtitle}>Access control panel</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          editable={!loading}
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.deviceInfo}>
          🔐 Role-based access control enabled
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  input: {
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#000',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  deviceInfo: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
