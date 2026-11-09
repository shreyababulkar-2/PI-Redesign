import { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { colors } from "../../theme";
import { transition } from "../../theme/motion";
import { Icon } from "../Icon";
import { pointer } from "../../theme/cursor";

type Props = {
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** 0 = hidden, 1 = shown: the scroll-to-top button fades in above the zoom stack as the page scrolls. */
  topProgress: Animated.Value;
  /** True once the scroll-to-top button is visible enough to take clicks. */
  topActive: boolean;
  onScrollTop: () => void;
};

/**
 * Zoom stepper (Figma "Zoom controls": Default / Plus disabled / Minus disabled) with a
 * scroll-to-top button stacked 8px above it once the page has been scrolled (Figma 332:4475).
 */
export function ZoomControls({
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  topProgress,
  topActive,
  onScrollTop,
}: Props) {
  // Unmounted while invisible so a hidden button can't take hover or clicks.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = topProgress.addListener(({ value }) =>
      setMounted((prev) => (prev === value > 0 ? prev : value > 0)),
    );
    return () => topProgress.removeListener(id);
  }, [topProgress]);

  return (
    <View pointerEvents="box-none" style={styles.root}>
      {mounted && (
        <Animated.View
          pointerEvents={topActive ? "auto" : "none"}
          style={[
            styles.group,
            {
              opacity: topProgress,
              transform: [
                {
                  translateY: topProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scroll to top"
            onPress={onScrollTop}
            style={styles.button}
          >
            <Icon name="scrollTop" size={16} />
          </Pressable>
        </Animated.View>
      )}
      <View style={styles.group}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          accessibilityState={{ disabled: !canZoomIn }}
          disabled={!canZoomIn}
          onPress={onZoomIn}
          style={[styles.button, !canZoomIn && styles.disabled]}
        >
          <Icon name={canZoomIn ? "plus" : "plusDisabled"} size={16} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          accessibilityState={{ disabled: !canZoomOut }}
          disabled={!canZoomOut}
          onPress={onZoomOut}
          style={[styles.button, !canZoomOut && styles.disabled]}
        >
          <Icon name={canZoomOut ? "minus" : "minusDisabled"} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Sits on the 12px grid: 12px in from the column's right edge, the same line as the floating
  // header's kebab (12px header padding), and 12px up from the bottom.
  root: {
    position: "absolute",
    right: 12,
    bottom: 12,
    gap: 8,
    alignItems: "flex-end",
  },
  group: {
    backgroundColor: colors.white,
    borderRadius: 4,
    overflow: "hidden",
    boxShadow: "0px 1px 2px rgba(0,0,0,0.04)",
  },
  button: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
    ...transition(["background-color"]),
  },
  disabled: { backgroundColor: colors.grey50, cursor: "auto" },
});
