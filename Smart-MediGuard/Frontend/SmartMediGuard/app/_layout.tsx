import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { requestNotificationPermissions } from '../src/services/notificationService';
import { syncWithServer } from '../src/services/syncService';

// Expo Go'da expo-notifications remote push kaldırıldı (SDK 53+)
const IS_EXPO_GO = Constants.appOwnership === 'expo';

export default function RootLayout() {
  const router = useRouter();
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (!IS_EXPO_GO) {

      requestNotificationPermissions().catch(() => {});

      const Notifications = require('expo-notifications');
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response: any) => {
          const data = response.notification.request.content.data;
          if (data?.medicationId) {
            router.push({
              pathname: '/reminder',
              params: {
                medicationId: String(data.medicationId),
                medName:      data.medName  ?? '',
                dosage:       data.dosage   ?? '',
              },
            } as any);
          }
        }
      );
    }

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        syncWithServer().catch(() => {});
      }
    });

    syncWithServer().catch(() => {});

    return () => {
      responseListener.current?.remove();
      appStateSub.remove();
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
