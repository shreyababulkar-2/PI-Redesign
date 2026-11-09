import { useEffect, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { HEADER_TOP } from '../../theme/layout';
import { Icon } from '../Icon';
import { NoteHeaderContent } from './NoteHeader';
import {
  FLOATING_ACTIONS_SIZE,
  FLOATING_GAP,
  FLOATING_NAV_HEIGHT,
  FLOATING_NAV_WIDTH,
  FLOATING_PADDING,
  FloatingBackdrop,
  FloatingNavContent,
  floatingShadows,
} from './FloatingHeader';

type Props = {
  /** 0 = default header, 1 = floating header (see useHeaderProgress). */
  progress: Animated.Value;
  scrolled: boolean;
  activeTab: number;
  activeSectionTitle: string;
};

const FULL_HEIGHT = 80;
const FULL_PADDING_X = 10;
const FULL_PADDING_Y = 8;
const FULL_ACTION_SIZE = 28;

/**
 * Overlays the header on top of the full-height scroll area (it never takes part in layout).
 *
 * The header is ONE white card that physically morphs: it narrows from the full column width to
 * the centred nav pill and shrinks from 80px to 36px tall, while its contents cross-fade inside
 * (clipped by the card, so they appear to be absorbed rather than swapped). The actions button
 * slides out of the card's right end into its own pill, and the backdrop fade + shadows ease in.
 */
export function AnimatedHeader({ progress, scrolled, activeTab, activeSectionTitle }: Props) {
  const [width, setWidth] = useState(804);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  // Unmount whichever content is fully faded out: `pointerEvents` doesn't stop nested buttons from
  // receiving hover/clicks on web, so invisible content must not stay mounted.
  const [mounted, setMounted] = useState({ full: true, floating: false });
  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      const next = { full: value < 0.5, floating: value > 0.2 };
      setMounted((prev) => (prev.full === next.full && prev.floating === next.floating ? prev : next));
    });
    return () => progress.removeListener(id);
  }, [progress]);

  const navLeft = (width - (FLOATING_NAV_WIDTH + FLOATING_GAP + FLOATING_ACTIONS_SIZE)) / 2;
  const range = [0, 1];
  const lerp = (from: number, to: number) => progress.interpolate({ inputRange: range, outputRange: [from, to] });

  const cardLeft = lerp(0, navLeft);
  const cardTop = lerp(HEADER_TOP, FLOATING_PADDING);
  const cardWidth = lerp(width, FLOATING_NAV_WIDTH);
  const cardHeight = lerp(FULL_HEIGHT, FLOATING_NAV_HEIGHT);

  const actionsLeft = lerp(width - FULL_PADDING_X - FULL_ACTION_SIZE, navLeft + FLOATING_NAV_WIDTH + FLOATING_GAP);
  const actionsTop = lerp(HEADER_TOP + FULL_PADDING_Y, FLOATING_PADDING);
  const actionsScale = lerp(FULL_ACTION_SIZE / FLOATING_ACTIONS_SIZE, 1);
  const actionsOpacity = progress.interpolate({ inputRange: [0, 0.35], outputRange: [0, 1], extrapolate: 'clamp' });

  const fullOpacity = progress.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0], extrapolate: 'clamp' });
  const navOpacity = progress.interpolate({ inputRange: [0.35, 0.7], outputRange: [0, 1], extrapolate: 'clamp' });
  const shadowOpacity = progress.interpolate({ inputRange: [0.4, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const backdropOpacity = progress.interpolate({ inputRange: [0.2, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View pointerEvents="box-none" style={styles.overlay} onLayout={onLayout}>
      <Animated.View pointerEvents="none" style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <FloatingBackdrop />
      </Animated.View>

      {/* Shadow sits outside the card (which clips its content) and shares its geometry. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shadow,
          floatingShadows.nav,
          { left: cardLeft, top: cardTop, width: cardWidth, height: cardHeight, opacity: shadowOpacity },
        ]}
      />

      {/* Morphing card */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.card, { left: cardLeft, top: cardTop, width: cardWidth, height: cardHeight }]}
      >
        {mounted.full && (
          <Animated.View
            pointerEvents={scrolled ? 'none' : 'auto'}
            style={[styles.fullContent, { width, opacity: fullOpacity }]}
          >
            <NoteHeaderContent activeTab={activeTab} />
          </Animated.View>
        )}
        {mounted.floating && (
          <Animated.View
            pointerEvents={scrolled ? 'auto' : 'none'}
            style={[styles.navContent, { width: FLOATING_NAV_WIDTH, opacity: navOpacity }]}
          >
            <FloatingNavContent activeTab={activeTab} activeSectionTitle={activeSectionTitle} />
          </Animated.View>
        )}
      </Animated.View>

      {/* Actions pill: emerges from the card's right end */}
      <Animated.View
        pointerEvents={scrolled ? 'auto' : 'none'}
        style={[
          styles.actions,
          floatingShadows.actions,
          { left: actionsLeft, top: actionsTop, opacity: actionsOpacity, transform: [{ scale: actionsScale }] },
        ]}
      >
        <Icon name="floatMore" size={28} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 64, zIndex: 20 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, height: 60 },
  card: { position: 'absolute', backgroundColor: colors.white, borderRadius: 8, overflow: 'hidden' },
  shadow: { position: 'absolute', borderRadius: 8 },
  fullContent: { position: 'absolute', top: 0, left: 0 },
  navContent: { position: 'absolute', top: 0, left: 0, height: FLOATING_NAV_HEIGHT },
  actions: {
    position: 'absolute',
    width: FLOATING_ACTIONS_SIZE,
    height: FLOATING_ACTIONS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
