import { StyleSheet, Text, View } from "react-native";
import { fonts } from "../../theme";

const BG = "#181b25";

/**
 * Small dark label that sits just above a button, with its arrow 8px in from the left edge
 * (Figma "Tooltips": 4px radius, 4/8 padding, 11/18 white text). The parent must be `position: relative`.
 */
export function Tooltip({ label }: { label: string }) {
  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.text}>
          {label}
        </Text>
      </View>
      <View style={styles.arrow} />
    </View>
  );
}

const styles = StyleSheet.create({
  // 24px button + the 4px arrow, so the arrow tip touches the button's top edge.
  // Wider than the 24px button so the label stays on one line; the body hugs its text.
  root: { position: "absolute", left: 0, bottom: 26, width: 240, zIndex: 20 },
  body: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: BG,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 18,
    color: "#ffffff",
  },
  arrow: {
    marginLeft: 8,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: BG,
  },
});
