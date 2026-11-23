import { ComponentRef, ReactNode, useRef, useState } from "react";
import { Image } from "expo-image";
import {
  Platform,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, fonts } from "../../theme";
import {
  benchmarkColumns,
  CellSource,
  Cell,
  cellCitation,
  Company,
  rowCitation,
  RowKind,
  TableId,
  Trend,
} from "../../data/benchmarking";
import { Icon } from "../Icon";
import { pointer } from "../../theme/cursor";
import { press, transition } from "../../theme/motion";
import { useHover } from "../../hooks/useHover";
import { WithTooltip } from "../Tooltip";
import { useTextSize } from "../../state/textSize";
import { useSourceCard } from "./SourceCard";
import { OVERWRITE, useBenchmarkCitation } from "../../state/benchmarkCitation";
import { useAssistantOverlay } from "../../state/assistantOverlay";
import { CITATION_TARGETS, cellId } from "./citationTargets";

/**
 * Comparison table, set out like a spreadsheet (Figma "Benchmarking", 829:2892 and the toggle-on states 829:6550,
 * 829:8429, 829:10779): column letters across the top, row numbers down the left, hairline borders on every cell and a
 * header of two tiers with "Company name" merged across both. The row numbers and the company column stay put while the
 * metric columns scroll sideways (`position: sticky`). With citations on, a small corner flag marks every sourced
 * figure (amber when the sources agree, red when they disagree) and hovering one opens the card of its sources. A flag
 * on a row number marks a sourced row; like the others it shows only while citations are on.
 */

const ROW_NUM_W = 36;
const NAME_W = 219;
const ACTION_W = 36;
const LETTER_H = 28;
const TIER_H = 30;
const BAND_H = 30;
const ROW_H = 32;

/**
 * Strokes and fills as in the Figma table (905:10413): the header, letters and row numbers sit on slate 50 with slate 200
 * lines; the body cells are white with the fainter slate 100 lines; a section band is pine 25.
 */
const LINE = colors.slate200;
const BODY_LINE = colors.slate100;
const HEAD = colors.slate50;
const SUB = colors.slate50;
const BAND = "#f0f5f4";
/** Hover tint of a sourced figure or row: a pale amber, also where the sources disagree (Figma 829:8429, 829:18458). */
const TINT = "#fffaeb";
/** The figure whose citation drawer is open. */
const ACTIVE = colors.neutralChipBg;
/** Corner flags: the library's amber, and a deep red for conflicts. */
const FLAG = "#ffd268";
const FLAG_CONFLICT = "#ad1f2b";

const LEAF_WIDTHS = benchmarkColumns.flatMap((g) => g.subs.map((s) => s.width));
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/** The Figma rows (905:10476) carry the arrow only beside the EBITDA margin figures (leaf columns 7 and 8). */
const ARROW_COLS = new Set([7, 8]);

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
  | { type: "title"; text: string }
  | { type: "company"; company: Company }
  | { type: "stat"; label: string; values: string[] };

type Props = {
  items: TableItem[];
  /** Adds a fixed 36px column at the right end with a chevron on each company row (Figma 499:16408). */
  rowAction?: boolean;
  /** Keeps this table's horizontal scroll in step with the other tables in the group. */
  scrollGroup?: ScrollGroup;
  /** Unit for the Market cap and EV columns. */
  unit?: Unit;
  /** Which table this is, so its figures get their own sources. */
  table: TableId;
  /** The number of the first row; the second table carries on from the first (3 rows in the overall table, so 4). */
  rowStart?: number;
  /** Citations toggle: corner flags on the sourced figures and the source card on hover. */
  citations?: boolean;
};

/** A design size grown in proportion to the text size, like the column widths, so rows keep their padding. */
const grow = (px: number, scale: number) => Math.round(px * scale);

/** Sticky is web-only; on native the pinned columns simply scroll with the rest. */
const sticky = (extra: ViewStyle): ViewStyle =>
  (Platform.OS === "web" ? { position: "sticky", ...extra } : extra) as ViewStyle;

