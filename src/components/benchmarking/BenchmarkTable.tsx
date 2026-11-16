import { ReactNode, useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import {
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, fonts } from "../../theme";
import {
  benchmarkColumns,
  Cell,
  Company,
  Trend,
} from "../../data/benchmarking";
import { Icon } from "../Icon";
import { pointer } from "../../theme/cursor";
import { press, transition } from "../../theme/motion";
import { useHover } from "../../hooks/useHover";
import { WithTooltip } from "../Tooltip";
import { useTextSize } from "../../state/textSize";

const NAME_W = 219;
const HEADER_H = 69;
const COMPANY_H = 34;
const STAT_H = 40;
const TITLE_H = 32;
/** White space between two rows, with the 1px hairline centred in it (Figma 499:17736: a 34px row, 2px, line, 2px). */
const ROW_GAP = 4;
/** The grey 1px lines in the header: between the name column and the metrics, between column groups and between sub-columns. The body has none. */
const GUTTER = colors.slate200;

/** Total width of the scrolling metric columns: each group's leaf columns plus 1px between groups. */
const MID_W =
  benchmarkColumns.reduce(
    (sum, g) => sum + g.subs.reduce((s, c) => s + c.width, 0),
    0,
  ) +
  (benchmarkColumns.length - 1);

/** Currency unit of the Market cap and EV columns. 1 Cr = 10 Mn. */
export type Unit = "Mn" | "Cr";

/** Re-expresses a figure given in ₹ Mn in the chosen unit (e.g. 1,553 Mn is 155.3 Cr). */
function inUnit(text: string, unit: Unit): string {
  if (unit === "Mn") return text;
  const n = parseFloat(text.replace(/,/g, ""));
  if (Number.isNaN(n)) return text;
  return (n / 10).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/**
 * Horizontal scrolling shared by several tables: scrolling the metric columns of one moves the others to the
 * same offset. Create one with `createScrollGroup()` and pass it to each table.
 */
export type ScrollGroup = {
  /** Adds a table's scroller; it starts at the group's current offset. */
  register: (view: ScrollViewInstance) => void;
  /** Reports a scroller's offset; the others are moved to match. */
  moved: (x: number) => void;
};
export function createScrollGroup(): ScrollGroup {
  const views = new Set<ScrollViewInstance>();
  let current = 0;
  return {
    register(view) {
      views.add(view);
      if (current) view.scrollTo({ x: current, animated: false });
    },
    moved(x) {
      // Moving the others fires their own scroll events at this same offset, which stops here.
      if (Math.abs(x - current) < 0.5) return;
      current = x;
      views.forEach((v) => v.scrollTo({ x, animated: false }));
    },
  };
}

export type TableItem =
  | { type: "header" }
  | { type: "gap"; height: number }
  | { type: "title"; text: string }
  | { type: "company"; company: Company }
  | { type: "stat"; label: string; values: string[] };

type Props = {
  items: TableItem[];
  /** Adds a fixed 36px column on the right with a chevron on each company row (Figma 499:16408). */
  rowAction?: boolean;
  /** Keeps this table's horizontal scroll in step with the other tables in the group. */
  scrollGroup?: ScrollGroup;
  /** Unit for the Market cap and EV columns. */
  unit?: Unit;
};

/** A design height grown in proportion to the text size, like the column widths, so rows keep their padding. */
const grow = (px: number, scale: number) => Math.round(px * scale);
/** One header row (a group title or the sub-columns) at this text size; the header is two of them and a 1px gutter. */
const headerRow = (scale: number) => grow(34, scale);
const headerHeight = (scale: number) => headerRow(scale) * 2 + 1;

const heightOf = (item: TableItem, scale: number) =>
  item.type === "header"
    ? headerHeight(scale)
    : item.type === "gap"
      ? grow(item.height, scale)
      : item.type === "title"
        ? grow(TITLE_H, scale)
        : item.type === "company"
          ? grow(COMPANY_H, scale)
          : grow(STAT_H, scale);

/**
 * Comparison table (Figma 373:23715). Three lanes share one list of fixed-height items so rows line up: the
 * company name column on the left, the metric columns in a horizontal scroller in the middle, and a fixed
 * actions column on the right with a soft edge shadow. Group titles are drawn over all three lanes.
 */
export function BenchmarkTable({
  items,
  rowAction = false,
  unit = "Mn",
  scrollGroup,
}: Props) {
  // Columns grow with the text size (in proportion, for now) so figures and headers keep their room.
  const { scale } = useTextSize();
  // Once the metrics have moved, the name column gets an edge shadow to show it is pinned over them.
  const [scrolled, setScrolled] = useState(false);
  const scroller = useRef<ScrollViewInstance | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => void (settle.current && clearTimeout(settle.current)),
    [],
  );
  // A thin rule separates a row from the row above it (not from a header, title or gap).
  const ruled = (i: number) => {
    const here = items[i].type;
    const prev = items[i - 1]?.type;
    return (
      (here === "company" || here === "stat") &&
      (prev === "company" || prev === "stat")
    );
  };
  // Each row sits ROW_GAP below the row above it; the hairline lives in that gap.
  const rowGap = grow(ROW_GAP, scale);
  const heights = items.map(
    (item, i) => heightOf(item, scale) + (ruled(i) ? rowGap : 0),
  );
  // Top edge of each item: the sum of the heights above it.
  const titleTops = items.map((_, i) =>
    heights.slice(0, i).reduce((sum, h) => sum + h, 0),
  );

  const lane = (render: (item: TableItem, i: number) => ReactNode) =>
    items.map((item, i) => {
      const body =
        item.type === "gap" || item.type === "title" ? null : render(item, i);
      return (
        <View
          key={i}
          style={[{ height: heights[i] }, ruled(i) && { paddingTop: rowGap }]}
        >
          {ruled(i) && (
            <View
              pointerEvents="none"
              style={[styles.rule, { top: (rowGap - 1) / 2 }]}
            />
          )}
          {body}
        </View>
      );
    });

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.nameLane,
          { width: Math.round(NAME_W * scale) },
          scrolled && styles.nameLaneScrolled,
        ]}
      >
        {lane((item) =>
          item.type === "header" ? (
            <View style={styles.nameHead}>
              <Text style={styles.headText}>Company name</Text>
            </View>
          ) : item.type === "company" ? (
            <View style={styles.nameCell}>
              <Logo company={item.company} />
              <Text numberOfLines={1} style={styles.nameText}>
                {item.company.name}
              </Text>
            </View>
          ) : item.type === "stat" ? (
            <View style={styles.nameCell}>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ) : null,
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroller}
        contentContainerStyle={styles.scrollerContent}
        scrollEventThrottle={16}
        ref={(view) => {
          scroller.current = view;
          if (scrollGroup && view) scrollGroup.register(view);
        }}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          setScrolled(x > 1);
          // Scroll events are throttled and the last one can be dropped (e.g. when another table moves this one
          // back to 0), so read the real offset once scrolling has stopped.
          if (settle.current) clearTimeout(settle.current);
          settle.current = setTimeout(() => {
            const node = (
              scroller.current as unknown as {
                getScrollableNode?: () => HTMLElement;
              } | null
            )?.getScrollableNode?.();
            if (node) setScrolled(node.scrollLeft > 1);
          }, 100);
          scrollGroup?.moved(x);
        }}
      >
        {/* At the design width the columns are exactly as drawn; wider, they share the extra space. */}
        <View style={[styles.mid, { minWidth: Math.round(MID_W * scale) }]}>
          {lane((item) =>
            item.type === "header" ? (
              <MetricHeader scale={scale} />
            ) : item.type === "company" ? (
              <MetricRow cells={item.company.cells} unit={unit} scale={scale} />
            ) : item.type === "stat" ? (
              <MetricRow
                scale={scale}
                cells={item.values.map((text) => ({ text }))}
                unit={unit}
                stat
              />
            ) : null,
          )}
        </View>
      </ScrollView>

      {rowAction && (
        <View style={styles.actions}>
          {lane((item) =>
            item.type === "header" ? (
              <View style={styles.actionsHead} />
            ) : item.type === "company" ? (
              <RowChevron company={item.company.name} />
            ) : null,
          )}
        </View>
      )}

      {/* Group titles sit over all three lanes. */}
      {items.map((item, i) =>
        item.type === "title" ? (
          <View
            key={`t${i}`}
            style={[
              styles.title,
              { top: titleTops[i], height: grow(TITLE_H, scale) },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.titleText}>{item.text}</Text>
          </View>
        ) : null,
      )}
    </View>
  );
}

