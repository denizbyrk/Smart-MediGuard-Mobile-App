import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AIChatbot } from '../components/AIChatbot';
import { BottomNav } from '../components/BottomNav';
import { getOverallAdherence } from '../services/doseService';

const LEGEND = [
  { color: '#2D8659', label: 'Excellent (95%+)' },
  { color: '#52C197', label: 'Good (85-94%)' },
  { color: '#FFC107', label: 'Fair (75-84%)' },
];

function barColor(value: number) {
  if (value >= 95) return '#2D8659';
  if (value >= 85) return '#52C197';
  if (value >= 75) return '#FFC107';
  return '#EF5350';
}

const BAR_MAX_HEIGHT = 160;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Statistics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adherence, setAdherence] = useState(0);
  const [totalDoses, setTotalDoses] = useState(0);
  const [takenDoses, setTakenDoses] = useState(0);
  const [missedDoses, setMissedDoses] = useState(0);
  const [weeklyData, setWeeklyData] = useState(DAY_LABELS.map((day) => ({ day, value: 0 })));

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const uid = parseInt(userId ?? '1');

      const monthly = await getOverallAdherence(uid, 30);
      setAdherence(monthly.rate);
      setTotalDoses(monthly.total);
      setTakenDoses(monthly.taken);
      setMissedDoses(monthly.missed);

      const weekly = await Promise.all(
        Array.from({ length: 7 }, (_, i) => getOverallAdherence(uid, i + 1))
      );
      const perDay = weeklyData.map((d, i) => {
        const curr = weekly[i];
        const prev = i > 0 ? weekly[i - 1] : { total: 0, taken: 0 };
        const dayTotal = curr.total - prev.total;
        const dayTaken = curr.taken - prev.taken;
        return { day: d.day, value: dayTotal > 0 ? Math.round((dayTaken / dayTotal) * 100) : 0 };
      });
      setWeeklyData(perDay);
    } catch {
      // leave defaults
    } finally {
      setLoading(false);
    }
  };

  const onTimeRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/home' as any)}>
          <Ionicons name="arrow-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistics</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2D8659" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { borderColor: '#2D8659' }]}>
              <Ionicons name="trending-up" size={26} color="#2D8659" />
              <Text style={[styles.summaryValue, { color: '#2D8659' }]}>{adherence}%</Text>
              <Text style={styles.summaryLabel}>Adherence</Text>
            </View>
            <View style={[styles.summaryCard, { borderColor: '#4CAF50' }]}>
              <Ionicons name="time-outline" size={26} color="#4CAF50" />
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{onTimeRate}%</Text>
              <Text style={styles.summaryLabel}>On Time</Text>
            </View>
            <View style={[styles.summaryCard, { borderColor: '#FFC107' }]}>
              <Ionicons name="warning-outline" size={26} color="#FFC107" />
              <Text style={[styles.summaryValue, { color: '#FFC107' }]}>{missedDoses}</Text>
              <Text style={styles.summaryLabel}>Missed</Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>This Week</Text>

            <View style={styles.chartArea}>
              <View style={styles.yAxis}>
                {[100, 75, 50, 25, 0].map((v) => (
                  <Text key={v} style={styles.yLabel}>{v}</Text>
                ))}
              </View>

              <View style={styles.barGroup}>
                {weeklyData.map((item) => (
                  <View key={item.day} style={styles.barColumn}>
                    <Text style={styles.barValueLabel}>{item.value > 0 ? `${item.value}%` : ''}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: (item.value / 100) * BAR_MAX_HEIGHT,
                            backgroundColor: barColor(item.value),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barDayLabel}>{item.day}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.legendContainer}>
              {LEGEND.map((l) => (
                <View key={l.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                  <Text style={styles.legendText}>{l.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.monthlyCard}>
            <Text style={styles.cardTitle}>Monthly Overview</Text>
            {[
              { label: 'Total Doses',  value: String(totalDoses),  color: '#111827' },
              { label: 'Doses Taken',  value: String(takenDoses),  color: '#4CAF50' },
              { label: 'Doses Missed', value: String(missedDoses), color: '#FFC107' },
              { label: 'Adherence Rate', value: `${adherence}%`,   color: '#2D8659' },
            ].map((row, idx, arr) => (
              <View
                key={row.label}
                style={[styles.monthlyRow, idx < arr.length - 1 && styles.monthlyBorder]}
              >
                <Text style={styles.monthlyLabel}>{row.label}</Text>
                <Text style={[styles.monthlyValue, { color: row.color }]}>{row.value}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <BottomNav currentScreen="stats" />
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
    paddingHorizontal: 8,
    paddingTop: 52,
    paddingBottom: 20,
  },
  backButton: {
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
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 16,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    gap: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_MAX_HEIGHT + 40,
    marginBottom: 16,
  },
  yAxis: {
    justifyContent: 'space-between',
    height: BAR_MAX_HEIGHT,
    marginRight: 6,
    paddingBottom: 2,
  },
  yLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    width: 24,
  },
  barGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_MAX_HEIGHT + 40,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValueLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  barTrack: {
    width: '70%',
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  barDayLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },

  monthlyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  monthlyBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  monthlyLabel: {
    fontSize: 17,
    color: '#374151',
  },
  monthlyValue: {
    fontSize: 18,
    fontWeight: '600',
  },
});
