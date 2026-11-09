import { useCallback, useEffect, useRef, useState } from 'react';
import { HEADER_COLLAPSED_HEIGHT } from '../theme/layout';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollViewInstance } from 'react-native';

/** A section becomes active once its top crosses this fraction of the viewport height (from the top). */
const ACTIVE_LINE = 0.25;
/** The page counts as "scrolled" (header collapses to its floating form) beyond this offset. */
const SCROLLED_THRESHOLD = 8;
/** When scrolling UP, the full header returns as soon as the offset gets this close to the top, so
 * it doesn't wait for a long smooth/momentum scroll to creep the last few pixels. */
const EXPAND_ZONE = 64;
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
  const lastY = useRef(0);
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
      const goingUp = y < lastY.current;
      lastY.current = y;
      if (y <= SCROLLED_THRESHOLD) setScrolled(false);
      else if (goingUp && y <= EXPAND_ZONE) setScrolled(false);
      else if (!goingUp || y > EXPAND_ZONE) setScrolled(true);
      // While a click-initiated smooth scroll is running, keep the clicked item active.
      if (programmatic.current) {
        armSettleTimer();
        return;
      }
      resolveActive(e.nativeEvent.contentOffset.y);
    },
    [armSettleTimer, resolveActive],
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

  return { scrollRef, activeId, scrolled, onScroll, scrollToSection, onSectionLayout, onViewportLayout, onContentSizeChange };
}
