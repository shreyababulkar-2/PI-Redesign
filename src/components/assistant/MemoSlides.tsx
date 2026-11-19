import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../theme";

/**
 * The IC memo as it shows in the document drawer (Figma 41:20368): three slides, each with a small caps eyebrow, a
 * pine headline and a green rule, then a table, a paragraph or a bar chart. The type is deliberately tiny, as on a
 * slide thumbnail. Figma sets it in Inter; Geist stands in here.
 */
const ROWS: [string, string, string][] = [
  ["Entry EV", "₹ 2,600 cr", "20.0x FY26E / 18.0x FY27E reported EBITDA; 17.6x FY27E sustainable"],
  ["Negotiated discount to ask", "35%", "Mgmt ask: ₹4,000 Cr / 28x FY27E; PI hold: ₹2,600 Cr / 18x"],
  ["Discount to listed median", "27%", "Listed FY27E median 24.7x; closest peer Jupiter 22.4x"],
  ["Gross IRR", "Mgmt: ~25%; PI est: 24.5% base", "5-yr hold to FY30E"],
  ["MOIC", "Mgmt: 3.0x; PI est: 3.0x base", "₹300 Cr → ~₹893 Cr"],
];

const HEADLINE =
  "Organisied share of ethnic wear projected to grow from 27% (FY24) by FY30 - directly benefiting established national brands";
const PARAGRAPH =
  "The company's portfolio is dominated by its own private label brands (e.g., Vincent Chase for fast fashion, John Jacobs for premium). This strategy allows for higher gross margins and greater control over product trends. Private labels are estimated to account for over 90% of total sales. By focusing on in-house brands, the company can rapidly respond to changing consumer preferences.";

const PARAGRAPH_SHORT =
  "The company's portfolio is dominated by its own private label brands (e.g., Vincent Chase for fast fashion, John Jacobs for premium). This strategy allows for higher gross margins and greater control over product trends.";

const BARS: [string, number, string][] = [
  ["FY-21", 30, "#3d8f8f"],
  ["FY-22", 12, "#f2821d"],
  ["FY-23", 23, "#7d66ee"],
  ["FY-24", 34, "#dc588f"],
  ["FY-25", 60, "#0b89db"],
  ["FY-26", 60, "#c268cd"],
  ["FY-26E", 60, "#3d8f8f"],
];
const Y_TICKS = ["70", "60", "50", "40", "30", "20", "10", "00"];
const PLOT_H = 106;

export function MemoSlides() {
  return (
    <View style={{ gap: 16 }}>
      <Slide eyebrow="03 - Market opportunity" title="A Large and Structurally Growing Market">
        <MemoTable />
        <Copy />
      </Slide>
      <Slide eyebrow="02 - Marketing Strategy" title="Preventive measures for business continuity">
        <Copy />
        <BarChart />
      </Slide>
      <Slide eyebrow="01 - Company profile" title="Company at a glance">
        <Text style={styles.body}>
          Lenskart is the definitive market leader in the organized eyewear retail market in India, with an estimated
          market share of ~30%. This is significantly ahead of its main organized competitor, Titan Eyeplus, which
          holds an estimated ~15% market share.
        </Text>
        <Text style={styles.bodyBold}>{PARAGRAPH_SHORT}</Text>
        <MemoTable />
      </Slide>
    </View>
  );
}

function Slide({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.slide}>
      <View style={{ gap: 2.5 }}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.rule} />
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

function Copy() {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.bodyBold}>{HEADLINE}</Text>
      <Text style={styles.body}>{PARAGRAPH}</Text>
    </View>
  );
}

