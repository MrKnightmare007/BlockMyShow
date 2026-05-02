import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useAdminAuth } from '@/context/AdminAuthContext';

const API_BASE = 'http://localhost:5000/api/v1';

interface Event {
  id: string;
  title: string;
  venue: string;
  date: string;
  price: number;
  totalTickets: number;
  ticketsMinted: number;
  organizer: string;
  status: string;
  metadataURI?: string;
}

export default function EventsManagementScreen() {
  const { token, admin } = useAdminAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    venue: '',
    date: '',
    price: '',
    totalTickets: '',
    description: ''
  });

  const fetchEvents = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/events`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch events');

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load events');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.venue || !newEvent.date || !newEvent.price || !newEvent.totalTickets) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newEvent.title,
          venue: newEvent.venue,
          date: new Date(newEvent.date).toISOString(),
          price: parseInt(newEvent.price),
          totalTickets: parseInt(newEvent.totalTickets),
          description: newEvent.description,
          metadataURI: 'ipfs://placeholder'
        }),
      });

      if (!response.ok) throw new Error('Failed to create event');

      Alert.alert('Success', 'Event created successfully');
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        venue: '',
        date: '',
        price: '',
        totalTickets: '',
        description: ''
      });
      fetchEvents(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to create event');
      console.error(error);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    Alert.alert(
      'Cancel Event',
      `Are you sure you want to cancel "${eventTitle}"? This will trigger refunds for all sold tickets.`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Confirm Cancellation',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE}/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });

              if (!response.ok) throw new Error('Failed to cancel event');

              const result = await response.json();
              Alert.alert(
                'Event Cancelled', 
                `Event cancelled successfully. ${result.refundsTriggered || 0} refunds have been triggered.`
              );
              fetchEvents(true);
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel event');
              console.error(error);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  const getSoldPercentage = (sold: number, total: number) => {
    return Math.round((sold / total) * 100);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Event Management</Text>
          <Text style={styles.headerSubtitle}>
            {events.length} event{events.length !== 1 ? 's' : ''} • Role: {admin?.role}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Create Event</Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎫</Text>
          <Text style={styles.emptyText}>No events found</Text>
          <Text style={styles.emptySubtext}>Create your first event to get started</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          onRefresh={() => fetchEvents(true)}
          refreshing={refreshing}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const soldPercentage = getSoldPercentage(item.ticketsMinted, item.totalTickets);
            const remaining = item.totalTickets - item.ticketsMinted;
            
            return (
              <View style={styles.eventCard}>
                {/* Event Header */}
                <View style={styles.eventHeader}>
                  <View style={styles.eventTitleContainer}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <View style={[
                      styles.statusBadge,
                      item.status === 'active' ? styles.activeBadge : styles.inactiveBadge
                    ]}>
                      <Text style={styles.statusText}>
                        {item.status === 'active' ? 'ACTIVE' : 'CANCELLED'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Event Details */}
                <View style={styles.eventDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📅</Text>
                    <Text style={styles.detailText}>{formatDate(item.date)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📍</Text>
                    <Text style={styles.detailText}>{item.venue}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>💰</Text>
                    <Text style={styles.detailText}>{formatPrice(item.price)} per ticket</Text>
                  </View>
                </View>

                {/* Sales Progress */}
                <View style={styles.salesContainer}>
                  <View style={styles.salesHeader}>
                    <Text style={styles.salesText}>
                      {item.ticketsMinted} / {item.totalTickets} sold ({soldPercentage}%)
                    </Text>
                    <Text style={styles.remainingText}>
                      {remaining} remaining
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${soldPercentage}%`,
                          backgroundColor: soldPercentage > 80 ? '#ef4444' : soldPercentage > 50 ? '#f59e0b' : '#10b981'
                        }
                      ]} 
                    />
                  </View>
                </View>

                {/* Revenue */}
                <View style={styles.revenueContainer}>
                  <Text style={styles.revenueLabel}>Revenue Generated</Text>
                  <Text style={styles.revenueAmount}>
                    {formatPrice(item.ticketsMinted * item.price)}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.button, styles.editButton]}
                    onPress={() => Alert.alert('Info', 'Edit Event - Feature coming soon')}
                  >
                    <Text style={styles.buttonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.statsButton]}
                    onPress={() => Alert.alert('Stats', `Event: ${item.title}\nSold: ${item.ticketsMinted}/${item.totalTickets}\nRevenue: ${formatPrice(item.ticketsMinted * item.price)}`)}
                  >
                    <Text style={styles.buttonText}>📊 Stats</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={() => handleDeleteEvent(item.id, item.title)}
                  >
                    <Text style={styles.buttonText}>🗑️ Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Create Event Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Event</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Event Title *"
              value={newEvent.title}
              onChangeText={(text) => setNewEvent({...newEvent, title: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Venue *"
              value={newEvent.venue}
              onChangeText={(text) => setNewEvent({...newEvent, venue: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD) *"
              value={newEvent.date}
              onChangeText={(text) => setNewEvent({...newEvent, date: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Ticket Price (₹) *"
              value={newEvent.price}
              onChangeText={(text) => setNewEvent({...newEvent, price: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Total Tickets *"
              value={newEvent.totalTickets}
              onChangeText={(text) => setNewEvent({...newEvent, totalTickets: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={newEvent.description}
              onChangeText={(text) => setNewEvent({...newEvent, description: text})}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createModalButton]}
                onPress={handleCreateEvent}
              >
                <Text style={styles.createModalButtonText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  createButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    padding: 12,
  },
  eventCard: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    marginBottom: 12,
  },
  eventTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
  },
  eventDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  salesContainer: {
    marginBottom: 12,
  },
  salesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  salesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  remainingText: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  revenueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  revenueLabel: {
    fontSize: 12,
    color: '#666',
  },
  revenueAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#4a90e2',
  },
  statsButton: {
    backgroundColor: '#8b5cf6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f3f4f6',
  },
  createModalButton: {
    backgroundColor: '#000',
  },
  cancelModalButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  createModalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
