import { ReactNode } from "react";
import { ScrollView, ScrollViewInstance, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { colors, fonts } from "../../theme";
import { benchmarkColumns, Cell, Company, Trend } from "../../data/benchmarking";
import { Icon } from "../Icon";
import { pointer } from "../../theme/cursor";

const NAME_W = 219;
const HEADER_H = 69;
const COMPANY_H = 34;
const STAT_H = 40;
const TITLE_H = 32;

/** Total width of the scrolling metric columns: each group's leaf columns plus 1px between groups. */
const MID_W =
  benchmarkColumns.reduce(
    (sum, g) => sum + g.subs.reduce((s, c) => s + c.width, 0),
    0,
  ) +
  (benchmarkColumns.length - 1);

/** Currency unit of the Market cap and EV columns. 1 Cr = 10 Mn. */
export type Unit = 'Mn' | 'Cr';

/** Re-expresses a figure given in ₹ Mn in the chosen unit (e.g. 1,553 Mn is 155.3 Cr). */
function inUnit(text: string, unit: Unit): string {
  if (unit === 'Mn') return text;
  const n = parseFloat(text.replace(/,/g, ''));
  if (Number.isNaN(n)) return text;
  return (n / 10).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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
  /** Width of the fixed actions column: 50 holds the notes icon, 76 adds the "more" menu. */
  actionsWidth: 50 | 76;
  /** Keeps this table's horizontal scroll in step with the other tables in the group. */
  scrollGroup?: ScrollGroup;
  /** Unit for the Market cap and EV columns. */
  unit?: Unit;
  /** Shows the expand and "more" icons in the actions column's header (revealed while the table is hovered). */
  headerIcons?: boolean;
};

const heightOf = (item: TableItem) =>
  item.type === "header"
    ? HEADER_H
    : item.type === "gap"
      ? item.height
      : item.type === "title"
        ? TITLE_H
        : item.type === "company"
          ? COMPANY_H
          : STAT_H;

/**
 * Comparison table (Figma 373:23715). Three lanes share one list of fixed-height items so rows line up: the
 * company name column on the left, the metric columns in a horizontal scroller in the middle, and a fixed
 * actions column on the right with a soft edge shadow. Group titles are drawn over all three lanes.
 */
export function BenchmarkTable({ items, actionsWidth, headerIcons, unit = 'Mn', scrollGroup }: Props) {
  // A thin rule separates a row from the row above it (not from a header, title or gap).
  const ruled = (i: number) => {
    const here = items[i].type;
    const prev = items[i - 1]?.type;
    return (here === "company" || here === "stat") && (prev === "company" || prev === "stat");
  };
  // Top edge of each item: the sum of the heights above it.
  const titleTops = items.map((_, i) =>
    items.slice(0, i).reduce((sum, item) => sum + heightOf(item), 0),
  );

  const lane = (render: (item: TableItem, i: number) => ReactNode) =>
    items.map((item, i) => {
      const body = item.type === "gap" || item.type === "title" ? null : render(item, i);
      return (
        <View
          key={i}
          style={[
            { height: heightOf(item) },
            ruled(i) && styles.rule,
          ]}
        >
          {body}
        </View>
      );
    });

  return (
    <View style={styles.root}>
      <View style={{ width: NAME_W }}>
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
          if (scrollGroup && view) scrollGroup.register(view);
        }}
        onScroll={(e) => scrollGroup?.moved(e.nativeEvent.contentOffset.x)}
      >
        {/* At the design width the columns are exactly as drawn; wider, they share the extra space. */}
        <View style={styles.mid}>
          {lane((item) =>
            item.type === "header" ? (
              <MetricHeader />
            ) : item.type === "company" ? (
              <MetricRow cells={item.company.cells} unit={unit} />
            ) : item.type === "stat" ? (
              <MetricRow
                cells={item.values.map((text) => ({ text }))}
                unit={unit}
                stat
              />
            ) : null,
          )}
        </View>
      </ScrollView>

      <View style={[styles.actions, { width: actionsWidth }]}>
        {lane((item) =>
          item.type === "header" ? (
            <View style={styles.actionsHead}>
              {headerIcons && (
                <View style={styles.headIcons}>
                  <Icon name="tableExpand" size={28} style={pointer} />
                  <DotsIcon />
                </View>
              )}
            </View>
          ) : item.type === "company" ? (
            <View style={styles.actionsCell}>
              <NoteIcon dot={item.company.note} />
              {actionsWidth === 76 && <DotsIcon />}
            </View>
          ) : null,
        )}
      </View>

      {/* Group titles sit over all three lanes. */}
      {items.map((item, i) =>
        item.type === "title" ? (
          <View
            key={`t${i}`}
            style={[styles.title, { top: titleTops[i] }]}
            pointerEvents="none"
          >
            <Text style={styles.titleText}>{item.text}</Text>
          </View>
        ) : null,
      )}
    </View>
  );
}

