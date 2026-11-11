import { Platform, ViewStyle } from 'react-native';

/** Shared timings (ms). */
export const motion = {
  /** Hover / state changes. */
  fast: 150,
  /** Menus and header cross-fade. */
  base: 240,
  /** Header morph between full and floating forms. */
  header: 200,
} as const;

/**
 * Web-only CSS transition for the given style properties, so hover/active changes ease in and out
 * instead of snapping. Native ignores it (those states are driven by Animated where needed).
 */
export function transition(properties: string[], ms: number = motion.fast): ViewStyle | null {
  if (Platform.OS !== 'web') return null;
  return {
    transitionProperty: properties.join(', '),
    transitionDuration: `${ms}ms`,
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
  } as ViewStyle;
}

/**
 * Press feedback for buttons: a subtle 0.96 scale while held. Put it last in a Pressable's style so its
 * transition list (which also keeps the hover colour and opacity easing) is the one that applies.
 */
export function press(pressed: boolean): ViewStyle {
  return {
    transform: [{ scale: pressed ? 0.96 : 1 }],
    ...transition(['transform', 'background-color', 'opacity'], 120),
  } as ViewStyle;
}

let appearEnabled = false;
/** Called once the user first navigates: the first paint of the page never animates in. */
export function enableAppear() {
  appearEnabled = true;
}

const KEYFRAMES = 'pi-appear';

/**
 * Web-only entrance for a block of content when its page is shown: a short fade and 8px rise, staggered by
 * `index` (capped so a long page doesn't wait). It is a CSS animation with a backwards fill, so nothing is left
 * on the element afterwards (no lingering transform or stacking context to trap menus). Skipped on the first
 * paint, for reduced-motion users, and on native. The `pi-appear` keyframes are injected in App.tsx.
 */
export function appear(index = 0): ViewStyle | null {
  if (Platform.OS !== 'web' || !appearEnabled) return null;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;
  return {
    animationName: KEYFRAMES,
    animationDuration: '260ms',
    animationDelay: `${Math.min(index, 4) * 60}ms`,
    animationTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
    animationFillMode: 'backwards',
  } as ViewStyle;
}

/** While the page is being swapped, the old content fades out quickly before the new one eases in. */
export function leaving(switching: boolean): ViewStyle {
  return { opacity: switching ? 0 : 1, ...transition(['opacity'], 140) } as ViewStyle;
}
