import { useCallback, useEffect, useRef, useState } from 'react';
import { HEADER_COLLAPSED_HEIGHT } from '../theme/layout';
import { Animated, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollViewInstance } from 'react-native';

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
  const currentY = useRef(0);
  const cancelScroll = useRef<(() => void) | null>(null);
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
      currentY.current = y;
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

  /**
   * Eased scroll (web): the browser's own smooth scroll is linear and slow for long jumps, so run it ourselves.
   * Duration grows with distance but is capped, it starts and ends softly, and the user taking over (wheel, touch,
   * keys) cancels it immediately. Native falls back to the platform animation.
   */
  const animateTo = useCallback((target: number, durationMs?: number) => {
    const view = scrollRef.current;
    if (!view) return;
    if (Platform.OS !== 'web') {
      view.scrollTo({ y: target, animated: true });
      return;
    }
    cancelScroll.current?.();
    const from = currentY.current;
    const distance = target - from;
    if (Math.abs(distance) < 2) return;
    const duration = durationMs ?? Math.min(1150, Math.max(620, 560 + Math.abs(distance) * 0.2));
    const start = performance.now();
    let raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => window.removeEventListener(ev, stop));
      cancelScroll.current = null;
    };
    // Gentle start, long soft landing: an ease-in-out whose result is eased out again, so the last stretch
    // (near 1 the remaining distance shrinks like (1-t)^4.8) runs out slowly instead of stopping short.
    const base = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const ease = (t: number) => 1 - Math.pow(1 - base(t), 2.4);
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      view.scrollTo({ y: from + distance * ease(t), animated: false });
      if (t < 1) raf = requestAnimationFrame(frame);
      else stop();
    };
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((ev) => window.addEventListener(ev, stop, { passive: true }));
    cancelScroll.current = stop;
    raf = requestAnimationFrame(frame);
  }, []);

  useEffect(() => () => cancelScroll.current?.(), []);

  /**
   * Mouse-wheel smoothing (web). A wheel notch jumps the page a fixed step, which reads as linear and steppy, so
   * notches are collected into a target offset and the page glides toward it (exponential easing: fast at first,
   * settling softly). Trackpads and other fine-grained input already scroll smoothly and are left to the browser,
   * and so are pinch-zoom and horizontal gestures.
   */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = (scrollRef.current as unknown as { getScrollableNode?: () => HTMLElement } | null)?.getScrollableNode?.();
    if (!node) return;
    let target = node.scrollTop;
    // Two chained eases (a point chasing a point chasing the target) give an S-shaped glide: it picks up gently and,
    // more to the point, runs out slowly at the end instead of stopping short.
    let lead = target;
    let pos = target;
    let last = 0;
    let raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const step = (now: number) => {
      const dt = Math.min(48, now - (last || now - 16));
      last = now;
      const k = 1 - Math.exp(-dt / 70); // frame-rate independent
      lead += (target - lead) * k;
      pos += (lead - pos) * k;
      if (Math.abs(target - pos) < 0.4 && Math.abs(target - lead) < 0.4) {
        node.scrollTop = target;
        raf = 0;
        last = 0;
        return;
      }
      node.scrollTop = pos;
      raf = requestAnimationFrame(step);
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const lines = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? node.clientHeight : 1;
      const delta = e.deltaY * lines;
      // Only notch-like input (big, whole steps) is smoothed; small fractional deltas are a trackpad.
      const notch = e.deltaMode !== 0 || (Math.abs(delta) >= 50 && Number.isInteger(delta));
      if (!notch) {
        stop();
        return;
      }
      e.preventDefault();
      if (!raf) {
        target = node.scrollTop;
        lead = target;
        pos = target;
      }
      target = Math.max(0, Math.min(node.scrollHeight - node.clientHeight, target + delta));
      if (!raf) raf = requestAnimationFrame(step);
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      node.removeEventListener('wheel', onWheel);
      stop();
    };
  }, []);

  const scrollToSection = useCallback(
    (id: string) => {
      const y = offsets.current[id];
      if (y === undefined) return;
      programmatic.current = true;
      setActiveId(id);
      armSettleTimer();
      animateTo(Math.max(0, y - TOP_INSET));
    },
    [armSettleTimer, animateTo],
  );

  const scrollToTop = useCallback((durationMs?: number) => {
    programmatic.current = true;
    setActiveId(ids[0]);
    armSettleTimer();
    animateTo(0, durationMs);
  }, [armSettleTimer, ids, animateTo]);

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
