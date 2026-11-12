import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { IconName } from '../../assets/icons';
import { colors } from '../../theme';
import { press, transition } from '../../theme/motion';
import { useHover } from '../../hooks/useHover';
import { Icon } from '../Icon';
import { pointer } from '../../theme/cursor';

type Props = {
  icon: IconName;
  hoverIcon: IconName;
  label: string;
  /** Rendered icon size; the hover icon is the same glyph in green. */
  size?: number;
  /** Menu open: white chip with a hairline border, as in Figma 448:40417. */
  active?: boolean;
  /** Shows a check mark in place of the icon (e.g. after copying). */
  done?: boolean;
  onPress?: () => void;
};

/** Per-card action (Figma "Actions icons"): transparent by default; white chip + green icon on hover. */
export function ActionButton({ icon, hoverIcon, label, size = 18, active, done = false, onPress }: Props) {
  const { hovered, handlers } = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active !== undefined ? { expanded: active } : undefined}
      onPress={onPress}
      {...handlers}
      style={({ pressed }) => [styles.button, hovered && styles.hovered, !!active && styles.active, press(pressed)]}
    >
      {/* Icon and check cross-fade with a small scale and blur (0.25 to 1, 4px to 0) instead of swapping. */}
      <View style={[styles.swap, swapStyle(!done)]}>
        <Icon name={hovered || active ? hoverIcon : icon} size={size} />
      </View>
      <View pointerEvents="none" style={[styles.swap, styles.check, swapStyle(done)]}>
        <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
          <Path d="M4 9.5l3.2 3.2L14 5.6" stroke={colors.pine700} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </Pressable>
  );
}

/** Visible: full size and sharp. Hidden: shrunk to a quarter, transparent and blurred. */
const swapStyle = (visible: boolean) =>
  ({
    opacity: visible ? 1 : 0,
    transform: [{ scale: visible ? 1 : 0.25 }],
    filter: visible ? 'blur(0px)' : 'blur(4px)',
    ...transition(['opacity', 'transform', 'filter'], 200),
  }) as ViewStyle;

const styles = StyleSheet.create({
  swap: { alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute' },
  button: { width: 28, height: 28, borderRadius: 4, alignItems: 'center', justifyContent: 'center', ...pointer, ...transition(['background-color']) },
  hovered: { backgroundColor: colors.white },
  active: { backgroundColor: colors.white, borderRadius: 8, borderWidth: 1, borderColor: '#e1e4ea' },
});
