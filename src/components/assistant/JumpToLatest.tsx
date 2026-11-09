import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';
import { transition } from '../../theme/motion';
import { useHover } from '../../hooks/useHover';
import { TypingDots } from './TypingDots';
import { pointer } from '../../theme/cursor';

/**
 * Floating button shown while an answer is still being written below the visible area. It shows the
 * animated dots ("still writing") and turns into a down arrow on hover, which scrolls to the latest text.
 */
export function JumpToLatest({ onPress }: { onPress: () => void }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Scroll to latest"
      onPress={onPress}
      {...hover.handlers}
      style={[styles.button, hover.hovered && styles.hovered]}
    >
      {hover.hovered ? (
        <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
          <Path
            d="M8 3.5v9m0 0L4.5 9M8 12.5L11.5 9"
            stroke={colors.slate600}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : (
        <TypingDots />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // The same 28px round container the arrow used to sit in.
  button: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    boxShadow: '0px 1px 2px rgba(15,23,41,0.06)',
    ...pointer,
    ...transition(['background-color']),
  },
  hovered: { backgroundColor: colors.slate50 },
});
