import { Fragment, useState } from "react";
import { Platform, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { colors, fonts } from "../../theme";
import { vdr } from "../../assets/vdr";
import { ArtifactScroll } from "./ArtifactFrame";

/**
 * The "Investment analysis" sheet (Figma 94:774): a real table, not a picture. The "Particulars" column
 * stays put while the figures scroll sideways, and the two header rows stay put while the
 * rows scroll down (both are `position: sticky` inside the artefact frame's scroller). Rows come in blocks of a bold parent line and its
 * indented children, with a divider between blocks; each year has Actuals, IC case and a Variation cell that is
 * tinted green or red with an arrow. The sheet is a fixed example.
 */

const YEARS = ["FY - 2025", "FY - 2024", "FY - 2023", "FY - 2022"];
/** Years whose header carries the pin (Figma shows it on the first two). */
const PINNED = [true, true, false, false];

type Cell = { actual: string; ic: string; delta: string; up: boolean };
type Row = { label: string; child?: boolean; truncated?: boolean; cells: Cell[] };

const c = (actual: string, ic: string, delta: string, up: boolean): Cell => ({ actual, ic, delta, up });
const NUM = ["92,585", "94,346"];
const NUM2 = ["1,08,884", "1,17,113"];
const PCT = ["12%", "11%"];
const U = "1.9%";
const D = "7.0%";
const u2 = "1.2%";

/** A parent row: the same totals each year, with its own variation direction per year. */
const parent = (label: string, dirs: boolean[], nums: string[][] = [NUM, NUM2, NUM, NUM2]): Row => ({
  label,
  cells: dirs.map((up, i) => c(nums[i][0], nums[i][1], up ? U : D, up)),
});
/** A child row: percentages (or amounts) with a variation per year. */
const child = (label: string, dirs: boolean[], nums: string[][] = [PCT, PCT, PCT, PCT], extra?: Partial<Row>): Row => ({
  label,
  child: true,
  ...extra,
  cells: dirs.map((up, i) => c(nums[i][0], nums[i][1], up ? u2 : D, up)),
});

/** Blocks of rows; a divider is drawn between blocks. */
const BLOCKS: Row[][] = [
  [
    parent("Gross Written Premium (GWP)", [true, false, true, false]),
    child("YoY growth (%)", [true, false, false, false]),
    child("Reinsurance ceded", [false, false, false, false], [NUM, NUM2, NUM, NUM2]),
    child("Reinsurance ceded (%)", [true, false, false, false]),
  ],
  [
    parent("Net Written Premium (NWP)", [true, true, true, true], [NUM, NUM2, NUM2, NUM2]),
    child("Retention rate (%)", [false, false, false, false]),
  ],
  [parent("Net Earned Premium (NEP)", [true, true, true, true]), child("YoY growth (%)", [false, false, false, false])],
  [parent("Net claims incurred", [true, true, true, true]), child("Loss ratio (on NEP) (%)", [true, false, false, false])],
  [
    parent("Net Commission", [true, true, true, true]),
    child("Net Commission (%) NWP", [false, false, false, false]),
    child("Net Commission (%) NEP", [true, false, false, false]),
  ],
  [
    parent("Operating Expenses", [true, true, true, true]),
    child("Opex (%) GWP - Total", [true, false, false, false]),
    child("Opex (%) NEP - Total", [false, false, false, false]),
  ],
  [
    parent("Total Costs (Claims + Expenses)", [true, true, true, true]),
    child("COR (%) (of NEP)", [true, false, false, false]),
  ],
  [
    parent("Underwriting Profit / Loss", [true, false, false, false]),
    child("Investment income", [false, false, true, true], [NUM, NUM2, NUM, NUM2]),
  ],
  [parent("Profit after tax", [true, true, true, true]), child("PAT Margin (% of NEP)", [true, false, false, false])],
];

/** Indicative/Negative text colour used elsewhere in the design. */
const NEGATIVE = "#d02533";

const INSIGHT =
  "It shows higher margins & ROCE than peer averages, with strong vaccine scale, but lags global majors in R&D intensity & biologics innovation.";

// Geometry from the design (px).
const LABEL_W = 190;
/** The pinned first column: just the row label (the design's checkbox column is left out). */
const FIRST_W = LABEL_W;
const COL = [70, 70, 85];
const GROUP_W = COL[0] + COL[1] + COL[2] + 2; // 227
const GAP = 1;
/** Row height: the design's 48px less 2px of vertical padding. */
const ROW_H = 46;
const TABLE_W = FIRST_W + YEARS.length * (GROUP_W + GAP);

const sticky = (extra: ViewStyle): ViewStyle =>
  (Platform.OS === "web" ? { position: "sticky", ...extra } : extra) as ViewStyle;

export function InvestmentTable({ scroll }: { scroll: ArtifactScroll }) {
  const [height, setHeight] = useState(0);
  return (
    <View style={{ width: TABLE_W }} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {/*
        Pinned-edge shadows, drawn only once the sheet has been scrolled: one continuous strip down the right edge of the
        pinned column (the pinned header has none). It hangs off a zero-size sticky anchor, so it moves with the column and
        takes no room in the layout.
      */}
      {scroll.x && height > 0 && (
        <View pointerEvents="none" style={sticky({ left: FIRST_W, width: 0, height: 0, zIndex: 5 })}>
          <View style={[styles.edgeRight, { height }]} />
        </View>
      )}
      <Header />
      {BLOCKS.map((block, b) => (
        <Fragment key={b}>
          {b > 0 && <View style={styles.divider} />}
          {block.map((row) => (
            <DataRow key={row.label + b} row={row} />
          ))}
        </Fragment>
      ))}
      <View style={styles.insight}>
        <View style={sticky({ left: 0, width: 538, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 12 })}>
          <Image source={vdr.sparkleAi} contentFit="fill" style={{ width: 20, height: 20 }} />
          <Text style={styles.insightText}>{INSIGHT}</Text>
        </View>
      </View>
    </View>
  );
}

/** The two header rows: year groups on top, Actuals / IC case / Variation underneath; "Particulars" spans both. */
function Header() {
  return (
    <View style={[styles.header, sticky({ top: 0, zIndex: 6 })]}>
      <View style={[styles.firstCol, styles.headFirst, sticky({ left: 0, zIndex: 7 })]}>
        <View style={[styles.headCell, { width: LABEL_W, justifyContent: "center", paddingHorizontal: 12 }]}>
          <Text style={[styles.headText, { color: colors.slate600 }]}>Particulars</Text>
        </View>
      </View>
      {YEARS.map((year, i) => (
        <View key={year} style={{ width: GROUP_W, marginLeft: GAP }}>
          <View style={[styles.yearHead, { backgroundColor: colors.shark100 }]}>
            <Image source={vdr.pin} contentFit="fill" style={[styles.pin, { opacity: 0 }]} />
            <Text style={[styles.headText, { color: colors.slate800 }]}>{year}</Text>
            <Image source={vdr.pin} contentFit="fill" style={[styles.pin, { opacity: PINNED[i] ? 1 : 0 }]} />
          </View>
          <View style={styles.subHeads}>
            {["Actuals", "IC case", "Variation (%)"].map((label, k) => (
              <View key={label} style={[styles.subHead, { width: COL[k] }]}>
                <Text style={[styles.headText, { color: colors.slate600 }]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function DataRow({ row }: { row: Row }) {
  const parentRow = !row.child;
  return (
    <View style={styles.row}>
      <View style={[styles.firstCol, sticky({ left: 0, zIndex: 3 })]}>
        <View style={[styles.labelCell, { width: LABEL_W, paddingLeft: row.child ? 28 + 12 : 12 }]}>
          <Text
            numberOfLines={1}
            style={[styles.label, { fontFamily: parentRow ? fonts.geistSemiBold : fonts.geistRegular }]}
          >
            {row.label}
          </Text>
        </View>
      </View>
      {row.cells.map((cell, i) => (
        <View key={i} style={[styles.group, { marginLeft: GAP }]}>
          <View style={[styles.cell, { width: COL[0] }]}>
            <Text style={[styles.num, parentRow && styles.numBold]}>{cell.actual}</Text>
          </View>
          <View style={[styles.cell, { width: COL[1] }]}>
            <Text style={[styles.num, parentRow && styles.numBold]}>{cell.ic}</Text>
          </View>
          <View style={[styles.cell, styles.delta, { width: COL[2], backgroundColor: cell.up ? (parentRow ? "#f2fbf5" : "#f4fbf6") : "rgba(255,235,236,0.3)" }]}>
            <Text style={[styles.num, parentRow && styles.numBold, { color: cell.up ? colors.pine700 : NEGATIVE }]}>{cell.delta}</Text>
            <Image
              source={cell.up ? vdr.trendArrow : vdr.trendArrowDown}
              contentFit="fill"
              style={{ width: 12, height: 12, transform: [{ rotate: cell.up ? "-90deg" : "90deg" }] }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", height: 69, backgroundColor: colors.white },
  firstCol: { flexDirection: "row", width: FIRST_W, backgroundColor: colors.white },
  headFirst: { height: 69 },
  // 8px fade from 5% of the text colour to nothing, running down / along the pinned edge.
  edgeRight: { position: "absolute", left: 0, top: 0, width: 8, backgroundImage: "linear-gradient(90deg, rgba(15,23,41,0.05), rgba(15,23,41,0))" } as object,
  headCell: { backgroundColor: colors.shark100, height: 69 },
  yearHead: {
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pin: { width: 16, height: 16 },
  subHeads: { flexDirection: "row", gap: 1, height: 34, marginTop: 1, backgroundColor: colors.white },
  subHead: { height: 34, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  headText: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 18, letterSpacing: 0.0825 },

  row: { flexDirection: "row", height: ROW_H, marginTop: 4 },
  divider: { height: 1, marginTop: 4, backgroundColor: colors.slate200 },
  group: { flexDirection: "row", gap: 1, width: GROUP_W },
  cell: { height: ROW_H, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  delta: { flexDirection: "row", gap: 2 },
  num: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 18, letterSpacing: 0.0825, color: colors.slate700, fontVariant: ["tabular-nums"] },
  numBold: { fontFamily: fonts.geistSemiBold },
  labelCell: { height: ROW_H, justifyContent: "center", paddingHorizontal: 12 },
  label: { fontSize: 11, lineHeight: 18, letterSpacing: 0.0825, color: colors.slate800 },

  insight: { marginTop: 12, borderRadius: 8, backgroundColor: "#f2fbf5", width: TABLE_W },
  insightText: { fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 18, letterSpacing: 0.09, color: colors.slate800 },
});
