import { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { colors } from "../../theme";
import { press, transition } from "../../theme/motion";
import { WithTooltip } from "../Tooltip";
import { Icon } from "../Icon";
import { pointer } from "../../theme/cursor";

type Props = {
  /** 0 = hidden, 1 = shown: the button fades in as the page scrolls. */
  progress: Animated.Value;
  /** True once the button is visible enough to take clicks. */
  active: boolean;
  onPress: () => void;
};

/**
 * Scroll-to-top button in the note's bottom-right corner (Figma 332:4475). It appears once the page has been
 * scrolled and shows a "Scroll to top" tooltip on hover. The text size control that used to sit under it is gone;
 * page-level controls will come later.
 */
export function ScrollTopButton({ progress, active, onPress }: Props) {
  // Unmounted while invisible so a hidden button can't take hover or clicks.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = progress.addListener(({ value }) =>
      setMounted((prev) => (prev === value > 0 ? prev : value > 0)),
    );
    return () => progress.removeListener(id);
  }, [progress]);

  if (!mounted) return null;
  return (
    <View pointerEvents="box-none" style={styles.root}>
      <Animated.View
        pointerEvents={active ? "auto" : "none"}
        style={[
          styles.group,
          {
            opacity: progress,
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [6, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* On the left: the right-hand side is the assistant panel, so the tooltip reads better over the note. */}
        <WithTooltip text="Scroll to top" side="left">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scroll to top"
            onPress={onPress}
            style={({ pressed }) => [styles.button, press(pressed)]}
          >
            <Icon name="scrollTop" size={16} />
          </Pressable>
        </WithTooltip>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Sits on the 12px grid: 12px in from the column's right edge, the same line as the floating
  // header's kebab (12px header padding), and 12px up from the bottom.
  root: { position: "absolute", right: 12, bottom: 12, alignItems: "flex-end" },
  group: {
    backgroundColor: colors.white,
    borderRadius: 4,
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
});
