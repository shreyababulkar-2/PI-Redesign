import { Platform, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { colors, fonts } from "../theme";
import { vdr } from "../assets/vdr";

/**
 * The IC memo as it shows in the document drawer (Figma 213:9370): a deck of three slides, a cover picture and two
 * content slides. Each content slide has a small caps eyebrow, a pine headline and a green rule, then two paragraphs
 * and a table. The type is deliberately tiny, as on a slide thumbnail. Figma sets it in Inter; Geist stands in here.
 */
const ROWS: [string, string, string][] = [
  ["Entry EV", "₹ 2,600 cr", "20.0x FY26E / 18.0x FY27E reported EBITDA; 17.6x FY27E sustainable"],
  ["Negotiated discount to ask", "35%", "Mgmt ask: ₹4,000 Cr / 28x FY27E; PI hold: ₹2,600 Cr / 18x"],
  ["Discount to listed median", "27%", "Listed FY27E median 24.7x; closest peer Jupiter 22.4x"],
  ["Gross IRR", "Mgmt: ~25%; PI est: 24.5% base", "5-yr hold to FY30E"],
  ["MOIC", "Mgmt: 3.0x; PI est: 3.0x base", "₹300 Cr → ~₹893 Cr"],
];

const LEAD =
  "Lenskart is the definitive market leader in the organized eyewear retail market in India, with an estimated market share of ~30%. This is significantly ahead of its main organized competitor, Titan Eyeplus, which holds an estimated ~15% market share.";
const LEAD_2 =
  "This leadership has been driven by Lenskart’s strong omnichannel presence, vertically integrated supply chain, and aggressive investments in technology, branding, and customer experience.";
const NOTE =
  "The company's portfolio is dominated by its own private label brands (e.g., Vincent Chase for fast fashion, John Jacobs for premium). This strategy allows for higher gross margins and greater control over product trends.";

export function MemoSlides() {
  return (
    <View style={{ gap: 16 }}>
      <Image source={vdr.icCover} contentFit="cover" style={styles.cover} />
      <Slide eyebrow="slide 2 - Company profile" title="Company at a glance" />
      <Slide eyebrow="Slide 3 - Market analysis" title="Market overview" />
    </View>
  );
}

function Slide({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.slide}>
      <View style={{ gap: 3.2 }}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.rule} />
      <View style={{ gap: 9.5 }}>
        <View>
          <Text style={styles.body}>{LEAD}</Text>
          <Text style={styles.body}>{LEAD_2}</Text>
        </View>
        <Text style={styles.note}>{NOTE}</Text>
      </View>
      <MemoTable />
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
        <View key={row[0]} style={[styles.row, styles.rowLine]}>
          <View style={[styles.labelCell, COLS[0]]}>
            <Text style={styles.labelText}>{row[0]}</Text>
          </View>
          <View style={[styles.cell, COLS[1]]}>
            <Text style={styles.valueText}>{row[1]}</Text>
          </View>
          <View style={[styles.cell, COLS[2]]}>
            <Text numberOfLines={1} style={styles.contextText}>
              {row[2]}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Column widths as shares of the table (137 / 145 / 240 of 524). */
const COLS = [{ flex: 137 }, { flex: 145 }, { flex: 240 }];

const small = { fontFamily: fonts.geistRegular, color: colors.slate800 } as const;
const ruleGradient = (Platform.OS === "web"
  ? { backgroundImage: "linear-gradient(to right, #90bf89, rgba(144,191,137,0.2))" }
  : { backgroundColor: "#90bf89" }) as object;

const styles = StyleSheet.create({
  cover: { width: "100%", aspectRatio: 1434 / 808, borderRadius: 8 },
  slide: {
    gap: 12,
    padding: 22,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: "#fbfcfd",
  },
  eyebrow: {
    fontFamily: fonts.geistMedium,
    fontSize: 6.4,
    lineHeight: 8,
    letterSpacing: 0.1,
    textTransform: "uppercase",
    color: colors.slate500,
  },
  title: { fontFamily: fonts.geistSemiBold, fontSize: 15.9, lineHeight: 20, letterSpacing: 0.16, color: colors.pine800 },
  rule: { height: 0.8, ...ruleGradient },
  body: { ...small, fontSize: 7.95, lineHeight: 12.7, letterSpacing: 0.06 },
  note: { ...small, fontSize: 7.2, lineHeight: 10.8, letterSpacing: 0.05 },
  table: { borderRadius: 6.4, borderWidth: 0.6, borderColor: colors.slate200, overflow: "hidden", gap: 0.8 },
  headRow: { flexDirection: "row", gap: 0.6, borderRadius: 2.4, overflow: "hidden", backgroundColor: "#ded9da" },
  headCell: { padding: 6.4, backgroundColor: "#ded9da", justifyContent: "center" },
  headText: { fontFamily: fonts.geistSemiBold, fontSize: 6.6, lineHeight: 10.8, letterSpacing: 0.05, color: colors.slate700 },
  row: { flexDirection: "row", gap: 0.8, alignItems: "stretch" },
  rowLine: { borderBottomWidth: 0.8, borderBottomColor: colors.slate200 },
  labelCell: {
    padding: 4.8,
    minHeight: 20.4,
    backgroundColor: colors.slate50,
    borderRightWidth: 0.8,
    borderRightColor: colors.white,
  },
  cell: { padding: 4.8, minHeight: 20.4, backgroundColor: colors.white },
  labelText: { ...small, fontSize: 6.6, lineHeight: 10.8, letterSpacing: 0.05 },
  valueText: { ...small, fontFamily: fonts.geistSemiBold, fontSize: 6, lineHeight: 9.6, letterSpacing: 0.03 },
  contextText: { ...small, fontFamily: fonts.geistSemiBold, fontSize: 6.4, lineHeight: 9.5, letterSpacing: 0.03 },
});
