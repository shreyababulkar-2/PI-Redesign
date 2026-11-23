import { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { colors, fonts, type } from "../../theme";
import { pointer } from "../../theme/cursor";
import { press } from "../../theme/motion";
import { vdr } from "../../assets/vdr";
import { sections } from "../../data/sections";
import { VersionChip } from "../note/Chip";
import { RichText } from "../note/RichText";
import { useHover } from "../../hooks/useHover";
import { MemoSlides } from "./MemoSlides";
import { ArtifactFrame } from "./ArtifactFrame";
import { WorkbookSheet } from "./WorkbookSheet";
import { FINANCIAL_MODEL } from "../../data/financialModel";
import { INVESTMENT_ANALYSIS } from "../../data/investmentAnalysis";
import { isArtefact } from "../../data/artefacts";

/** Narrowest the drawer can be dragged to; the widest is half the window. */
export const DRAWER_MIN_WIDTH = 360;

/**
 * Width of the drawer when it opens: 500 for documents, 602 for artefacts (Figma 88:25334, the artefact frame is 570 wide
 * inside it). The user can drag it wider or narrower.
 */
/** One default width for every tab, document or artefact (Figma 35:16596: 500px). */
export const DRAWER_DEFAULT_WIDTH = 500;
export const drawerWidthFor = (_doc: string) => DRAWER_DEFAULT_WIDTH;

/**
 * The deal-document drawer (Figma 35:16596 "Research note - Active", 41:20368 with several tabs): a panel at the right
 * of the full assistant view. A pale-green header holds one tab per opened document, the active one as a pine pill and
 * the others plain with their own close button, plus a close button for the whole drawer. Below it sits the active
 * document, and a dark "Go to …" pill floats at the bottom. Only the research note and the IC memo have content in the
 * prototype; other documents show a short placeholder. Dragging its left edge resizes it, between a minimum and half
 * the window.
 */
export function DocDrawer({
  width,
  widthValue,
  maxWidth,
  onResize,
  tabs,
  active,
  onSelectTab,
  onCloseTab,
  onClose,
  onGoTo,
  onPickDoc,
}: {
  width: number;
  /** The same width as an animated value, so the drawer eases between documents of different widths. */
  widthValue: Animated.Value;
  maxWidth: number;
  onResize: (width: number) => void;
  tabs: string[];
  /** null = nothing opened yet: the drawer shows its empty state. */
  active: string | null;
  onSelectTab: (doc: string) => void;
  onCloseTab: (doc: string) => void;
  onClose: () => void;
  onGoTo: () => void;
  /** Opens a document from the empty state's "Recently viewed" cards. */
  onPickDoc: (doc: string) => void;
}) {
  const hover = useHover();
  const handleHover = useHover();
  const [dragging, setDragging] = useState(false);
  // Latest values for the responder, which is created once and only reads them inside event handlers.
  const live = useRef({ width, maxWidth, onResize });
  useEffect(() => {
    live.current = { width, maxWidth, onResize };
  }, [width, maxWidth, onResize]);
  const startWidth = useRef(width);
  // The responder reads the latest values through `live` at event time, never during render.
  /* eslint-disable react-hooks/refs */
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startWidth.current = live.current.width;
        setDragging(true);
        if (Platform.OS === "web") document.body.style.userSelect = "none";
      },
      // Dragging left (negative dx) widens the drawer.
      onPanResponderMove: (_e, g) => {
        const next = Math.min(Math.max(startWidth.current - g.dx, DRAWER_MIN_WIDTH), live.current.maxWidth);
        live.current.onResize(Math.round(next));
      },
      onPanResponderRelease: () => {
        setDragging(false);
        if (Platform.OS === "web") document.body.style.userSelect = "";
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        if (Platform.OS === "web") document.body.style.userSelect = "";
      },
    }),
  );
  /* eslint-enable react-hooks/refs */
  return (
    <Animated.View style={[styles.drawer, { width: widthValue }]}>
      <View style={styles.header}>
        <View style={styles.tabs}>
          {active === null && <Text style={styles.headerTitle}>Documents &amp; artefacts</Text>}
          {tabs.map((doc) =>
            doc === active ? (
              <View key={doc} style={styles.tab}>
                <Image source={isArtefact(doc) ? vdr.drawerTabArtifact : vdr.drawerTabDoc} contentFit="fill" style={{ width: 16, height: 16 }} />
                <Text numberOfLines={1} style={styles.tabText}>
                  {doc}
                </Text>
                <View style={styles.tabNotch} />
                {/* A lone artefact's pill carries no close button of its own (Figma 88:25336; the drawer's close is at the right); with several tabs open, every tab has one. */}
                {(!isArtefact(doc) || tabs.length > 1) && <ActiveTabClose label={doc} onClose={() => onCloseTab(doc)} />}
              </View>
            ) : (
              <IdleTab
                key={doc}
                label={doc}
                onPress={() => onSelectTab(doc)}
                onClose={() => onCloseTab(doc)}
              />
            ),
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close documents"
          onPress={onClose}
          {...hover.handlers}
          style={({ pressed }) => [
            styles.close,
            hover.hovered && { backgroundColor: "rgba(32,91,52,0.08)" },
            press(pressed),
          ]}
        >
          <Image source={vdr.drawerX} contentFit="fill" style={{ width: 14, height: 14 }} />
        </Pressable>
      </View>

      {active === null ? (
        <EmptyState onPickDoc={onPickDoc} />
      ) : isArtefact(active) ? (
        <View style={styles.artifactBody}>
          {active === "Investment analysis" ? (
            <ArtifactFrame>{() => <WorkbookSheet workbook={INVESTMENT_ANALYSIS} />}</ArtifactFrame>
          ) : active === "Financial model" ? (
            <ArtifactFrame>{() => <WorkbookSheet workbook={FINANCIAL_MODEL} />}</ArtifactFrame>
          ) : (
            <View style={styles.card}>
              <Text style={[type.body, { color: colors.slate600 }]}>{`${active} isn't part of this prototype yet.`}</Text>
            </View>
          )}
        </View>
      ) : (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        {active === "Research note" ? (
          sections.slice(0, 2).map((s) => (
            <View key={s.id} style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.titleRow}>
                  <Text style={[type.sectionTitle, { color: colors.slate900 }]}>{s.index}</Text>
                  <Text numberOfLines={1} style={[type.sectionTitle, { color: colors.slate900, flexShrink: 1 }]}>
                    {s.title}
                  </Text>
                </View>
                <VersionChip version={s.version} />
              </View>
              <View style={styles.rule} />
              <RichText blocks={s.body} regular={type.body} bold={type.bodyBold} color={colors.slate700} />
            </View>
          ))
        ) : active === "IC memo" ? (
          <MemoSlides />
        ) : (
          <View style={styles.card}>
            <Text style={[type.body, { color: colors.slate600 }]}>{`${active} isn't part of this prototype yet.`}</Text>
          </View>
        )}
      </ScrollView>
      )}

      <View
        {...responder.panHandlers}
        {...(handleHover.handlers as object)}
        accessibilityRole="adjustable"
        accessibilityLabel="Resize documents"
        style={styles.handle}
      >
        <View style={[styles.handleBar, (dragging || handleHover.hovered) && { opacity: 1 }]} />
      </View>

      {(active === "Research note" || active === "IC memo") && (
        <View pointerEvents="box-none" style={styles.goWrap}>
          <Pressable
            accessibilityRole="link"
            onPress={onGoTo}
            style={({ pressed }) => [styles.go, press(pressed)]}
          >
            <Text style={styles.goText}>{`Go to ${active}`}</Text>
            <Image source={vdr.goArrow} contentFit="fill" style={{ width: 12, height: 12 }} />
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

const RECENT = ["Research note", "IC memo", "Checklist"];

/** The drawer before anything is open (Figma 189:8138): what it is for, and the documents to start from. */
function EmptyState({ onPickDoc }: { onPickDoc: (doc: string) => void }) {
  return (
    <View style={styles.empty}>
      <View style={{ alignItems: "center", gap: 10 }}>
        <View style={styles.emptyIcon}>
          <Image source={vdr.emptyIcon} contentFit="fill" style={{ width: 13.25, height: 15 }} />
        </View>
        <View style={{ alignItems: "center", gap: 4 }}>
          <Text style={styles.emptyTitle}>Nothing open yet</Text>
          <Text style={styles.emptyHint}>
            Artefacts and deal documents for this deal will open here so you can read and edit them side by side.
          </Text>
        </View>
      </View>
      <View style={styles.emptyRule}>
        <Image source={vdr.emptyLineLeft} contentFit="fill" style={{ flex: 1, height: 1, transform: [{ scaleX: -1 }] }} />
        <Text style={styles.emptyHint}>Recently viewed</Text>
        <Image source={vdr.emptyLineRight} contentFit="fill" style={{ flex: 1, height: 1 }} />
      </View>
      <View style={styles.emptyChips}>
        {RECENT.map((title) => (
          <EmptyChip key={title} title={title} onPress={() => onPickDoc(title)} />
        ))}
      </View>
    </View>
  );
}

function EmptyChip({ title, onPress }: { title: string; onPress: () => void }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [styles.emptyChip, hover.hovered && { backgroundColor: "#e3ece9" }, press(pressed)]}
    >
      <View style={styles.emptyChipDot} />
      <Text style={styles.emptyChipText}>{title}</Text>
    </Pressable>
  );
}

/** A tab that is open but not showing: plain icon and label, with its own close button. */
function IdleTab({ label, onPress, onClose }: { label: string; onPress: () => void; onClose: () => void }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="tab"
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.idleTab,
        hover.hovered && { backgroundColor: "rgba(32,91,52,0.06)" },
        press(pressed),
      ]}
    >
      <Image source={vdr.tabDocIdle} contentFit="fill" style={{ width: 16, height: 16 }} />
      <Text numberOfLines={1} style={styles.idleText}>
        {label}
      </Text>
      <TabClose label={label} onClose={onClose} />
    </Pressable>
  );
}

