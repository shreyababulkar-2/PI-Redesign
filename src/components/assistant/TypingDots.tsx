import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { colors } from "../../theme";

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

function Dot({ delay }: { delay: number }) {
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
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.slate400,
  },
});
