import { Pressable, StyleSheet } from 'react-native';
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
  onPress?: () => void;
};

/** Per-card action (Figma "Actions icons"): transparent by default; white chip + green icon on hover. */
export function ActionButton({ icon, hoverIcon, label, size = 18, active = false, onPress }: Props) {
  const { hovered, handlers } = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={onPress ? { expanded: active } : undefined}
      onPress={onPress}
      {...handlers}
      style={({ pressed }) => [styles.button, hovered && styles.hovered, active && styles.active, press(pressed)]}
    >
      <Icon name={hovered || active ? hoverIcon : icon} size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 28, height: 28, borderRadius: 4, alignItems: 'center', justifyContent: 'center', ...pointer, ...transition(['background-color']) },
  hovered: { backgroundColor: colors.white },
  active: { backgroundColor: colors.white, borderRadius: 8, borderWidth: 1, borderColor: '#e1e4ea' },
});
