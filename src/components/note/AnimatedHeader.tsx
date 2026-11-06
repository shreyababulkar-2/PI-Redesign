import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { NoteHeader } from './NoteHeader';
import { FloatingHeader } from './FloatingHeader';

type Props = {
  /** 0 = default header, 1 = floating header (see useHeaderProgress). */
  progress: Animated.Value;
  scrolled: boolean;
  activeTab: number;
  activeSectionTitle: string;
};

/**
 * Overlays the header on top of the full-height scroll area. It never takes part in layout, so
 * switching between the default and floating forms cannot shift the content: the two forms
 * simply cross-fade, with the floating one easing down into place.
 */
export function AnimatedHeader({ progress, scrolled, activeTab, activeSectionTitle }: Props) {
  // Unmount whichever form is fully faded out: `pointerEvents` on the layer doesn't stop nested
  // buttons from receiving hover/clicks on web, so an invisible header must not stay mounted.
  const [mounted, setMounted] = useState({ full: true, floating: false });
  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      const next = { full: value < 1, floating: value > 0 };
      setMounted((prev) => (prev.full === next.full && prev.floating === next.floating ? prev : next));
    });
    return () => progress.removeListener(id);
  }, [progress]);

  const fullOpacity = progress.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' });
  const floatingOpacity = progress.interpolate({ inputRange: [0.3, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const floatingShift = progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] });

  return (
    <Animated.View pointerEvents="box-none" style={styles.overlay}>
      {mounted.full && (
        <Animated.View pointerEvents={scrolled ? 'none' : 'auto'} style={[styles.layer, { opacity: fullOpacity }]}>
          <NoteHeader activeTab={activeTab} />
        </Animated.View>
      )}
      {mounted.floating && (
        <Animated.View
          pointerEvents={scrolled ? 'box-none' : 'none'}
          style={[styles.layer, { opacity: floatingOpacity, transform: [{ translateY: floatingShift }] }]}
        >
          <FloatingHeader activeTab={activeTab} activeSectionTitle={activeSectionTitle} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
  layer: { position: 'absolute', top: 0, left: 0, right: 0 },
});
