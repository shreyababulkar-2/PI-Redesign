import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, type } from '../../theme';
import { useHover } from '../../hooks/useHover';

type Props = { label: string; active: boolean };

/**
 * Header tab. Active: dew gradient pill with a pine dot. Inactive: plain label that gets a
 * slate-100 fill on hover.
 */
export function NoteTab({ label, active }: Props) {
  const { hovered, handlers } = useHover();

  if (active) {
    return (
      <View accessibilityRole="tab" accessibilityState={{ selected: true }} style={[styles.tab, styles.active]}>
        <View style={styles.dot} />
        <Text style={[type.noteTabActive, { color: colors.pine800 }]}>{label}</Text>
      </View>
    );
  }
  return (
    <Pressable accessibilityRole="tab" {...handlers} style={[styles.tab, styles.inactive, hovered && styles.hover]}>
      <Text style={[type.noteTab, { color: colors.slate500 }]}>{label}</Text>
    </Pressable>
  );
}

/** Left-to-right dew fade; native falls back to the solid start colour. */
const activeFill = (Platform.OS === 'web'
  ? { backgroundImage: `linear-gradient(90deg, ${colors.dew100}, ${colors.dew75})` }
  : null) as ViewStyle | null;

const styles = StyleSheet.create({
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  active: { gap: 6, borderRadius: 8, backgroundColor: colors.dew100, ...activeFill },
  inactive: { borderRadius: 4 },
  hover: { backgroundColor: colors.slate100 },
  dot: { width: 4, height: 4, borderRadius: 100, backgroundColor: colors.pine900 },
});
