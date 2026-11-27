import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, type } from "../theme";
import { pointer } from "../theme/cursor";
import { appear, press, transition } from "../theme/motion";
import { useHover } from "../hooks/useHover";
import { Icon } from "../components/Icon";
import { Prototype, PROTOTYPES } from "../data/prototypes";
import { useScreen } from "../state/screen";

/** The empty page the prototype opens on: a short list of cards that lead into the research note or the VDR. */
export function StartScreen() {
  return (
    <View style={styles.root}>
      <View accessibilityRole="list" style={styles.column}>
        <Group label="Prototypes" group="prototypes" start={0} />
        <Group label="Archived" group="archived" start={PROTOTYPES.filter((p) => p.group === "prototypes").length} />
      </View>
    </View>
  );
}

/** One layer of the list under its eyebrow; empty groups are left out. */
function Group({ label, group, start }: { label: string; group: Prototype["group"]; start: number }) {
  const { go } = useScreen();
  const items = PROTOTYPES.filter((p) => p.group === group);
  if (items.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.eyebrow}>{label}</Text>
      <View style={styles.list}>
        {items.map((item, i) => (
          <Row key={item.key} index={start + i} item={item} onPress={() => go(item.key)} />
        ))}
      </View>
    </View>
  );
}

function Row({
  item,
  index,
  onPress,
}: {
  item: Prototype;
  index: number;
  onPress: () => void;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.card,
        hover.hovered && styles.cardHover,
        appear(index),
        press(pressed),
      ]}
    >
      <View style={[styles.iconTile, hover.hovered && styles.iconTileHover]}>
        <Icon name={item.icon} size={16} />
      </View>
      <View style={styles.text}>
        <Text style={type.sectionTitle}>{item.title}</Text>
      </View>
      {item.tag && (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{item.tag}</Text>
        </View>
      )}
      <Icon
        name="drawerChevron"
        size={16}
        style={{ transform: [{ rotate: "90deg" }] }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Same page ground as the note: slate-50 with white 8px-radius cards on it.
  root: {
    flex: 1,
    backgroundColor: colors.slate50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  column: { width: "100%", maxWidth: 440, gap: 24 },
  group: { gap: 12 },
  eyebrow: {
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.44,
    textTransform: "uppercase",
    color: colors.slate500,
    paddingHorizontal: 4,
  },
  list: { gap: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    boxShadow: `0px 0px 0px 1px ${colors.cardBorder}, 0px 1px 2px ${colors.floatingShadowSoft}`,
    ...pointer,
    ...transition(["box-shadow", "background-color"]),
  },
  cardHover: {
    boxShadow: `0px 0px 0px 1px ${colors.slate200}, 0px 4px 12px ${colors.floatingShadow}`,
  },
  // 32px tile with a 8px radius (card 8px + 12px padding would be 20; a tile this small stays 8 to match the nav tiles).
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.slate100,
    ...transition(["background-color"]),
  },
  iconTileHover: { backgroundColor: colors.pine100 },
  text: { flex: 1, minWidth: 0, justifyContent: "center" },
  tag: {
    paddingHorizontal: 8,
    height: 20,
    justifyContent: "center",
    borderRadius: 4,
    backgroundColor: colors.pine100,
  },
  tagText: {
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: colors.pine800,
  },
});
