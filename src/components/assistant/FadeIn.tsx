import { ReactNode, useEffect, useState } from "react";
import { Animated, Easing, ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  /** Pixels the content rises while fading in. */
  rise?: number;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
};

/** Fades (and slightly lifts) its children in once, when mounted. */
export function FadeIn({
  children,
  rise = 6,
  duration = 220,
  delay = 0,
  style,
}: Props) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(value, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, duration, delay]);
  return (
    <Animated.View
      style={[
        {
          opacity: value,
          transform: [
            {
              translateY: value.interpolate({
                inputRange: [0, 1],
                outputRange: [rise, 0],
              }),
            },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
