import Constants from 'expo-constants';
import { Platform } from 'react-native';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

const getNotif = () => {
  if (IS_EXPO_GO) return null;

  return require('expo-notifications');
};

if (!IS_EXPO_GO) {
  getNotif()?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export const requestNotificationPermissions = async () => {
  const Notifications = getNotif();
  if (!Notifications) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medications', {
      name: 'Medication Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

const nextOccurrence = (hour, minute) => {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
};

export const scheduleMedicationNotifications = async (med) => {
  const Notifications = getNotif();
  if (!Notifications) return [];

  const { SchedulableTriggerInputTypes } = Notifications;

  const timeSlots = Array.isArray(med.time_slots)
    ? med.time_slots
    : JSON.parse(med.time_slots || '[]');

  const scheduled = [];
  for (const slot of timeSlots) {
    const [hourStr, minuteStr] = String(slot).split(':');
    const hour   = parseInt(hourStr);
    const minute = parseInt(minuteStr || '0');
    if (isNaN(hour) || isNaN(minute)) continue;

    try {
      const fireDate = nextOccurrence(hour, minute);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'İlaç Zamanı 💊',
          body: `${med.name}${med.dosage ? ' ' + med.dosage : ''} alma zamanın geldi`,
          data: { medicationId: med.id, medName: med.name, dosage: med.dosage || '' },
          sound: 'default',
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: fireDate,
          ...(Platform.OS === 'android' ? { channelId: 'medications' } : {}),
        },
      });
      scheduled.push(id);
    } catch (e) {
      console.warn('Notification failed to schedule:', e?.message);
    }
  }

  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const stored = JSON.parse((await AsyncStorage.getItem('_notifIds')) || '{}');
  stored[String(med.id)] = scheduled;
  await AsyncStorage.setItem('_notifIds', JSON.stringify(stored));
  return scheduled;
};

export const cancelMedicationNotifications = async (medicationId) => {
  const Notifications = getNotif();
  if (!Notifications) return;

  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const stored = JSON.parse((await AsyncStorage.getItem('_notifIds')) || '{}');
  const ids = stored[String(medicationId)] || [];
  for (const id of ids) {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
  }
  delete stored[String(medicationId)];
  await AsyncStorage.setItem('_notifIds', JSON.stringify(stored));
};

export const scheduleSnoozeNotification = async (med, minutes) => {
  const Notifications = getNotif();
  if (!Notifications) return;

  const { SchedulableTriggerInputTypes } = Notifications;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'İlaç Hatırlatması 💊',
        body: `${med.name}${med.dosage ? ' ' + med.dosage : ''} — ertelenen hatırlatma`,
        data: { medicationId: med.id, medName: med.name, dosage: med.dosage || '' },
        sound: 'default',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + minutes * 60 * 1000),
        ...(Platform.OS === 'android' ? { channelId: 'medications' } : {}),
      },
    });
  } catch (e) {
    console.warn('Postpone notification failed to reschedule: ', e?.message);
  }
};

export const rescheduleAllNotifications = async (medications) => {
  const Notifications = getNotif();
  if (!Notifications) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.removeItem('_notifIds');
  for (const med of medications) {
    await scheduleMedicationNotifications(med);
  }
};
