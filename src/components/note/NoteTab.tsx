import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, type } from '../../theme';
import { transition } from '../../theme/motion';
import { useHover } from '../../hooks/useHover';
import { pointer } from '../../theme/cursor';

type Props = { label: string; active: boolean; onPress?: () => void };

const EASE_MS = 220;

/**
 * Header tab. Active: dew gradient pill with a pine dot. Inactive: plain label that gets a slate-100 fill on
 * hover. Switching eases (the pill fades, the dot opens up, the label colour changes) rather than snapping, so
 * the row doesn't jump when the tab changes.
 */
export function NoteTab({ label, active, onPress }: Props) {
  const { hovered, handlers } = useHover();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      {...handlers}
      style={[styles.tab, !active && hovered && styles.hover, transition(['background-color'])]}
    >
      <View
        pointerEvents="none"
        style={[styles.pill, activeFill, { opacity: active ? 1 : 0 }, transition(['opacity'], EASE_MS)]}
      />
      <View
        style={[
          styles.dot,
          {
            width: active ? 4 : 0,
            marginRight: active ? 6 : 0,
            opacity: active ? 1 : 0,
            // Always travels left to right: it slides in from the left when a tab becomes active (keyframes below)
            // and leaves toward the right when it stops being active, whichever way you are switching.
            transform: [{ translateX: active ? 0 : 6 }],
          },
          transition(['width', 'margin-right', 'opacity', 'transform'], EASE_MS),
          active ? dotEnter : null,
        ]}
      />
      <Text
        style={[
          active ? type.noteTabActive : type.noteTab,
          { color: active ? colors.pine800 : colors.slate500 },
          transition(['color'], EASE_MS),
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Web: the dot's entrance (keyframes `pi-dot-in` are injected in App.tsx). */
const dotEnter = (Platform.OS === 'web'
  ? { animationName: 'pi-dot-in', animationDuration: `${EASE_MS}ms`, animationTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)', animationFillMode: 'backwards' }
  : null) as ViewStyle | null;

/** Left-to-right dew fade; native falls back to the solid start colour. */
const activeFill = (Platform.OS === 'web'
  ? { backgroundImage: `linear-gradient(90deg, ${colors.dew100}, ${colors.dew75})` }
  : { backgroundColor: colors.dew100 }) as ViewStyle;

const styles = StyleSheet.create({
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, ...pointer },
  pill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 8 },
  hover: { backgroundColor: colors.slate100 },
  dot: { height: 4, borderRadius: 100, backgroundColor: colors.pine900 },
});
