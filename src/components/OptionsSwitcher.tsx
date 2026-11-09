import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { transition } from '../theme/motion';
import { HeaderOption, useDesignOptions } from '../state/designOptions';
import { pointer } from '../theme/cursor';

const HEADER_OPTIONS: { key: HeaderOption; label: string }[] = [
  { key: 'a', label: 'A' },
  { key: 'b', label: 'B' },
];

/** Review-only control for flipping between design variants. Not part of the product UI. */
export function OptionsSwitcher() {
  const { scrolledHeader, setScrolledHeader } = useDesignOptions();
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={styles.pill}>
        <Text style={styles.label}>Scrolled header</Text>
        {HEADER_OPTIONS.map(({ key, label }) => {
          const active = key === scrolledHeader;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setScrolledHeader(key)}
              style={[styles.option, active && styles.optionActive]}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 12, alignItems: 'center', zIndex: 40 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    paddingLeft: 12,
    borderRadius: 999,
    backgroundColor: colors.slate900,
    boxShadow: '0px 4px 16px rgba(0,0,0,0.18)',
  },
  label: { fontFamily: fonts.geistMedium, fontSize: 11, color: colors.slate300, marginRight: 4 },
  option: {
    width: 26,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    ...pointer,
    ...transition(['background-color']),
  },
  optionActive: { backgroundColor: colors.white },
  optionText: { fontFamily: fonts.geistMedium, fontSize: 11, color: colors.slate300 },
  optionTextActive: { color: colors.slate900 },
});
