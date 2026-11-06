import { Pressable, StyleSheet } from 'react-native';
import { IconName } from '../../assets/icons';
import { colors } from '../../theme';
import { transition } from '../../theme/motion';
import { useHover } from '../../hooks/useHover';
import { Icon } from '../Icon';
import { pointer } from '../../theme/cursor';

type Props = {
  icon: IconName;
  hoverIcon: IconName;
  label: string;
  /** Rendered icon size; the hover icon is the same glyph in green. */
  size?: number;
};

/** Per-card action (Figma "Actions icons"): transparent by default; white chip + green icon on hover. */
export function ActionButton({ icon, hoverIcon, label, size = 18 }: Props) {
  const { hovered, handlers } = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...handlers}
      style={[styles.button, hovered && styles.hovered]}
    >
      <Icon name={hovered ? hoverIcon : icon} size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 28, height: 28, borderRadius: 4, alignItems: 'center', justifyContent: 'center', ...pointer, ...transition(['background-color']) },
  hovered: { backgroundColor: colors.white },
});
