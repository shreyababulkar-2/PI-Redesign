import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { motion } from '../theme/motion';

const DURATION_MS = motion.header;

/** 0 = default (full) header, 1 = floating header. Animates between them when `scrolled` flips. */
export function useHeaderProgress(scrolled: boolean): Animated.Value {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: scrolled ? 1 : 0,
      duration: DURATION_MS,
      easing: Easing.bezier(0.2, 0, 0, 1), // fast out of the gate, short settle,
      useNativeDriver: false, // drives layout-affecting transforms on web
    }).start();
  }, [scrolled, progress]);

  return progress;
}
