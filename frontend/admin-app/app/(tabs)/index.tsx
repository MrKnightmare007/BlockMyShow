import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAdminAuth } from '@/context/AdminAuthContext';

const API_BASE = 'http://localhost:5000/api/v1';

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  recentVerifications: number;
}

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    recentVerifications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Mock stats for now - in real implementation, these would come from API
      setStats({
        totalEvents: 12,
        activeEvents: 8,
        totalTicketsSold: 1247,
        totalRevenue: 2485000,
        recentVerifications: 156
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Super Admin';
      case 'event_creator': return 'Event Manager';
      case 'gate_operator': return 'Gate Operator';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'event_creator': return '#4a90e2';
      case 'gate_operator': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getAvailableFeatures = (role: string) => {
    switch (role) {
      case 'admin':
        return ['Event Management', 'Gate Scanner', 'User Management', 'Analytics', 'System Settings'];
      case 'event_creator':
        return ['Event Management', 'Analytics', 'Revenue Reports'];
      case 'gate_operator':
        return ['Gate Scanner', 'Ticket Verification', 'Entry Logs'];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.adminName}>{admin?.username || 'Admin'}</Text>
        </View>
        <View style={styles.roleContainer}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(admin?.role || '') }]}>
            <Text style={styles.roleText}>{getRoleDisplayName(admin?.role || '')}</Text>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Text style={styles.statNumber}>{stats.totalEvents}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
            <Text style={styles.statSubtext}>{stats.activeEvents} active</Text>
          </View>
          <View style={[styles.statCard, styles.successCard]}>
            <Text style={styles.statNumber}>{stats.totalTicketsSold.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Tickets Sold</Text>
            <Text style={styles.statSubtext}>All time</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.revenueCard]}>
            <Text style={styles.statNumber}>{formatCurrency(stats.totalRevenue)}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={styles.statSubtext}>Gross earnings</Text>
          </View>
          <View style={[styles.statCard, styles.verificationCard]}>
            <Text style={styles.statNumber}>{stats.recentVerifications}</Text>
            <Text style={styles.statLabel}>Verifications</Text>
            <Text style={styles.statSubtext}>Last 24h</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          {admin?.role === 'admin' || admin?.role === 'event_creator' ? (
            <TouchableOpacity 
              style={[styles.actionCard, styles.createEventAction]}
              onPress={() => Alert.alert('Info', 'Navigate to Events tab to create new events')}
            >
              <Text style={styles.actionIcon}>🎫</Text>
              <Text style={styles.actionTitle}>Create Event</Text>
              <Text style={styles.actionSubtitle}>Set up new event</Text>
            </TouchableOpacity>
          ) : null}
          
          {admin?.role === 'admin' || admin?.role === 'gate_operator' ? (
            <TouchableOpacity 
              style={[styles.actionCard, styles.scanAction]}
              onPress={() => Alert.alert('Info', 'Navigate to Gate tab to start scanning')}
            >
              <Text style={styles.actionIcon}>📱</Text>
              <Text style={styles.actionTitle}>Scan Tickets</Text>
              <Text style={styles.actionSubtitle}>Verify entry</Text>
            </TouchableOpacity>
          ) : null}
          
          <TouchableOpacity 
            style={[styles.actionCard, styles.reportsAction]}
            onPress={() => Alert.alert('Reports', 'Analytics and reporting features coming soon')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>View Reports</Text>
            <Text style={styles.actionSubtitle}>Analytics & insights</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Permissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Permissions</Text>
        <View style={styles.permissionsContainer}>
          {getAvailableFeatures(admin?.role || '').map((feature, index) => (
            <View key={index} style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>✓</Text>
              <Text style={styles.permissionText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* System Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Information</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform:</Text>
            <Text style={styles.infoValue}>BlockMyShow Admin v1.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Backend:</Text>
            <Text style={styles.infoValue}>Connected</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Blockchain:</Text>
            <Text style={styles.infoValue}>Base Sepolia</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated:</Text>
            <Text style={styles.infoValue}>May 2, 2026</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  adminName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  roleContainer: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  primaryCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
  },
  successCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  revenueCard: {
    backgroundColor: '#fefce8',
    borderColor: '#eab308',
  },
  verificationCard: {
    backgroundColor: '#fdf2f8',
    borderColor: '#ec4899',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 10,
    color: '#888',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  createEventAction: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
  },
  scanAction: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  reportsAction: {
    backgroundColor: '#fdf4ff',
    borderColor: '#a855f7',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  permissionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionIcon: {
    fontSize: 16,
    color: '#10b981',
    marginRight: 12,
    width: 20,
  },
  permissionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
