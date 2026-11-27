import { ComponentRef, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleSheet, Text, TextStyle, View } from "react-native";
import { colors, fonts } from "../../../../theme";
import { TableBlock, ChartBlock } from "../../../../data/types";
import { useHover } from "../../../../hooks/useHover";
import { pointer } from "../../../../theme/cursor";
import { press, transition } from "../../../../theme/motion";
import { FadeIn } from "../../../../components/assistant/FadeIn";
import { Icon } from "../../../../components/Icon";
import { WithTooltip } from "../../../../components/Tooltip";
import { Citation } from "./Citation";
import { splitCitations } from "./RichText";

/** Text with its `[n]` markers set as citations: the cells and captions of a table or chart carry them too. */
function Cited({ text, style }: { text: string; style?: TextStyle }) {
  return (
    <Text style={style}>
      {splitCitations(text).map((part, i) => (part.numbers ? <Citation key={i} numbers={part.numbers} /> : part.text))}
    </Text>
  );
}

/** The small button at the end of a block's title row. "More" does nothing yet; "Expand" opens the block at full size. */
function BlockButton({ icon, label, onPress }: { icon: "blockExpand" | "blockMore"; label: string; onPress?: () => void }) {
  const hover = useHover();
  return (
    <WithTooltip text={label} side="bottom">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        {...hover.handlers}
        style={({ pressed }) => [hover.hovered && { opacity: 0.7 }, transition(["opacity"]), press(pressed), pointer]}
      >
        <Icon name={icon} size={20} />
      </Pressable>
    </WithTooltip>
  );
}

/* ------------------------------------------------------------------- table */

/** The scroll thumb keeps this far from each end of the table. */
const TRACK_INSET = 12;

/**
 * A table of the note (Figma 940:44818): pale green header, rows ruled at half a pixel, the row name in bold. When it is
 * wider than the card it scrolls sideways: by trackpad or shift-wheel, by dragging it with the mouse, or by the thumb
 * of the small bar under it. A soft shade at an edge says there is more that way.
 */
