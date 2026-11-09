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
