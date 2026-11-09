import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { FloatingHeader } from './FloatingHeader';
import { HeaderOption } from '../../state/designOptions';

type Props = {
  /** 0 = hidden, 1 = fully shown. Driven by scroll position (see useSectionNavigation). */
  progress: Animated.Value;
  /** True once the floating header is far enough in to take clicks. */
  active: boolean;
  variant: HeaderOption;
  activeTab: number;
  activeSectionTitle: string;
};

/**
 * The floating header overlay. The default header scrolls away with the content; once it has mostly
 * left the viewport this fades and eases in from just above, tied to the scroll offset so it feels
 * like a consequence of scrolling rather than an animation that plays on a trigger.
 */
export function FloatingHeaderLayer({ progress, active, variant, activeTab, activeSectionTitle }: Props) {
  // Not mounted while invisible: `pointerEvents` doesn't stop nested buttons from taking hover/clicks on web.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = progress.addListener(({ value }) => setMounted((prev) => (prev === value > 0 ? prev : value > 0)));
    return () => progress.removeListener(id);
  }, [progress]);

  if (!mounted) return null;

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });
  return (
    <Animated.View
      pointerEvents={active ? 'box-none' : 'none'}
      style={[styles.overlay, { opacity: progress, transform: [{ translateY }] }]}
    >
      <FloatingHeader variant={variant} activeTab={activeTab} activeSectionTitle={activeSectionTitle} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
});
