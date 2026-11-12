import { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { colors, fonts } from "../../theme";
import { sections } from "../../data/researchNote";
import {
  DrawerSource,
  perspectiveFor,
  sectionSources,
} from "../../data/sourcesDrawer";
import { useSourcesDrawer } from "../../state/sourcesDrawer";
import { defaultAssistantWidth } from "../assistant/ResizableAssistant";
import { useHover } from "../../hooks/useHover";
import { press, transition } from "../../theme/motion";
import { pointer } from "../../theme/cursor";
import { Icon } from "../Icon";
import { WithTooltip } from "../Tooltip";

const ENTER_MS = 300;
const EXIT_MS = 300;
/** How far the drawer travels while it fades in and out. */
const SLIDE_PX = 40;

/**
 * Opening decelerates (fast start, soft landing); closing uses a symmetric ease-in-out so it starts gently and
 * settles instead of snapping away. Both take the same time, which keeps the close from feeling rushed.
 */
const fade = (shown: boolean, props: string[]): ViewStyle =>
  ({
    transitionProperty: props.join(", "),
    transitionDuration: `${shown ? ENTER_MS : EXIT_MS}ms`,
    transitionTimingFunction: shown
      ? "cubic-bezier(0.22, 1, 0.36, 1)"
      : "cubic-bezier(0.4, 0, 0.2, 1)",
  }) as ViewStyle;

/**
 * Sources drawer (Figma 501:8562): opened from a section's "View sources" action, one drawer per section. It sits
 * where the assistant is, over a dimmed page; the header names the section, the body lists that section's sources
 * grouped by where they live, then an "Investor perspective" summary. Closes with the X, a click on the dimmed
 * page, or Escape. It eases in from the right and leaves a little faster than it arrives.
 */
export function SourcesDrawer() {
  const { openSectionId } = useSourcesDrawer();
  if (!openSectionId) return null;
  // Keyed by section, so switching sections mounts a fresh drawer that eases in.
  return <DrawerBody key={openSectionId} sectionId={openSectionId} />;
}

function DrawerBody({ sectionId }: { sectionId: string }) {
  const { close } = useSourcesDrawer();
  // Fixed at the assistant's default width for this window. It is never resized, even if the assistant has been.
  const width = defaultAssistantWidth(useWindowDimensions().width);
  // `shown` flips after the first paint (and back on close), and CSS transitions animate between the two looks.
  // They run on the compositor, so the slide and fade stay smooth even while the list underneath renders.
  const [shown, setShown] = useState(false);
  const closing = useRef(false);
  useEffect(() => {
    const id = setTimeout(() => setShown(true), 20);
    return () => clearTimeout(id);
  }, []);

  // Every way of closing (X, dimmed page, Escape) plays the exit first and then tells the provider.
  const requestClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setShown(false);
    // A beat after the transition ends, so the drawer is fully faded before it unmounts.
    setTimeout(close, EXIT_MS + 40);
  }, [close]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose]);

  const section = sections.find((s) => s.id === sectionId);
  if (!section) return null;
  const { internet, sharepoint } = sectionSources(section);

  return (
    <>
      <View
        style={[
          styles.scrim,
          { opacity: shown ? 1 : 0 },
          // The blur eases in with the dimming instead of popping on.
          Platform.OS === "web"
            ? ({ backdropFilter: shown ? "blur(2px)" : "blur(0px)" } as object)
            : null,
          fade(shown, ["opacity", "backdrop-filter"]),
        ]}
      >
        <Pressable
          accessibilityLabel="Close sources"
          onPress={requestClose}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View
        accessibilityRole="none"
        {...({
          role: "dialog",
          "aria-label": `Sources (${section.title})`,
        } as object)}
        style={[
          styles.drawer,
          { width },
          {
            opacity: shown ? 1 : 0,
            transform: [{ translateX: shown ? 0 : SLIDE_PX }],
          },
          fade(shown, ["opacity", "transform"]),
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Icon name="drawerLink" size={16} />
            <Text numberOfLines={1} style={styles.headerText}>
              Sources ({section.title})
            </Text>
          </View>
          <CloseButton onPress={requestClose} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {internet.length > 0 && (
            <SourceGroup label="Internet" items={internet} />
          )}
          {sharepoint.length > 0 && (
            <SourceGroup label="Data room" items={sharepoint} />
          )}
          {internet.length + sharepoint.length === 0 && (
            <Text style={styles.empty}>
              No sources are cited in this section yet.
            </Text>
          )}
          <View style={styles.rule} />
          <View style={styles.group}>
            <Text style={styles.groupLabel}>Investor perspective</Text>
            <View style={styles.card}>
              <Text style={styles.perspective}>{perspectiveFor(section)}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close sources"
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.close,
        hover.hovered && styles.closeHover,
        press(pressed),
      ]}
    >
      <Icon name="drawerClose" size={18} />
    </Pressable>
  );
}

