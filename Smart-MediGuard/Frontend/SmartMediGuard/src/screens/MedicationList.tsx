import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AIChatbot } from '../components/AIChatbot';
import { BottomNav } from '../components/BottomNav';
import { deleteMedication, getMedications } from '../services/medicationService';
import { cancelMedicationNotifications } from '../services/notificationService';

type StockStatus = 'green' | 'yellow' | 'red';

const STATUS_COLOR: Record<StockStatus, string> = {
  green:  '#4CAF50',
  yellow: '#FFC107',
  red:    '#EF5350',
};

const getStatus = (med: any): { status: StockStatus; label: string } => {
  if (med.stock_count <= 1)  return { status: 'red',    label: 'Refill needed' };
  if (med.stock_count <= 3)  return { status: 'red',    label: 'Refill needed' };
  if (med.stock_count <= 7)  return { status: 'yellow', label: 'Low stock' };
  return                            { status: 'green',  label: 'Good stock' };
};

export default function MedicationList() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const meds = await getMedications(parseInt(userId ?? '1'));
      setMedications(meds);
    } catch (e) {
      Alert.alert('Error', 'Could not load medications.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert('Delete', 'Delete this medication?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteMedication(id);
        await cancelMedicationNotifications(id).catch(() => {});
        loadMedications();
      }},
    ]);
  };

  const filtered = medications.filter((med: any) =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (med.dosage ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (med.frequency ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item: med }: { item: any }) => {
    const timeSlot = med.time_slots?.[0] ?? '';
    const hour = timeSlot ? parseInt(timeSlot.split(':')[0]) : -1;
    const isEvening = hour >= 17 || hour < 0;
    const { status, label } = getStatus(med);
    return (
      <View style={styles.card}>
        <View style={[styles.timeIcon, isEvening ? styles.eveningBg : styles.morningBg]}>
          <Ionicons
            name={isEvening ? 'moon-outline' : 'sunny-outline'}
            size={26}
            color={isEvening ? '#4A5568' : '#FFC107'}
          />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{med.name}{med.dosage ? ' ' + med.dosage : ''}</Text>
          <Text style={styles.cardFreq}>{med.frequency ?? ''}{timeSlot ? ' · ' + timeSlot : ''}</Text>
          <View style={styles.stockRow}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[status] }]} />
            <Text style={[styles.stockText, { color: STATUS_COLOR[status] }]}>
              {med.stock_count} pills · {label}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.menuButton} onPress={() => handleDelete(med.id)}>
          <Ionicons name="ellipsis-vertical" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/home' as any)}>
          <Ionicons name="arrow-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Medications</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/add-medication' as any)}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={22} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medications..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2D8659" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No medications found</Text>
            </View>
          }
        />
      )}

      <BottomNav currentScreen="meds" />
      <AIChatbot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#2D8659',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 52,
    paddingBottom: 20,
  },
  headerButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  morningBg: { backgroundColor: '#FEF9C3' },
  eveningBg: { backgroundColor: '#E0E7FF' },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  cardFreq: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 6,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyText: {
    fontSize: 17,
    color: '#9CA3AF',
  },
});
