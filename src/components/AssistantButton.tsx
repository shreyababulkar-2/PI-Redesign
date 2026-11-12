import { Pressable, StyleSheet } from "react-native";
import { colors } from "../theme";
import { press, transition } from "../theme/motion";
import { useHover } from "../hooks/useHover";
import { useAssistantOverlay } from "../state/assistantOverlay";
import { Icon } from "./Icon";
import { pointer } from "../theme/cursor";

type Props = {
  /** 36 beside the floating header's kebab (Figma 349:9565); 28 in the full header's button row. */
  size: 28 | 36;
};

/**
 * Opens the assistant when it has collapsed (narrow windows): the pine-gradient pill with the white
 * sparkles icon, the same button in both headers. Renders nothing when the assistant is already
 * visible next to the note.
 */
export function AssistantButton({ size }: Props) {
  const { collapsed, setOpen } = useAssistantOverlay();
  const hover = useHover();
  if (!collapsed) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open assistant"
      onPress={() => setOpen(true)}
      {...hover.handlers}
      style={({ pressed }) => [styles.pill, { width: size, height: size }, hover.hovered && styles.hovered, press(pressed)]}
    >
      <Icon
        name={size === 36 ? "assistantPillBg" : "assistantPillBg28"}
        size={size}
        style={StyleSheet.absoluteFill}
      />
      <Icon name="assistantSparkles" size={size === 36 ? 20 : 16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    // 1px pine ring + soft drop shadow, as in the design.
    boxShadow: `0px 0px 0px 1px ${colors.pine700}, 0px 1px 2px rgba(0,0,0,0.15)`,
    ...pointer,
    ...transition(["opacity"]),
  },
  hovered: { opacity: 0.9 },
});
