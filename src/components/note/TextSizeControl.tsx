import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../theme";
import { pointer } from "../../theme/cursor";
import { press, transition } from "../../theme/motion";
import { useHover } from "../../hooks/useHover";
import { TEXT_SIZES, TextSizeKey } from "../../state/textSize";
import { WithTooltip } from "../Tooltip";

/**
 * The research note's text size control (Figma 1135:4206): a white pill of three 28px buttons stacked at the bottom of the
 * note's right edge, A+ (larger), A (as designed) and A- (smaller). The chosen one is pale green. It scales the note's
 * text only; the header, side nav and assistant keep their size.
 */
export const TEXT_SIZE_CONTROL_HEIGHT = 84;

export function TextSizeControl({
  size,
  onChange,
}: {
  size: TextSizeKey;
  onChange: (size: TextSizeKey) => void;
}) {
  // Top to bottom: A+, A, A-.
  const order = [...TEXT_SIZES].reverse();
  return (
    <View accessibilityRole="radiogroup" style={styles.root}>
      {order.map((s) => (
        <Option
          key={s.key}
          label={s.label}
          name={s.name}
          selected={s.key === size}
          onPress={() => onChange(s.key)}
        />
      ))}
    </View>
  );
}

function Option({
  label,
  name,
  selected,
  onPress,
}: {
  label: string;
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  const hover = useHover();
  return (
    <WithTooltip text={name} side="left" style={styles.slot}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={name}
        onPress={onPress}
        {...hover.handlers}
        style={({ pressed }) => [
          styles.option,
          selected ? styles.selected : hover.hovered && styles.hover,
          press(pressed),
        ]}
      >
        <Text style={[styles.text, selected && styles.textSelected]}>
          {label}
        </Text>
      </Pressable>
    </WithTooltip>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 28,
    height: TEXT_SIZE_CONTROL_HEIGHT,
    borderRadius: 8,
    backgroundColor: colors.white,
    boxShadow: "0px 1px 6px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  slot: { width: 28, height: 28 },
  option: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
    ...transition(["background-color"]),
  },
  hover: { backgroundColor: colors.slate50 },
  selected: { backgroundColor: "#f0f5f4" },
  text: {
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.slate600,
  },
  textSelected: { fontFamily: fonts.geistMedium, color: colors.pine800 },
});