export function BenchmarkTable({
  items,
  rowAction = false,
  unit = "Mn",
  scrollGroup,
  table,
  rowStart = 1,
  citations = false,
}: Props) {
  const { scale } = useTextSize();
  const scroller = useRef<ScrollViewInstance | null>(null);
  // The row whose number is hovered: the whole row takes the tint.
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  const rn = ROW_NUM_W;
  const nameW = grow(NAME_W, scale);
  const leaf = LEAF_WIDTHS.map((w) => w * scale);
  const midW = leaf.reduce((a, b) => a + b, 0);
  const actionW = rowAction ? ACTION_W : 0;
  const totalW = rn + nameW + midW + actionW;

  // Row numbers and citation row indexes (company and stat rows only).
  let number = rowStart;
  let dataRow = 0;
  const rows = items.map((item) => {
    if (item.type === "header") return { item, number: null, dataRow: null };
    const n = number++;
    if (item.type === "title") return { item, number: n, dataRow: null };
    return { item, number: n, dataRow: dataRow++ };
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      scrollEventThrottle={16}
      ref={(view) => {
        scroller.current = view;
        if (scrollGroup && view) scrollGroup.register(view);
      }}
      onScroll={(e) => scrollGroup?.moved(e.nativeEvent.contentOffset.x)}
    >
      <View style={{ width: totalW, minWidth: "100%" }}>
        {rows.map(({ item, number: num, dataRow: di }, i) => {
          if (item.type === "header")
            return (
              <HeaderRows
                key={i}
                scale={scale}
                nameW={nameW}
                leaf={leaf}
                actionW={actionW}
              />
            );
          if (item.type === "title")
            return (
              <TitleRow
                key={i}
                text={item.text}
                number={num!}
                nameW={nameW}
                restW={midW + actionW}
                height={grow(BAND_H, scale)}
              />
            );
          const kind: RowKind =
            item.type === "company"
              ? "company"
              : /median/i.test(item.label)
                ? "median"
                : "mean";
          const texts =
            item.type === "company"
              ? item.company.cells.map((c) => c.text)
              : item.values;
          const sources = citations ? rowCitation(table, di!) : undefined;
          const tinted = hoverRow === i;
          return (
            <DataRow
              key={i}
              height={grow(ROW_H, scale)}
              number={num!}
              nameW={nameW}
              actionW={actionW}
              rowSources={sources}
              tinted={tinted}
              onRowHover={(on) => setHoverRow(on ? i : null)}
              name={
                item.type === "company" ? (
                  <View style={styles.nameInner}>
                    <Logo company={item.company} />
                    <Text numberOfLines={1} style={styles.nameText}>
                      {item.company.name}
                    </Text>
                  </View>
                ) : (
                  <Text numberOfLines={1} style={styles.statLabel}>
                    {item.label}
                  </Text>
                )
              }
              action={
                rowAction && item.type === "company" ? (
                  <RowChevron company={item.company.name} />
                ) : null
              }
            >
              {texts.map((text, col) => (
                <MetricCell
                  key={col}
                  width={leaf[col]}
                  text={col < 2 ? inUnit(text, unit) : text}
                  cell={item.type === "company" ? item.company.cells[col] : undefined}
                  id={cellId(table, di!, col)}
                  stat={item.type === "stat"}
                  arrow={ARROW_COLS.has(col)}
                  tinted={tinted}
                  citation={
                    citations ? cellCitation(table, kind, di!, col, text) : undefined
                  }
                />
              ))}
            </DataRow>
          );
        })}
      </View>
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ header */

/** The column-letter row and the two header tiers; "Company name" is one cell over both tiers. */
function HeaderRows({
  scale,
  nameW,
  leaf,
  actionW,
}: {
  scale: number;
  nameW: number;
  leaf: number[];
  actionW: number;
}) {
  const letterH = grow(LETTER_H, scale);
  const tier = grow(TIER_H, scale);
  return (
    <>
      {/* Column letters */}
      <View style={{ flexDirection: "row", height: letterH }}>
        <View style={[styles.left, sticky({ left: 0, zIndex: 5 })]}>
          <View style={[styles.head, { width: ROW_NUM_W, height: letterH }]} />
          <View style={[styles.head, { width: nameW, height: letterH }]}>
            <Text style={styles.letter}>A</Text>
          </View>
        </View>
        {leaf.map((w, i) => (
          <View key={i} style={[styles.head, { width: w, height: letterH }]}>
            <Text style={styles.letter}>{LETTERS[i + 1]}</Text>
          </View>
        ))}
        {actionW > 0 && <View style={[styles.head, { width: actionW, height: letterH }]} />}
      </View>

      {/* Tier 1: group titles. The row itself is raised (every View is its own stacking layer on the web), so the merged
          Company name cell can hang over tier 2 whichever way the metric columns are scrolled. */}
      <View style={{ flexDirection: "row", height: tier, zIndex: 2 }}>
        <View style={[styles.left, sticky({ left: 0, zIndex: 6 })]}>
          <View style={[styles.head, { width: ROW_NUM_W, height: tier }]} />
          <View style={[styles.head, { width: nameW, height: tier }]} />
          <View
            style={[
              styles.head,
              styles.merged,
              { left: ROW_NUM_W, width: nameW, height: tier * 2, borderBottomColor: LINE },
            ]}
          >
            <Text style={[styles.headText, styles.companyHead]}>Company name</Text>
          </View>
        </View>
        {benchmarkColumns.map((group) => {
          const w = group.subs.reduce((s, c) => s + c.width, 0) * scale;
          return (
            <View key={group.title} style={[styles.head, { width: w, height: tier }]}>
              <Text style={[styles.headText, styles.groupTitle]}>{group.title}</Text>
            </View>
          );
        })}
        {actionW > 0 && <View style={[styles.head, { width: actionW, height: tier }]} />}
      </View>

      {/* Tier 2: sub-columns */}
      <View style={{ flexDirection: "row", height: tier }}>
        {/* Transparent, so the merged Company name cell hanging down from tier 1 shows through. */}
        <View style={[styles.left, styles.clear, sticky({ left: 0, zIndex: 5 })]}>
          <View style={[styles.head, { width: ROW_NUM_W, height: tier }]} />
          <View style={{ width: nameW, height: tier }} />
        </View>
        {benchmarkColumns.flatMap((group) =>
          group.subs.map((sub) => (
            <View
              key={group.title + sub.label}
              style={[styles.sub, { width: sub.width * scale, height: tier }]}
            >
              <Text style={[styles.subText, sub.label.startsWith("As of") && styles.asOf]}>
                {sub.label}
              </Text>
            </View>
          )),
        )}
        {actionW > 0 && <View style={[styles.sub, { width: actionW, height: tier }]} />}
      </View>
    </>
  );
}

/** A group title, spanning the whole table: a banded row whose label stays with the pinned columns. */
function TitleRow({
  text,
  number,
  nameW,
  restW,
  height,
}: {
  text: string;
  number: number;
  nameW: number;
  restW: number;
  height: number;
}) {
  return (
    <View style={{ flexDirection: "row", height }}>
      <View style={[styles.left, sticky({ left: 0, zIndex: 3 })]}>
        <View style={[styles.head, { width: ROW_NUM_W, height }]}>
          <Text style={styles.rowNum}>{number}</Text>
        </View>
        <View style={[styles.band, { width: nameW, height }]}>
          <Text numberOfLines={1} style={styles.bandText}>
            {text}
          </Text>
        </View>
      </View>
      <View style={[styles.band, { width: restW, height }]} />
    </View>
  );
}

/* --------------------------------------------------------------------- rows */

function DataRow({
  height,
  number,
  nameW,
  actionW,
  rowSources,
  tinted,
  onRowHover,
  name,
  action,
  children,
}: {
  height: number;
  number: number;
  nameW: number;
  actionW: number;
  rowSources?: CellSource[];
  tinted: boolean;
  onRowHover: (on: boolean) => void;
  name: ReactNode;
  action: ReactNode;
  children: ReactNode;
}) {
  const card = useSourceCard();
  const ref = useRef<ComponentRef<typeof View>>(null);
  const tint = tinted ? { backgroundColor: TINT } : null;
  return (
    <View style={{ flexDirection: "row", height }}>
      <View style={[styles.left, sticky({ left: 0, zIndex: 3 })]}>
        <Pressable
          ref={ref}
          accessibilityLabel={rowSources ? `Row ${number}, ${rowSources.length} sources` : `Row ${number}`}
          onHoverIn={() => {
            if (!rowSources) return;
            onRowHover(true);
            card.show(ref.current, { sources: rowSources, row: true });
          }}
          onHoverOut={() => {
            if (!rowSources) return;
            onRowHover(false);
            card.hide();
          }}
          style={[styles.head, { width: ROW_NUM_W, height }, tint, rowSources && pointer]}
        >
          <Text style={styles.rowNum}>{number}</Text>
          {rowSources && <Flag color={FLAG} />}
        </Pressable>
        <View style={[styles.nameCell, { width: nameW, height }, tint]}>{name}</View>
      </View>
      {children}
      {actionW > 0 && (
        <View style={[styles.cell, { width: actionW, height }, tint]}>{action}</View>
      )}
    </View>
  );
}

function MetricCell({
  width,
  text: given,
  cell,
  id,
  stat,
  arrow,
  tinted,
  citation,
}: {
  width: number;
  text: string;
  cell?: Cell;
  /** `table:row:column`, which the citation drawer is opened by. */
  id: string;
  stat: boolean;
  arrow: boolean;
  tinted: boolean;
  citation?: ReturnType<typeof cellCitation>;
}) {
  const card = useSourceCard();
  const { openId, open, pickOf } = useBenchmarkCitation();
  const { setOpen: showAssistantPane } = useAssistantOverlay();
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [hovered, setHovered] = useState(false);
  // The figure whose drawer is open is marked in a stronger amber (Figma 829:19751).
  const active = !!citation && openId === id;
  // A value the reader typed in, or chose from the sources, replaces the one the table was given.
  const pick = pickOf(id);
  const own = CITATION_TARGETS.find((t) => t.id === id)?.value;
  const chosen = pick.selected === OVERWRITE ? pick.overwrite?.value : pick.selected;
  const text = citation && chosen && chosen !== own ? chosen : given;
  const bg = active ? ACTIVE : citation && hovered ? TINT : tinted ? TINT : undefined;
  return (
    <Pressable
      ref={ref}
      disabled={!citation}
      accessibilityLabel={citation ? `${text}, ${citation.sources.length} sources` : undefined}
      onPress={() => {
        if (!citation) return;
        card.hide();
        open(id);
        // In a window too narrow for the assistant beside the note, the drawer comes up in the overlay.
        showAssistantPane(true);
      }}
      onHoverIn={() => {
        if (!citation) return;
        setHovered(true);
        card.show(ref.current, { sources: citation.sources, conflict: citation.conflict });
      }}
      onHoverOut={() => {
        setHovered(false);
        card.hide();
      }}
      style={[
        styles.cell,
        styles.metric,
        { width },
        bg ? { backgroundColor: bg } : null,
        citation && pointer,
        transition(["background-color"], 120),
      ]}
    >
      <Text
        style={[
          stat ? styles.statValue : styles.value,
          !stat && cell?.trend ? { color: TREND_COLOR[cell.trend] } : null,
        ]}
      >
        {text}
      </Text>
      {arrow && !stat && cell?.trend === "up" && <UpArrow />}
      {/* Amber while the sources agree, red when they disagree. */}
      {citation && <Flag color={citation.conflict ? FLAG_CONFLICT : FLAG} />}
    </Pressable>
  );
}

/** The 8px corner flag in the cell's top-right corner. */
function Flag({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={styles.flag}>
      <Svg width={8} height={8} viewBox="0 0 8 8">
        <Path d="M0 0H8V8Z" fill={color} />
      </Svg>
    </View>
  );
}

const TREND_COLOR: Record<Trend, string> = {
  down: "#d02533",
  up: "#22733e",
  flat: "#a78025",
};

/** The arrow beside a rising figure: the design's right-pointing arrow turned a quarter turn up (Figma 905:10504). */
function UpArrow() {
  return <Icon name="trendArrow" size={12} style={{ transform: [{ rotate: "-90deg" }] }} />;
}

function Logo({ company }: { company: Company }) {
  const { source, radius } = company.logo;
  return <Image source={source} contentFit="cover" style={[styles.logo, { borderRadius: radius }]} />;
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
  scroller: { width: "100%" },
  left: { flexDirection: "row", backgroundColor: colors.white },
  clear: { backgroundColor: "transparent" },
  // Header-style cells: the row numbers, letters and group titles.
  head: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HEAD,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: LINE,
  },
  merged: {
    position: "absolute",
    top: 0,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  // Column letters are slate 600; row numbers a touch lighter (Figma 905:10414, 905:10477).
  letter: { ...text, color: colors.slate600 },
  rowNum: { ...text, color: colors.slate500 },
  headText: { ...text, color: colors.slate900 },
  companyHead: { fontFamily: fonts.geistMedium, color: colors.slate800 },
  groupTitle: { fontFamily: fonts.geistMedium },
  sub: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SUB,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: LINE,
  },
  subText: { ...text, fontSize: 10, color: colors.slate500 },
  asOf: { fontSize: 10 },
  band: {
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: BAND,
    borderBottomWidth: 1,
    borderBottomColor: BODY_LINE,
  },
  bandText: { ...text, fontFamily: fonts.geistMedium, color: colors.slate800 },
  nameCell: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BODY_LINE,
    ...transition(["background-color"], 120),
  },
  nameInner: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0 },
  nameText: { ...text, color: colors.slate600, flexShrink: 1 },
  statLabel: {
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.08,
    color: colors.slate800,
  },
  logo: { width: 16, height: 16 },
  cell: {
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BODY_LINE,
    ...transition(["background-color"], 120),
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    paddingHorizontal: 10,
  },
  value: text,
  statValue: {
    fontVariant: ["tabular-nums"],
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.08,
    color: colors.slate800,
  },
  flag: { position: "absolute", top: 0, right: 0, width: 8, height: 8 },
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
});
