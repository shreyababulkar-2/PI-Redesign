import { ReactNode, useEffect, useState } from "react";
import { Animated, Easing } from "react-native";

/** Gently pulses its children's opacity, for "still working" indicators. */
export function Pulse({ children }: { children: ReactNode }) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value]);
  return (
    <Animated.View
      style={{
        opacity: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0.35, 1],
        }),
      }}
    >
      {children}
    </Animated.View>
  );
}
