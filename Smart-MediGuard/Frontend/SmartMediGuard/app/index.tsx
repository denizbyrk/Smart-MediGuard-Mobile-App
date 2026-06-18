import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { initDatabase } from '../src/database/db';
import { isLoggedIn } from '../src/services/authService';
import { createTodaysDoseRecords, getMedications } from '../src/services/medicationService';
import { rescheduleAllNotifications } from '../src/services/notificationService';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initDatabase();
        const loggedIn = await isLoggedIn();
        if (loggedIn) {
          const userId = await AsyncStorage.getItem('userId');
          if (userId) {
            const uid = parseInt(userId);
            createTodaysDoseRecords(uid).catch(() => {});

            getMedications(uid).then(meds => rescheduleAllNotifications(meds)).catch(() => {});
          }
          router.replace('/home' as any);
        } else {
          router.replace('/login' as any);
        }
      } catch {
        router.replace('/login' as any);
      }
    };
    bootstrap();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>💊</Text>
      <Text style={styles.title}>SmartMediGuard</Text>
      <ActivityIndicator size="large" color="#2D8659" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    gap: 8,
  },
  logo: {
    fontSize: 64,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2D8659',
  },
  spinner: {
    marginTop: 32,
  },
});