/** The active tab's close button: a white cross inside the green pill, lightening on hover. */
function ActiveTabClose({ label, onClose }: { label: string; onClose: () => void }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Close ${label}`}
      onPress={onClose}
      {...hover.handlers}
      style={[styles.idleClose, hover.hovered && { backgroundColor: "rgba(255,255,255,0.2)" }]}
    >
      <Image source={vdr.tabCloseWhite} contentFit="fill" style={{ width: 14, height: 14 }} />
    </Pressable>
  );
}

/** A tab's own close button: bare at rest, a light green fill on hover (like the drawer's close button). */
function TabClose({ label, onClose }: { label: string; onClose: () => void }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Close ${label}`}
      onPress={(e) => {
        e.stopPropagation?.();
        onClose();
      }}
      {...hover.handlers}
      style={[styles.idleClose, hover.hovered && { backgroundColor: "rgba(32,91,52,0.1)" }]}
    >
      <Image source={vdr.tabClose} contentFit="fill" style={{ width: 14, height: 14 }} />
    </Pressable>
  );
}

/** The longest a tab's label gets before it is cut with an ellipsis. */
const TAB_LABEL_MAX = 90;
// The same side padding on every tab, so equal shares come out as equal widths.
const tabSizing = {
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 0,
  minWidth: 0,
  paddingHorizontal: 6,
  // The web can cap a tab at its own content width; elsewhere tabs simply share the row.
  ...(Platform.OS === "web" ? { maxWidth: "max-content" } : { maxWidth: 140 }),
} as object;

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.white,
    // The header sits 1px in from the top, left and right edges (Figma 35:17509: 498px header in a 500px panel).
    paddingTop: 1,
    paddingHorizontal: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f0f5f4",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  tabs: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6, overflow: "hidden" },
  // Every tab hugs its label (the label is capped, longer names get an ellipsis). When the row is full they all shrink to
  // the same width: each starts from zero, shares the room equally, and stops growing at its own content width.
  tab: {
    ...tabSizing,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.pine800,
    overflow: "hidden",
  },
  // The pale notch on the active tab's left edge: 4px wide, 1px of it clipped.
  tabNotch: {
    position: "absolute",
    left: -1,
    top: 6,
    width: 4,
    height: 16,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  tabText: { flexShrink: 1, minWidth: 0, maxWidth: TAB_LABEL_MAX, fontFamily: fonts.geistMedium, fontSize: 12, lineHeight: 16, letterSpacing: -0.078, color: colors.white },
  idleTab: {
    ...tabSizing,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 28,
    borderRadius: 8,
    ...pointer,
  },
  idleText: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: TAB_LABEL_MAX,
    fontFamily: fonts.geistRegular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.078,
    color: colors.slate600,
  },
  idleClose: { width: 16, height: 16, borderRadius: 4, alignItems: "center", justifyContent: "center", ...pointer },
  close: { width: 24, height: 24, borderRadius: 4, alignItems: "center", justifyContent: "center", ...pointer },
  headerTitle: { fontFamily: fonts.geistMedium, fontSize: 12, lineHeight: 16, color: colors.slate700 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20, paddingHorizontal: 40, paddingBottom: 40 },
  emptyIcon: {
    padding: 8,
    width: 36,
    height: 36,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f5f4",
  },
  emptyTitle: { fontFamily: fonts.geistMedium, fontSize: 12, lineHeight: 16, color: colors.slate800, textAlign: "center" },
  emptyHint: {
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 16,
    color: colors.slate500,
    textAlign: "center",
    maxWidth: 300,
  },
  emptyRule: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 12 },
  emptyChips: { flexDirection: "row", justifyContent: "center", gap: 8 },
  emptyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: "#f0f5f4",
    ...pointer,
  },
  emptyChipDot: { width: 4, height: 4, borderRadius: 100, backgroundColor: colors.pine800 },
  emptyChipText: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 16, color: colors.slate700 },
  body: { paddingHorizontal: 15, paddingTop: 16, gap: 16, paddingBottom: 72 },
  // The artefact frame fills the drawer under the tabs, 15px in from the sides and 16 from the bottom (Figma 88:25334).
  artifactBody: { flex: 1, minHeight: 0, paddingHorizontal: 15, paddingTop: 16, paddingBottom: 16 },
  card: {
    gap: 10,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(225,228,234,0.4)",
    backgroundColor: colors.white,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titleRow: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 4, marginRight: 12 },
  rule: { height: 1, marginHorizontal: -14, backgroundColor: colors.slate100 },
  // A strip down the drawer's left edge; the bar shows while hovering or dragging.
  handle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
    ...(Platform.OS === "web" ? ({ cursor: "col-resize", touchAction: "none" } as object) : null),
  },
  handleBar: { width: 3, height: 40, borderRadius: 2, backgroundColor: colors.slate300, opacity: 0 },
  goWrap: { position: "absolute", left: 0, right: 0, bottom: 16, alignItems: "center" },
  go: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: "rgba(14,18,27,0.9)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 4, height: 4 },
    ...pointer,
  },
  goText: { fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 16, letterSpacing: 0.055, color: colors.white },
});
