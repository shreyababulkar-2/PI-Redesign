import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../theme";

/** Axis runs 0–25%; everything below is positioned as a share of it. */
const AXIS_MAX = 25;
const pct = (value: number) => `${(value / AXIS_MAX) * 100}%` as `${number}%`;
const TICKS = ["0%", "5%", "10%", "15%", "20%", "25%"];
const FACTS: [string, string][] = [
  ["Market size:", " ~₹13,500 cr"],
  ["FY25 revenue:", " ₹593 cr"],
  ["Capex:", " ₹200 cr (to double capacity)"],
  ["Returns:", " ~2.6x MOIC / ~21% IRR (no citation)"],
  ["Entry multiple:", " ~15.0x (vs Garware 15.6x–23.5x)"],
];

/**
 * "EBITDA margin comparison" (Figma 46:20907): Juspay Technologies' FY24 margin as a blue bar against the uncited
 * 20–23% peer range as a pale band, on a 0–25% axis, with the key metrics listed underneath.
 */
export function EbitdaChart() {
  return (
    <View style={styles.card}>
      <View style={{ gap: 2 }}>
        <Text style={styles.title}>EBITDA margin comparison</Text>
        <Text style={styles.subtitle}>Juspay Technologies FY24 vs uncited peer benchmark</Text>
      </View>

      <View style={{ gap: 8 }}>
        <View style={styles.axis}>
          {TICKS.map((t) => (
            <Text key={t} style={styles.subtitle}>
              {t}
            </Text>
          ))}
        </View>
        <View style={styles.plot}>
          {[5, 10, 15, 20].map((v) => (
            <View key={v} style={[styles.grid, { left: pct(v) }]} />
          ))}
          <View style={[styles.peerBar, { left: pct(20), width: pct(3) }]} />
          <View style={[styles.bar, { width: pct(16.1) }]} />
          <Text style={[styles.label, { left: pct(3), top: 5.5, fontFamily: fonts.geistMedium }]}>
            Juspay Technologies 16.1%
          </Text>
          <View style={[styles.peerLabelWrap, { right: pct(5) }]}>
            <Text style={styles.label}>Peer 20–23% (uncited)</Text>
          </View>
        </View>
      </View>

      <View style={styles.facts}>
        {FACTS.map(([k, v]) => (
          <Text key={k} style={styles.fact}>
            <Text style={{ fontFamily: fonts.geistSemiBold }}>{k}</Text>
            {v}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  title: { fontFamily: fonts.geistSemiBold, fontSize: 11, lineHeight: 16, color: colors.slate800 },
  subtitle: { fontFamily: fonts.geistRegular, fontSize: 10, lineHeight: 14, color: colors.slate600 },
  axis: { flexDirection: "row", justifyContent: "space-between" },
  plot: {
    height: 120,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.dew100,
    backgroundColor: colors.slate50,
    overflow: "hidden",
  },
  grid: { position: "absolute", top: -0.5, width: 1, height: 120, backgroundColor: colors.slate200, opacity: 0.8 },
  bar: { position: "absolute", left: -0.5, top: 23.5, height: 20, borderRadius: 4, backgroundColor: "#3559e9" },
  peerBar: { position: "absolute", top: 77.5, height: 20, borderRadius: 4, backgroundColor: "#c0d5ff", opacity: 0.65 },
  label: {
    position: "absolute",
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.slate600,
  },
  // Sits to the left of the peer band, ending 4px short of it.
  peerLabelWrap: { position: "absolute", left: 0, top: 80.5, alignItems: "flex-end", paddingRight: 4 },
  facts: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 8 },
  fact: { fontFamily: fonts.geistRegular, fontSize: 10, lineHeight: 14, color: colors.slate800 },
});