export function NoteTable({ block }: { block: TableBlock }) {
  const width = block.columns.reduce((sum, c) => sum + c.width, 0);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const [view, setView] = useState(0);
  const [x, setX] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const max = Math.max(0, width - view);
  const scrolls = view > 0 && max > 1;
  const atStart = x <= 1;
  const atEnd = x >= max - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setX(e.nativeEvent.contentOffset.x);
  const dragged = useRef(false);

  // Mouse drag to pan (web): press on the table and pull sideways. A pull that moved is not a click on what was under it.
  const startDrag = (e: { clientX: number; target: EventTarget | null; button?: number }) => {
    if (Platform.OS !== "web" || !scrolls || (e.button ?? 0) !== 0) return;
    const startX = e.clientX;
    const startOffset = x;
    dragged.current = false;
    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      if (!dragged.current && Math.abs(dx) < 4) return;
      dragged.current = true;
      document.body.style.userSelect = "none";
      scroller.current?.scrollTo({ x: startOffset - dx, animated: false });
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.userSelect = "";
      // Let the click that ends the drag pass before presses count again.
      setTimeout(() => (dragged.current = false), 0);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };
  useEffect(() => () => void (Platform.OS === "web" && (document.body.style.userSelect = "")), []);

  const trackW = Math.max(0, view - 2 * TRACK_INSET);
  const thumbW = scrolls ? Math.max(24, (view / width) * trackW) : 0;
  const thumbX = scrolls ? (x / max) * (trackW - thumbW) : 0;

  return (
    <View style={styles.block}>
      <View style={styles.titleRow}>
        <Text style={styles.tableTitle}>{block.title}</Text>
        <BlockButton icon="blockExpand" label="Expand table" onPress={() => setExpanded(true)} />
      </View>
      <View
        // The right edge is open while there is more to scroll to, as in the design, and closes with a stroke at the end.
        style={[styles.tableFrame, scrolls && ({ cursor: "grab" } as object), scrolls && !atEnd && { borderRightColor: "transparent" }]}
        onLayout={(e: LayoutChangeEvent) => setView(e.nativeEvent.layout.width)}
        {...(Platform.OS === "web"
          ? ({
              onMouseDown: startDrag,
              onClickCapture: (e: { stopPropagation: () => void }) => {
                if (dragged.current) e.stopPropagation();
              },
            } as object)
          : null)}
      >
        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentContainerStyle={{ minWidth: "100%" }}
        >
          <View style={{ width, minWidth: "100%" }}>
            <View style={[styles.tr, { backgroundColor: colors.dew75 }]}>
              {block.columns.map((c) => (
                <View key={c.label} style={[styles.td, { width: c.width }]}>
                  <Text style={[styles.cell, { fontFamily: fonts.geistMedium }]}>{c.label}</Text>
                </View>
              ))}
            </View>
            {block.rows.map((row, r) => (
              <View key={r} style={[styles.tr, r < block.rows.length - 1 && styles.rule]}>
                {row.map((cell, c) => (
                  <View key={c} style={[styles.td, { width: block.columns[c].width }]}>
                    <Cited text={cell} style={c === 0 ? { ...styles.cell, fontFamily: fonts.geistSemiBold } : styles.cell} />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
        {/* Shade at each edge that has more beyond it; it fades away at the end. */}
        <View pointerEvents="none" style={[styles.shade, styles.shadeRight, { opacity: scrolls && !atEnd ? 1 : 0 }]} />
        <View pointerEvents="none" style={[styles.shade, styles.shadeLeft, { opacity: scrolls && !atStart ? 1 : 0 }]} />
        {scrolls && (
          <View pointerEvents="none" style={styles.track}>
            <View style={[styles.thumb, { width: thumbW, transform: [{ translateX: thumbX }] }]} />
          </View>
        )}
      </View>
      {expanded && <ExpandedTable block={block} onClose={() => setExpanded(false)} />}
    </View>
  );
}

/**
 * The table at full size, as the citation's full-size view is: a panel over a dimmed, blurred app with the title and a
 * collapse button in its header. The columns grow to fill the panel, and it scrolls both ways when it needs to.
 * Escape, the collapse button or a click outside the panel put it away. Web only (it is drawn on the page body).
 */
function ExpandedTable({ block, onClose }: { block: TableBlock; onClose: () => void }) {
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  const hover = useHover();
  if (Platform.OS !== "web") return null;
  return createPortal(
    <FadeIn rise={0} duration={180} style={full.layer as object}>
      <Pressable accessibilityLabel="Close full-size view" onPress={onClose} style={full.backdrop as object} />
      <FadeIn rise={10} duration={220} style={full.panel as object}>
        <View style={full.header}>
          <Text style={full.title}>{block.title}</Text>
          <WithTooltip text="Collapse" side="bottom">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Collapse"
              onPress={onClose}
              {...hover.handlers}
              style={({ pressed }) => [full.button, hover.hovered && full.buttonHover, transition(["background-color"]), press(pressed), pointer]}
            >
              <Icon name="expandedCollapse" size={18} />
            </Pressable>
          </WithTooltip>
        </View>
        <ScrollView style={full.well} contentContainerStyle={{ minWidth: "100%" }} showsVerticalScrollIndicator={false}>
          <View>
            <View style={{ width: "100%" }}>
              <View style={[styles.tr, { backgroundColor: colors.dew75 }]}>
                {block.columns.map((c) => (
                  <View key={c.label} style={[styles.td, full.td, { flexGrow: c.width, flexShrink: 1, flexBasis: c.width, minWidth: 0 }]}>
                    <Text style={[styles.cell, full.cell, { fontFamily: fonts.geistMedium }]}>{c.label}</Text>
                  </View>
                ))}
              </View>
              {block.rows.map((row, r) => (
                <View key={r} style={[styles.tr, r < block.rows.length - 1 && styles.rule]}>
                  {row.map((cell, c) => (
                    <View key={c} style={[styles.td, full.td, { flexGrow: block.columns[c].width, flexShrink: 1, flexBasis: block.columns[c].width, minWidth: 0 }]}>
                      <Cited text={cell} style={c === 0 ? { ...styles.cell, ...full.cell, fontFamily: fonts.geistSemiBold } : { ...styles.cell, ...full.cell }} />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </FadeIn>
    </FadeIn>,
    document.body,
  );
}

const full = StyleSheet.create({
  layer: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 } as object,
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)" } as object,
  panel: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f2f5f8",
    backgroundColor: colors.white,
    overflow: "hidden",
  } as object,
  header: { height: 48, padding: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: fonts.geistMedium, fontSize: 16, lineHeight: 20, letterSpacing: 0.192, color: "#222530" },
  button: { width: 32, height: 32, padding: 4, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f7fa" },
  buttonHover: { backgroundColor: "#e1e4ea" },
  well: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: colors.slate200 },
  td: { paddingHorizontal: 16, paddingVertical: 12 },
  cell: { fontSize: 13, lineHeight: 20 },
});

/* ------------------------------------------------------------------- chart */

const INFO_600 = "#3559e9";
const INFO_200 = "#c0d5ff";
const PLOT_H = 112;
const AXIS_W = 20;
const BAR_W = 36;

/**
 * A column chart of the note, in the look of Figma 940:49601 (pale plot, blue marks): one column per bar with its value
 * above it and its label beneath, ruled at each tick of the value axis, which runs up the left.
 */
export function NoteChart({ block }: { block: ChartBlock }) {
  const { max, step, unit } = block.axis;
  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(v);
  const at = (v: number) => (v / max) * PLOT_H;
  return (
    <View style={[styles.block, { paddingHorizontal: 2 }]}>
      <View style={styles.titleRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.chartTitle}>{block.title}</Text>
          <Cited text={block.subtitle} style={styles.chartSub} />
        </View>
        <BlockButton icon="blockMore" label="More" />
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {/* The value axis: each label is centred on its rule. */}
        <View style={{ width: AXIS_W, height: PLOT_H }}>
          {ticks.map((v) => (
            <Text key={v} style={[styles.axis, { position: "absolute", right: 0, bottom: at(v) - 7 }]}>
              {`${v}${unit}`}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.plot}>
            {ticks.map((v) => (
              <View key={v} style={[styles.grid, { bottom: at(v) }]} />
            ))}
            <View style={styles.columns}>
              {block.bars.map((bar) => (
                <View key={bar.label} style={styles.column}>
                  <Text style={[styles.value, { fontFamily: bar.strong ? fonts.geistSemiBold : fonts.geistRegular }]}>
                    {`${bar.value}${unit}`}
                  </Text>
                  <View
                    style={{
                      width: BAR_W,
                      height: at(bar.value),
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                      backgroundColor: bar.strong ? INFO_600 : INFO_200,
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
          <View style={styles.columns}>
            {block.bars.map((bar) => (
              <Text key={bar.label} style={[styles.axis, styles.column, { textAlign: "center" }]}>
                {bar.label}
              </Text>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.facts}>
        {block.facts.map((f) => (
          <Text key={f.lead} style={styles.fact}>
            <Text style={{ fontFamily: fonts.geistSemiBold }}>{f.lead}</Text>
            {` ${f.text}`}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tableTitle: { flex: 1, fontFamily: fonts.geistSemiBold, fontSize: 12, lineHeight: 18, color: colors.slate700 },
  tableFrame: { borderWidth: 1, borderColor: colors.slate200, borderRadius: 8, overflow: "hidden", ...transition(["border-right-color"], 160) },
  shade: { position: "absolute", top: 0, bottom: 0, width: 20, ...transition(["opacity"], 160) },
  shadeRight: { right: 0, backgroundImage: "linear-gradient(to right, rgba(34,37,48,0), rgba(34,37,48,0.04))" } as object,
  shadeLeft: { left: 0, backgroundImage: "linear-gradient(to left, rgba(34,37,48,0), rgba(34,37,48,0.04))" } as object,
  track: { position: "absolute", left: TRACK_INSET, right: TRACK_INSET, bottom: 1 },
  thumb: { height: 4, borderRadius: 100, backgroundColor: colors.slate300 },
  tr: { flexDirection: "row", alignItems: "stretch" },
  rule: { borderBottomWidth: 0.5, borderBottomColor: colors.slate200 },
  td: { paddingHorizontal: 10, paddingVertical: 8 },
  cell: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 16, letterSpacing: 0.055, color: colors.slate800 },
  chartTitle: { fontFamily: fonts.geistSemiBold, fontSize: 11, lineHeight: 16, color: colors.slate800 },
  chartSub: { fontFamily: fonts.geistRegular, fontSize: 10, lineHeight: 14, letterSpacing: 0.05, color: colors.slate600 },
  axis: { fontFamily: fonts.geistRegular, fontSize: 10, lineHeight: 14, color: colors.slate600 },
  plot: {
    height: PLOT_H,
    backgroundColor: colors.slate50,
    borderWidth: 0.5,
    borderColor: colors.dew100,
    borderRadius: 6,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  grid: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: colors.slate200, opacity: 0.8 },
  columns: { flexDirection: "row", justifyContent: "space-around" },
  column: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
  value: { fontSize: 10, lineHeight: 14, color: colors.slate800 },
  facts: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 8 },
  fact: { fontFamily: fonts.geistRegular, fontSize: 10, lineHeight: 14, color: colors.slate800 },
});
