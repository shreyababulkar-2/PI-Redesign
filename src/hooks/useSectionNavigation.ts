import { useCallback, useEffect, useRef, useState } from 'react';
import { HEADER_COLLAPSED_HEIGHT } from '../theme/layout';
import { Animated, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollViewInstance } from 'react-native';

/** A section becomes active once its top crosses this fraction of the viewport height (from the top). */
const ACTIVE_LINE = 0.25;
/**
 * The default header scrolls with the content and is fully gone at this offset (8 top gap + 80 card).
 * The floating header is tied to the scroll position: it begins to appear as the default header is
 * about to leave (FLOAT_START) and is fully in once it has left (FLOAT_END).
 */
const FLOAT_START = 48;
const FLOAT_END = 88;
/** Sections land just below the floating header, not underneath it. */
const TOP_INSET = HEADER_COLLAPSED_HEIGHT;
/** Scroll events closer together than this (ms) belong to the same programmatic smooth scroll. */
const SCROLL_SETTLE_MS = 160;

/**
 * Tracks section positions inside a ScrollView, exposes smooth scroll-to-section
 * and keeps `activeId` in sync with the section currently in view.
 */
export function useSectionNavigation(ids: readonly string[]) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const offsets = useRef<Record<string, number>>({});
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const programmatic = useRef(false);
  const [headerProgress] = useState(() => new Animated.Value(0));
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeId, setActiveId] = useState(ids[0]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  const resolveActive = useCallback(
    (scrollY: number) => {
      const atBottom = scrollY > 0 && contentHeight.current > 0 && scrollY + viewportHeight.current >= contentHeight.current - 2;
      let current = ids[0];
      if (atBottom) {
        current = ids[ids.length - 1];
      } else {
        for (const id of ids) {
          const top = offsets.current[id];
          if (top !== undefined && top - TOP_INSET <= scrollY + viewportHeight.current * ACTIVE_LINE) current = id;
        }
      }
      setActiveId(current);
    },
    [ids],
  );

  const armSettleTimer = useCallback(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      programmatic.current = false;
    }, SCROLL_SETTLE_MS);
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      headerProgress.setValue(Math.min(1, Math.max(0, (y - FLOAT_START) / (FLOAT_END - FLOAT_START))));
      setScrolled(y > (FLOAT_START + FLOAT_END) / 2);
      // While a click-initiated smooth scroll is running, keep the clicked item active.
      if (programmatic.current) {
        armSettleTimer();
        return;
      }
      resolveActive(e.nativeEvent.contentOffset.y);
    },
    [armSettleTimer, resolveActive, headerProgress],
  );

  const scrollToSection = useCallback(
    (id: string) => {
      const y = offsets.current[id];
      if (y === undefined) return;
      programmatic.current = true;
      setActiveId(id);
      armSettleTimer();
      scrollRef.current?.scrollTo({ y: Math.max(0, y - TOP_INSET), animated: true });
    },
    [armSettleTimer],
  );

  const scrollToTop = useCallback(() => {
    programmatic.current = true;
    setActiveId(ids[0]);
    armSettleTimer();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [armSettleTimer, ids]);

  const onSectionLayout = useCallback(
    (id: string) => (e: LayoutChangeEvent) => {
      offsets.current[id] = e.nativeEvent.layout.y;
    },
    [],
  );

  const onViewportLayout = useCallback((e: LayoutChangeEvent) => {
    viewportHeight.current = e.nativeEvent.layout.height;
  }, []);

  const onContentSizeChange = useCallback((_w: number, h: number) => {
    contentHeight.current = h;
  }, []);

  return { scrollRef, activeId, scrolled, headerProgress, onScroll, scrollToSection, scrollToTop, onSectionLayout, onViewportLayout, onContentSizeChange };
}
