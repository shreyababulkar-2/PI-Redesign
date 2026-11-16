import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, type } from "../../theme";
import { assistant } from "../../data/researchNote";
import { transition } from "../../theme/motion";
import { useHover } from "../../hooks/useHover";
import { pointer } from "../../theme/cursor";
import { useActiveTab } from "../../state/activeTab";
import { benchmarkAssistant } from "../../data/benchmarking";

type Props = { onPick: (question: string) => void };

/** Empty state (Figma "Smart assist - default"): a short intro and suggested questions. */
export function Welcome({ onPick }: Props) {
  // The assistant is the same on every tab; only the opening text and suggestions follow the page.
  const { tab } = useActiveTab();
  const { intro, heading, suggestions } =
    tab === 2 ? benchmarkAssistant : assistant.welcome;
  return (
    <View style={styles.root}>
      <Text
        style={[
          type.answer,
          {
            color: colors.slate800,
          },
        ]}
      >
        {intro}
      </Text>
      <View style={styles.block}>
        <Text style={styles.heading}>{heading}</Text>
        <View style={styles.chips}>
          {suggestions.map((s) => (
            <Suggestion key={s} label={s} onPress={() => onPick(s)} />
          ))}
        </View>
      </View>
    </View>
  );
}

function Suggestion({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      {...hover.handlers}
      style={[styles.chip, hover.hovered && styles.chipHover]}
    >
      <Text
        style={[styles.chipText, hover.hovered && styles.chipTextHover]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%", gap: 16 },
  block: { gap: 12 },
  heading: {
    fontFamily: fonts.geistSemiBold,
    fontSize: 11,
    lineHeight: 20,
    color: "#1c1c1c",
  },
  chips: { gap: 10, alignItems: "flex-start" },
  chip: {
    maxWidth: "100%",
    // Figma 542:18730: a 28px pill with 12/6 padding measured to the outer edge, so 11/5 inside its 1px border.
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.dew75,
    borderWidth: 1,
    borderColor: colors.dew100,
    ...pointer,
    ...transition(["background-color"]),
  },
  chipHover: { backgroundColor: colors.dew100 },
  chipText: {
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.0825,
    color: "#2b303b",
    ...transition(["color"]),
  },
  // Hovered: the pill fills with the border green and its text turns pine (Figma 542:18720).
  chipTextHover: { color: colors.pine800 },
});