/** A collapsible group: "LABEL (count)" and a chevron, over a grey card of rows split by hairlines. */
function SourceGroup({
  label,
  items,
}: {
  label: string;
  items: DrawerSource[];
}) {
  const [open, setOpen] = useState(true);
  return (
    <View style={styles.group}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${label}, ${items.length} sources`}
        onPress={() => setOpen((v) => !v)}
        style={styles.groupHeader}
      >
        <View style={styles.groupTitle}>
          <Text style={styles.groupLabel}>
            {label} ({items.length})
          </Text>
        </View>
        <View
          style={[
            { transform: [{ rotate: open ? "0deg" : "180deg" }] },
            transition(["transform"], 200) as ViewStyle,
          ]}
        >
          <Icon name="drawerChevron" size={16} />
        </View>
      </Pressable>
      {open && (
        <View style={styles.card}>
          {items.map((item, i) => (
            <View key={item.n}>
              {i > 0 && <View style={styles.rowRule} />}
              <SourceRow item={item} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function SourceRow({ item }: { item: DrawerSource }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${item.n}. ${item.title}`}
      {...hover.handlers}
      style={styles.row}
    >
      {/* The citation number, as it appears in the section's text. These are not a running count: a section can
          cite 1, 2, 5 and 8, and the badges show exactly those. */}
      <View style={styles.number}>
        <Text style={styles.numberText}>{item.n}</Text>
      </View>
      <View style={styles.rowText}>
        {/* A cut-off title or URL shows its full text in a small tooltip while hovered. */}
        <WithTooltip
          text={item.title}
          side="bottom"
          size="small"
          onlyIfTruncated
        >
          <Text
            numberOfLines={1}
            style={[
              styles.rowTitle,
              hover.hovered && styles.rowTitleHover,
              transition(["color"], 150) as ViewStyle,
            ]}
          >
            {item.title}
          </Text>
        </WithTooltip>
        {/* Where it comes from, and how many times the section cites it. */}
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Text numberOfLines={1} style={styles.chipText}>
              {item.origin}
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>Cited ×{item.cited}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Dims the page behind the drawer (the Figma "Background Shape"), softly blurred on web.
  scrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(24,27,37,0.45)",
    zIndex: 59,
  },
  drawer: {
    position: "absolute",
    top: 8,
    right: 8,
    bottom: 8,
    width: 398,
    maxWidth: "100%",
    borderRadius: 10,
    backgroundColor: colors.white,
    overflow: "hidden",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
    zIndex: 60,
  },
  header: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.pine800,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    flex: 1,
    fontFamily: fonts.geistMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.17,
    color: colors.white,
  },
  close: {
    width: 28,
    height: 28,
    marginRight: -5,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
    ...transition(["background-color"]),
  },
  closeHover: { backgroundColor: colors.white10 },
  body: { padding: 16, gap: 20 },
  empty: {
    fontFamily: fonts.geistRegular,
    fontSize: 12,
    lineHeight: 18,
    color: "#717784",
  },
  group: { gap: 12 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 16,
    ...pointer,
  },
  groupTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupLabel: {
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.44,
    color: "#525866",
    textTransform: "uppercase",
  },
  card: { padding: 16, borderRadius: 8, backgroundColor: "#f5f7fa" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, ...pointer },
  rowText: { flex: 1, minWidth: 0, gap: 4 },
  chips: { flexDirection: "row", alignItems: "center", gap: 8 },
  // White pills on the grey card (Figma 507:10539): the origin, then "Cited ×N".
  chip: {
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 4,
    justifyContent: "center",
    backgroundColor: colors.white,
    flexShrink: 1,
  },
  chipText: {
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 16,
    color: "#525866",
  },
  number: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e7f2ea",
  },
  numberText: {
    fontFamily: fonts.geistMedium,
    fontSize: 10,
    lineHeight: 13,
    color: colors.pine800,
  },
  rowRule: {
    height: 1,
    marginVertical: 12,
    backgroundColor: "rgba(225,228,234,0.6)",
  },
  rowTitle: {
    fontFamily: fonts.geistMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.06,
    color: "#181b25",
  },
  rowTitleHover: { color: colors.pine800, textDecorationLine: "underline" },
  rule: { height: 1, backgroundColor: "#e1e4ea" },
  perspective: {
    fontFamily: fonts.geistRegular,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.06,
    color: "#2b303b",
  },
});
