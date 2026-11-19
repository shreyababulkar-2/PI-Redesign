import { Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { vdr } from '../../assets/vdr';
import { colors } from '../../theme';
import { transition } from '../../theme/motion';
import { useHover } from '../../hooks/useHover';
import { TypingDots } from './TypingDots';
import { pointer } from '../../theme/cursor';

/**
 * Floating button shown while the latest answer is below the visible area. While the answer is still being written it
 * shows the animated dots ("still writing") and turns into a down arrow on hover; once the answer is finished it is a
 * down arrow. Either way it scrolls to the latest text.
 */
export function JumpToLatest({ onPress, generating = true }: { onPress: () => void; generating?: boolean }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Scroll to latest"
      onPress={onPress}
      {...hover.handlers}
      style={[styles.button, hover.hovered && styles.hovered]}
    >
      {hover.hovered || !generating ? (
        <Image source={vdr.jumpDown} contentFit="fill" style={{ width: 16, height: 16 }} />
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