function MetricHeader({ scale }: { scale: number }) {
  const row = headerRow(scale);
  return (
    <View style={[styles.metricHeader, { height: headerHeight(scale) }]}>
      {benchmarkColumns.map((group) => {
        const width = group.subs.reduce((s, c) => s + c.width, 0);
        return (
          <View
            key={group.title}
            style={[
              styles.group,
              { flexGrow: width, flexBasis: width * scale },
            ]}
          >
            <View style={[styles.groupTitle, { height: row }]}>
              <Text style={styles.headText}>{group.title}</Text>
            </View>
            <View style={[styles.subRow, { height: row }]}>
              {group.subs.map((sub, si) => (
                <View
                  key={sub.label}
                  style={[
                    styles.subCell,
                    {
                      height: row,
                      flexGrow: sub.width,
                      flexBasis: sub.width * scale,
                    },
                    si < group.subs.length - 1 && styles.subDivider,
                  ]}
                >
                  <Text
                    style={[
                      styles.headText,
                      sub.label.startsWith("As of") && styles.asOf,
                    ]}
                  >
                    {sub.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function MetricRow({
  cells,
  stat,
  unit,
  scale,
}: {
  scale: number;
  cells: Cell[];
  stat?: boolean;
  unit: Unit;
}) {
  const widths = benchmarkColumns.flatMap((g) => g.subs.map((s) => s.width));
  // Group starts get the 1px gutter the header has between groups.
  const gutter = new Set<number>();
  let n = 0;
  benchmarkColumns.forEach((g, gi) => {
    if (gi > 0) gutter.add(n);
    n += g.subs.length;
  });
  return (
    <View style={styles.metricRow}>
      {cells.map((cell, i) => (
        <View
          key={i}
          style={[
            styles.metricCell,
            { flexGrow: widths[i], flexBasis: widths[i] * scale },
            gutter.has(i) && { marginLeft: 1 },
          ]}
        >
          <Text
            style={[
              stat ? styles.statValue : styles.value,
              !stat && { color: TREND_COLOR[cell.trend ?? "up"] },
            ]}
          >
            {i < 2 ? inUnit(cell.text, unit) : cell.text}
          </Text>
          {!stat && cell.trend && <TrendMark trend={cell.trend} />}
        </View>
      ))}
    </View>
  );
}

const TREND_COLOR: Record<Trend, string> = {
  down: "#d02533",
  up: "#22733e",
  flat: "#a78025",
};

function TrendMark({ trend }: { trend: Trend }) {
  const color = TREND_COLOR[trend];
  if (trend === "flat")
    return <Text style={[styles.approx, { color }]}>≈</Text>;
  return (
    <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
      <Path
        d={
          trend === "up"
            ? "M6 10.5V2M2.8 5.2L6 2l3.2 3.2"
            : "M6 1.5V10M2.8 6.8L6 10l3.2-3.2"
        }
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Logo({ company }: { company: Company }) {
  const { source, radius } = company.logo;
  return (
    <Image
      source={source}
      contentFit="cover"
      style={[styles.logo, { borderRadius: radius }]}
    />
  );
}

/** The "more" (three dots) icon, as drawn in Figma at 28px. */
export function DotsIcon() {
  return <Icon name="tableMore" size={28} style={pointer} />;
}

/** Chevron at the end of a company row: opens that company's details. Shows a tooltip on hover. */
function RowChevron({ company }: { company: string }) {
  const hover = useHover();
  return (
    <View style={styles.actionsCell}>
      <WithTooltip text="Company details" side="bottom">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View details for ${company}`}
          {...hover.handlers}
          style={({ pressed }) => [
            styles.chevron,
            hover.hovered && styles.chevronHover,
            press(pressed),
          ]}
        >
          <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <Path
              d="M6 3.5L10.5 8L6 12.5"
              stroke={hover.hovered ? colors.pine800 : colors.slate600}
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      </WithTooltip>
    </View>
  );
}

const text = {
  fontFamily: fonts.geistRegular,
  fontSize: 11,
  lineHeight: 18,
  letterSpacing: 0.08,
  // Figures change when the unit flips between Mn and Cr, so keep digit widths equal.
  fontVariant: ["tabular-nums"],
} as const;

const styles = StyleSheet.create({
  root: { flexDirection: "row", width: "100%", position: "relative" },
  nameLane: {
    width: NAME_W,
    backgroundColor: colors.white,
    zIndex: 2,
    boxShadow: "2px 0px 4px rgba(0,0,0,0)",
    ...transition(["box-shadow"], 200),
  },
  nameLaneScrolled: { boxShadow: "2px 0px 4px rgba(0,0,0,0.08)" },
  scroller: { flex: 1, minWidth: 0 },
  scrollerContent: { flexGrow: 1 },
  mid: { flexGrow: 1, minWidth: MID_W },
  rule: {
    position: "absolute",
    left: 0,
    right: 0,
    top: (ROW_GAP - 1) / 2,
    height: 1,
    backgroundColor: colors.slate100,
  },
  nameHead: {
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: colors.slate100,
    borderRightWidth: 1,
    borderRightColor: GUTTER,
  },
  headText: { ...text, color: colors.slate800 },
  nameCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  nameText: { ...text, color: colors.slate800, flexShrink: 1 },
  statLabel: {
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.08,
    color: "#0e121b",
  },
  logo: { width: 16, height: 16 },
  metricHeader: {
    flexDirection: "row",
    gap: 1,
    height: HEADER_H,
    // The 1px gutters between the column groups show this grey, not white (sampled from Figma 507:14578).
    backgroundColor: GUTTER,
  },
  group: { backgroundColor: colors.slate100, gap: 1 },
  groupTitle: {
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ebeef3",
  },
  subRow: { height: 34, flexDirection: "row" },
  subCell: {
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.slate100,
  },
  subDivider: { borderRightWidth: 1, borderRightColor: GUTTER },
  asOf: { fontSize: 10 },
  metricRow: { flexDirection: "row", height: "100%" },
  metricCell: {
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  value: text,
  statValue: {
    fontVariant: ["tabular-nums"],
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.08,
    color: "#0e121b",
  },
  approx: { ...text, fontSize: 12 },
  actions: {
    width: 36,
    backgroundColor: colors.white,
    boxShadow: "-2px 0px 4px rgba(0,0,0,0.04)",
    zIndex: 2,
  },
  actionsHead: { height: "100%", backgroundColor: colors.slate100 },
  actionsCell: { flex: 1, alignItems: "center", justifyContent: "center" },
  chevron: {
    width: 28,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
    ...transition(["background-color"]),
  },
  chevronHover: { backgroundColor: colors.slate100 },
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    height: TITLE_H,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: "#f0f5f4",
    zIndex: 3,
  },
  titleText: { ...text, color: colors.slate600 },
});
