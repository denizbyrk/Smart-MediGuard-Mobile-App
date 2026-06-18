import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AIChatbot } from '../components/AIChatbot';
import { getDb, initDatabase } from '../database/db';
import { createDoseRecord, markAsTaken } from '../services/doseService';
import { decreaseStock } from '../services/medicationService';
import { scheduleSnoozeNotification } from '../services/notificationService';

const SNOOZE_OPTIONS = [
  { label: '15 dakika', minutes: 15 },
  { label: '30 dakika', minutes: 30 },
  { label: '1 saat',   minutes: 60 },
];

export default function ReminderNotification() {
  const router = useRouter();
  const { medicationId, medName, dosage } = useLocalSearchParams<{
    medicationId: string;
    medName: string;
    dosage: string;
  }>();

  const [showSnooze, setShowSnooze] = useState(false);
  const [loading, setLoading] = useState(false);

  const medIdNum = medicationId ? parseInt(medicationId) : null;

  const handleTaken = async () => {
    if (!medIdNum) {
      router.push('/home' as any);
      return;
    }
    setLoading(true);
    try {
      await initDatabase();
      const db = await getDb();
      // Bugünkü bekleyen doz kaydını bul
      const dose = await db.getFirstAsync(
        `SELECT id FROM dose_history
         WHERE medication_id = ? AND date(scheduled_time) = date('now') AND status = 'pending'
         ORDER BY scheduled_time ASC LIMIT 1;`,
        [medIdNum]
      ) as any;

      if (dose?.id) {
        await markAsTaken(dose.id);
      } else {
        // Kayıt yoksa yeni oluştur ve hemen taken yap
        const newId = await createDoseRecord(medIdNum, new Date().toISOString());
        await markAsTaken(newId);
      }

      await decreaseStock(medIdNum);
    } catch {
      Alert.alert('Hata', 'Kayıt oluşturulamadı.');
    } finally {
      setLoading(false);
      router.push('/home' as any);
    }
  };

  const handleSnooze = async (minutes: number) => {
    if (medIdNum) {
      await scheduleSnoozeNotification(
        { id: medIdNum, name: medName ?? 'İlaç', dosage: dosage ?? '' },
        minutes
      ).catch(() => {});
    }
    router.push('/home' as any);
  };

  const displayName = [medName, dosage].filter(Boolean).join(' ') || 'İlaç';
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pillEmoji}>💊</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>İlaç alma zamanı!</Text>
          <View style={styles.medInfo}>
            <Text style={styles.medName}>{displayName}</Text>
            <Text style={styles.medTime}>{now}</Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.takenButton, loading && styles.disabled]}
            onPress={handleTaken}
            disabled={loading}
          >
            <Ionicons name="checkmark" size={30} color="#fff" style={styles.btnIcon} />
            <Text style={styles.takenButtonText}>✓ Aldım</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.snoozeButton}
            onPress={() => setShowSnooze((v) => !v)}
          >
            <Ionicons name="time-outline" size={30} color="#fff" style={styles.btnIcon} />
            <Text style={styles.snoozeButtonText}>⏰ Ertele</Text>
          </TouchableOpacity>
        </View>

        {showSnooze && (
          <View style={styles.snoozeCard}>
            <Text style={styles.snoozeTitle}>Ne kadar erteleyelim?</Text>
            {SNOOZE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={styles.snoozeOption}
                onPress={() => handleSnooze(opt.minutes)}
              >
                <Text style={styles.snoozeOptionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <AIChatbot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pillEmoji: { fontSize: 80, marginBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  medInfo: { alignItems: 'center' },
  medName: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 8 },
  medTime: { fontSize: 22, color: '#2D8659', fontWeight: '600' },
  buttonGroup: { width: '100%', gap: 12, marginBottom: 16 },
  takenButton: {
    backgroundColor: '#2D8659',
    borderRadius: 14,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D8659',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  snoozeButton: {
    backgroundColor: '#FFC107',
    borderRadius: 14,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: { opacity: 0.6 },
  btnIcon: { marginRight: 10 },
  takenButtonText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  snoozeButtonText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  snoozeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  snoozeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  snoozeOption: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  snoozeOptionText: { fontSize: 17, color: '#374151' },
});
