import { Image, StyleSheet, Text, View } from 'react-native';

type Props = {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
};

const SIZE_MAP = {
  small:  { img: 32,  fontSize: 14 },
  medium: { img: 48,  fontSize: 18 },
  large:  { img: 64,  fontSize: 24 },
};

export function Logo({ size = 'medium', showText = true }: Props) {
  const s = SIZE_MAP[size];

  return (
    <View style={styles.row}>
      <View style={[styles.circle, { width: s.img, height: s.img, borderRadius: s.img / 2 }]}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={{ width: s.img, height: s.img, borderRadius: s.img / 2 }}
          resizeMode="cover"
        />
      </View>
      {showText && (
        <View style={styles.textBlock}>
          <Text style={[styles.textLine, { fontSize: s.fontSize }]}>Smart</Text>
          <Text style={[styles.textLine, { fontSize: s.fontSize }]}>MediGuard</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circle: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  textBlock: {
    justifyContent: 'center',
  },
  textLine: {
    color: '#fff',
    fontWeight: '600',
    lineHeight: 22,
  },
});
