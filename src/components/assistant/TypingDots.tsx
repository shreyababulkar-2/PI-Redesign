import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { colors } from "../../theme";

/**
 * The three dots after "Assistant is thinking" (Figma 62:24796): 2px dots, 2px apart, in the label's green, pulsing
 * one after another. Sits level with the bottom of the text.
 */
export function ThinkingDots() {
  return (
    <View accessibilityLabel="Generating" style={styles.thinkingRow}>
      <Dot delay={0} size={2} color={colors.pine700} />
      <Dot delay={160} size={2} color={colors.pine700} />
      <Dot delay={320} size={2} color={colors.pine700} />
    </View>
  );
}

/** Three small dots that rise and fall in turn: the usual "still working" indicator. */
export function TypingDots() {
  return (
    <View accessibilityLabel="Generating" style={styles.row}>
      <Dot delay={0} />
      <Dot delay={160} />
      <Dot delay={320} />
    </View>
  );
}

function Dot({ delay, size = 3, color }: { delay: number; size?: number; color?: string }) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 320,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.delay(480 - delay),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value, delay]);
  return (
    <Animated.View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2 },
        color ? { backgroundColor: color } : null,
        {
          opacity: value.interpolate({
            inputRange: [0, 1],
            outputRange: [0.35, 1],
          }),
          transform: [
            {
              translateY: value.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -1.5],
              }),
            },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 8,
    paddingTop: 2,
  },
  thinkingRow: { flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 4, alignSelf: "flex-end" },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.slate400,
  },
});
