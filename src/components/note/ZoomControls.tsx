import { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../theme";
import { transition } from "../../theme/motion";
import { Icon } from "../Icon";
import { Stroke } from "../Stroke";
import { pointer } from "../../theme/cursor";

/** Top to bottom, as in Figma: A+ (16px), A (14px), A- (12px). `index` is into the 12/14/16 size list. */
const SIZE_OPTIONS = [
  { index: 2, label: "A+", name: "Larger text (16px)" },
  { index: 1, label: "A", name: "Medium text (14px)" },
  { index: 0, label: "A-", name: "Small text (12px)" },
] as const;

type Props = {
  /** Selected text size: 0 = 12px (A-), 1 = 14px (A), 2 = 16px (A+). */
  sizeIndex: number;
  onSelectSize: (index: number) => void;
  /** 0 = hidden, 1 = shown: the scroll-to-top button fades in above the zoom stack as the page scrolls. */
  topProgress: Animated.Value;
  /** True once the scroll-to-top button is visible enough to take clicks. */
  topActive: boolean;
  onScrollTop: () => void;
};

/**
 * Text size control (Figma 332:4138): a stack of three segments, A+ / A / A-, the chosen one tinted green,
 * with a scroll-to-top button stacked 8px above it once the page has been scrolled (Figma 332:4475).
 */
export function ZoomControls({
  sizeIndex,
  onSelectSize,
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
      <View style={styles.group} accessibilityRole="radiogroup">
        {SIZE_OPTIONS.map(({ index, label, name }) => {
          const selected = index === sizeIndex;
          return (
            <Pressable
              key={label}
              accessibilityRole="radio"
              accessibilityLabel={name}
              accessibilityState={{ selected }}
              onPress={() => onSelectSize(index)}
              style={[styles.button, selected && styles.selected]}
            >
              <Text style={[styles.glyph, selected && styles.glyphSelected]}>
                {label}
              </Text>
              {selected && <Stroke color={colors.white} radius={4} />}
            </Pressable>
          );
        })}
        <Stroke color={colors.white} radius={4} />
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
  selected: { backgroundColor: "#f0f5f4" },
  glyph: {
    fontFamily: fonts.geistMedium,
    fontSize: 10,
    lineHeight: 12,
    color: colors.slate600,
  },
  glyphSelected: { color: colors.pine800 },
});
