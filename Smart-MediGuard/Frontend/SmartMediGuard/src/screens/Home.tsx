import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AIChatbot } from '../components/AIChatbot';
import { BottomNav } from '../components/BottomNav';
import { Logo } from '../components/Logo';
import { MedicationCard } from '../components/MedicationCard';
import { getMedications } from '../services/medicationService';

export default function Home() {
  const router = useRouter();
  const [medications, setMedications] = useState([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const name   = await AsyncStorage.getItem('userName');
      setUserName(name ?? 'User');
      if (userId) {
        const meds = await getMedications(parseInt(userId));
        setMedications(meds);
      }
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const toCardStatus = (med: any) => {
    if (med.dose_status === 'taken')  return 'taken';
    if (med.dose_status === 'pending') return 'upcoming';
    return 'pending';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Logo size="medium" showText />
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="settings-outline" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>{getGreeting()}, {userName}! 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            You have {medications.length} medication{medications.length !== 1 ? 's' : ''} scheduled today
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Today's Schedule</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2D8659" style={{ marginTop: 32 }} />
        ) : medications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No medications yet. Tap + to add one.</Text>
          </View>
        ) : (
          medications.map((med: any) => (
            <MedicationCard
              key={med.id}
              name={`${med.name}${med.dosage ? ' ' + med.dosage : ''}`}
              time={med.time_slots?.[0] ?? ''}
              status={toCardStatus(med)}
            />
          ))
        )}
      </ScrollView>

      <BottomNav currentScreen="home" />
      <AIChatbot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: '#2D8659',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 20,
  },
  settingsButton: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeTitle: { fontSize: 22, fontWeight: '600', color: '#111827', marginBottom: 6 },
  welcomeSubtitle: { fontSize: 16, color: '#6B7280' },
  sectionTitle: { fontSize: 22, fontWeight: '600', color: '#111827', marginBottom: 12, paddingHorizontal: 4 },
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
  emptyText: { fontSize: 16, color: '#9CA3AF', textAlign: 'center' },
});
