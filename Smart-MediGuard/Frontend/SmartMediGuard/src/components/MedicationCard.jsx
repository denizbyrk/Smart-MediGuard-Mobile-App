import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const STATUS_CONFIG = {
  taken: {
    iconName: 'checkmark',
    iconBg:   '#2D8659',
    label:    'Taken',
    color:    '#4CAF50',
  },
  upcoming: {
    iconName: 'time-outline',
    iconBg:   '#FFC107',
    label:    'Upcoming',
    color:    '#FFC107',
  },
  pending: {
    iconName: 'ellipse-outline',
    iconBg:   '#9CA3AF',
    label:    'Pending',
    color:    '#9CA3AF',
  },
};

export function MedicationCard({ name, time, status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
        <Ionicons name={config.iconName} size={28} color="#fff" />
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>

      <Text style={[styles.status, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  time: {
    fontSize: 16,
    color: '#6B7280',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
});