function MetricHeader() {
  return (
    <View style={styles.metricHeader}>
      {benchmarkColumns.map((group) => {
        const width = group.subs.reduce((s, c) => s + c.width, 0);
        return (
          <View key={group.title} style={[styles.group, { flexGrow: width, flexBasis: width }]}>
            <View style={styles.groupTitle}>
              <Text style={styles.headText}>{group.title}</Text>
            </View>
            <View style={styles.subRow}>
              {group.subs.map((sub, si) => (
                <View
                  key={sub.label}
                  style={[
                    styles.subCell,
                    { flexGrow: sub.width, flexBasis: sub.width },
                    si < group.subs.length - 1 && styles.subDivider,
                  ]}
                >
                  <Text style={[styles.headText, sub.label.startsWith("As of") && styles.asOf]}>
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

function MetricRow({ cells, stat, unit }: { cells: Cell[]; stat?: boolean; unit: Unit }) {
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
            { flexGrow: widths[i], flexBasis: widths[i] },
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
        d={trend === "up" ? "M6 10.5V2M2.8 5.2L6 2l3.2 3.2" : "M6 1.5V10M2.8 6.8L6 10l3.2-3.2"}
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Logo({ company }: { company: Company }) {
  const { bg, fg, mark } = company.logo;
  return (
    <View style={[styles.logo, { backgroundColor: bg }]}>
      <Text style={[styles.logoMark, { color: fg }]}>{mark}</Text>
    </View>
  );
}

/** Notes icon (a page with lines); the red dot marks unread notes. */
function NoteIcon({ dot }: { dot?: boolean }) {
  return (
    <View style={styles.noteWrap}>
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Rect x={3} y={2.5} width={12} height={13} rx={2} stroke={colors.slate600} strokeWidth={1.1} />
        <Path d="M6 6.5h6M6 9h6M6 11.5h3.5" stroke={colors.slate600} strokeWidth={1.1} strokeLinecap="round" />
      </Svg>
      {dot && <View style={styles.noteDot} />}
    </View>
  );
}

/** The "more" (three dots) icon, as drawn in Figma at 28px. */
export function DotsIcon() {
  return <Icon name="tableMore" size={28} style={pointer} />;
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
  scroller: { flex: 1, minWidth: 0 },
  scrollerContent: { flexGrow: 1 },
  mid: { flexGrow: 1, minWidth: MID_W },
  rule: { borderTopWidth: 1, borderTopColor: colors.slate100 },
  nameHead: {
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: colors.slate100,
    borderRightWidth: 1,
    borderRightColor: colors.white,
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
  logo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoMark: { fontFamily: fonts.geistSemiBold, fontSize: 8, lineHeight: 10 },
  metricHeader: { flexDirection: "row", gap: 1, height: HEADER_H },
  group: { backgroundColor: colors.slate100, gap: 1 },
  groupTitle: {
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(225,228,234,0.4)",
  },
  subRow: { height: 34, flexDirection: "row" },
  subCell: { height: 34, alignItems: "center", justifyContent: "center" },
  subDivider: { borderRightWidth: 1, borderRightColor: colors.white },
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
    backgroundColor: colors.white,
    boxShadow: "-2px 0px 4px rgba(0,0,0,0.04)",
    zIndex: 2,
  },
  actionsHead: {
    height: "100%",
    backgroundColor: colors.slate100,
    alignItems: "center",
    justifyContent: "center",
  },
  headIcons: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionsCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    paddingHorizontal: 0,
  },
  noteWrap: { width: 18, height: 18, ...pointer },
  noteDot: {
    position: "absolute",
    top: -2,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#e5333f",
    borderWidth: 1,
    borderColor: colors.white,
  },
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
