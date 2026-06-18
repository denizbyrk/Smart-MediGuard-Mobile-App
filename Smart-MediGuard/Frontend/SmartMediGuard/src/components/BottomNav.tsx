import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type NavItem = {
  key: string;
  label: string;
  icon: string;
  activeIcon: string;
  color: string;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home',   label: 'Home',    icon: 'home-outline',        activeIcon: 'home',        color: '#2D8659', route: '/home'          },
  { key: 'meds',   label: 'Meds',    icon: 'medkit-outline',      activeIcon: 'medkit',      color: '#4A90E2', route: '/medications'   },
  { key: 'stats',  label: 'Stats',   icon: 'bar-chart-outline',   activeIcon: 'bar-chart',   color: '#F59E0B', route: '/stats'         },
  { key: 'profile',label: 'Profile', icon: 'person-outline',      activeIcon: 'person',      color: '#9C27B0', route: '/profile'       },
];

type Props = { currentScreen: string };

export function BottomNav({ currentScreen }: Props) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const isActive = currentScreen === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            {/* Active top bar */}
            {isActive && (
              <View style={[styles.activeBar, { backgroundColor: item.color }]} />
            )}

            <Ionicons
              name={(isActive ? item.activeIcon : item.icon) as any}
              size={28}
              color={isActive ? item.color : '#9CA3AF'}
            />
            <Text style={[styles.label, isActive && { color: item.color, fontWeight: '600' }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingBottom: 24,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    gap: 4,
    position: 'relative',
  },
  activeBar: {
    position: 'absolute',
    top: -8,
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