function MemoTable() {
  return (
    <View style={styles.table}>
      <View style={styles.headRow}>
        {["Metric", "Value in Cr", "Context"].map((h, c) => (
          <View key={h} style={[styles.headCell, COLS[c]]}>
            <Text style={styles.headText}>{h}</Text>
          </View>
        ))}
      </View>
      {ROWS.map((row, i) => (
        <View key={row[0]} style={[styles.row, i < ROWS.length - 1 && styles.rowLine]}>
          {row.map((cell, c) => (
            <View key={c} style={[c === 0 ? styles.labelCell : styles.cell, COLS[c]]}>
              <Text style={c === 0 ? styles.labelText : styles.cellText}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Column widths as shares of the table (125 / 156 / 247 of 529). */
const COLS = [{ flex: 125 }, { flex: 156 }, { flex: 247 }];

function BarChart() {
  return (
    <View style={styles.chart}>
      <Text style={styles.chartTitle}>Revenue trend (₹ crore)</Text>
      <View style={{ flexDirection: "row", gap: 7, height: PLOT_H + 14 }}>
        <View style={styles.plotArea}>
          <View style={styles.bars}>
            {BARS.map(([label, v, color]) => (
              <View key={label} style={styles.barCol}>
                <Text style={styles.barValue}>{v}</Text>
                <View style={[styles.bar, { height: (v / 70) * PLOT_H * 0.96, backgroundColor: color }]} />
              </View>
            ))}
          </View>
          <View style={styles.xLabels}>
            {BARS.map(([label]) => (
              <Text key={label} style={styles.xLabel}>
                {label}
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.yAxis}>
          {Y_TICKS.map((t) => (
            <Text key={t} style={styles.yTick}>
              {t}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const small = { fontFamily: fonts.geistRegular, color: colors.slate800 } as const;

const styles = StyleSheet.create({
  slide: {
    gap: 12,
    padding: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: "rgba(245,247,250,0.4)",
  },
  eyebrow: { fontFamily: fonts.geistMedium, fontSize: 6.5, lineHeight: 9, letterSpacing: 0.1, textTransform: "uppercase", color: colors.slate500 },
  title: { fontFamily: fonts.geistSemiBold, fontSize: 14.8, lineHeight: 20, letterSpacing: 0.11, color: colors.pine800 },
  rule: { height: 1.2, borderRadius: 60, backgroundColor: "#90bf89", opacity: 0.8 },
  body: { ...small, fontSize: 7.5, lineHeight: 11, letterSpacing: 0.056 },
  bodyBold: { ...small, fontFamily: fonts.geistSemiBold, fontSize: 7.5, lineHeight: 11, letterSpacing: 0.056 },
  table: { borderRadius: 2.5, borderWidth: 0.63, borderColor: colors.slate200, overflow: "hidden" },
  headRow: { flexDirection: "row", gap: 0.6, backgroundColor: "#ded9da" },
  headCell: { paddingHorizontal: 7.5, paddingVertical: 5, backgroundColor: "#ded9da" },
  headText: { fontFamily: fonts.geistSemiBold, fontSize: 6.9, lineHeight: 11, letterSpacing: 0.05, color: colors.slate700 },
  row: { flexDirection: "row", gap: 0.6, alignItems: "stretch" },
  rowLine: { borderBottomWidth: 0.63, borderBottomColor: colors.slate200 },
  labelCell: { paddingHorizontal: 7.5, paddingVertical: 5, backgroundColor: colors.slate50, borderRightWidth: 0.63, borderRightColor: colors.white },
  cell: { padding: 5, backgroundColor: colors.white },
  labelText: { ...small, fontSize: 6.9, lineHeight: 11, letterSpacing: 0.05 },
  cellText: { ...small, fontFamily: fonts.geistSemiBold, fontSize: 6.5, lineHeight: 10, letterSpacing: 0.03 },
  chart: { gap: 14, paddingHorizontal: 9, paddingVertical: 8, borderRadius: 4.7, backgroundColor: colors.white },
  chartTitle: { ...small, fontFamily: fonts.geistSemiBold, fontSize: 7, lineHeight: 10.6, letterSpacing: 0.05 },
  plotArea: { flex: 1, justifyContent: "flex-end" },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 24, height: PLOT_H, paddingHorizontal: 10 },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 3.5 },
  barValue: { fontFamily: fonts.geistMedium, fontSize: 5.9, lineHeight: 8, letterSpacing: 0.09, color: colors.slate600 },
  bar: { width: "100%", borderTopLeftRadius: 2.4, borderTopRightRadius: 2.4 },
  xLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10, marginTop: 7 },
  xLabel: { fontFamily: fonts.geistSemiBold, fontSize: 5.9, lineHeight: 8, color: colors.slate600 },
  yAxis: { height: PLOT_H, justifyContent: "space-between", alignItems: "flex-end" },
  yTick: { fontFamily: fonts.geistRegular, fontSize: 5.9, lineHeight: 9.4, color: colors.slate500 },
});
