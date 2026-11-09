import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { colors, fonts } from "../../theme";
import { assistant } from "../../data/researchNote";

// Geometry from Figma "Revenue trend line" (354:19804): a 340-wide card body, 28px y-axis labels, a
// 308 x 120 plot with gridlines every 27px (800 at the top, 0 at the bottom) and one point every 63px.
const PLOT_W = 308;
const PLOT_H = 120;
const GRID_TOP = 6;
const GRID_STEP = 27;
const MAX = 800;
const POINT_X0 = 20;
const POINT_STEP = 63;
const Y_LABELS = ["800", "600", "400", "200", "0"];

const yFor = (value: number) =>
  GRID_TOP + ((MAX - value) * (GRID_STEP * 4)) / MAX + 0.5;
const xFor = (i: number) => POINT_X0 + i * POINT_STEP;

export function RevenueChart() {
  const { cardTitle, subtitle, legend, footnote, points } = assistant.chart;
  const last = points.length - 1;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text style={styles.title}>{cardTitle}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendSwatch} />
          <Text style={styles.axisText}>{legend}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.yAxis}>
          {Y_LABELS.map((label, i) => (
            <Text
              key={label}
              style={[styles.axisText, styles.yLabel, { top: i * GRID_STEP }]}
            >
              {label}
            </Text>
          ))}
        </View>
        <View style={styles.plot}>
          <Svg width={PLOT_W} height={PLOT_H} style={StyleSheet.absoluteFill}>
            {Y_LABELS.map((_, i) => (
              <Line
                key={i}
                x1={0}
                x2={292}
                y1={GRID_TOP + i * GRID_STEP + 0.5}
                y2={GRID_TOP + i * GRID_STEP + 0.5}
                stroke={colors.slate200}
                strokeWidth={1}
              />
            ))}
            {points.slice(1).map((p, i) => (
              <Line
                key={p.label}
                x1={xFor(i)}
                y1={yFor(points[i].value)}
                x2={xFor(i + 1)}
                y2={yFor(p.value)}
                stroke={colors.pine700}
                strokeWidth={2}
                strokeLinecap="round"
              />
            ))}
            {points.map((p, i) => (
              <Circle
                key={p.label}
                cx={xFor(i)}
                cy={yFor(p.value)}
                r={3}
                stroke={colors.pine700}
                strokeWidth={2}
                fill={i === last ? colors.pine700 : colors.white}
              />
            ))}
          </Svg>
          {points.map((p, i) => (
            <Text
              key={p.label}
              style={[
                styles.pointLabel,
                { left: xFor(i) - 14, top: yFor(p.value) - 19 },
                i === last && styles.pointLabelLast,
              ]}
            >
              {p.value}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.xAxis}>
        {points.map((p, i) => (
          <Text
            key={p.label}
            style={[
              styles.axisText,
              styles.xLabel,
              { left: 32 + xFor(i) - 14 },
            ]}
          >
            {p.label}
          </Text>
        ))}
      </View>

      <Text style={styles.footnote}>{footnote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 12,
    gap: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 0.5,
    borderColor: colors.slate200,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    height: 32,
  },
  titles: { gap: 2, flexShrink: 1 },
  title: {
    fontFamily: fonts.geistSemiBold,
    fontSize: 11,
    lineHeight: 16,
    color: colors.slate800,
  },
  subtitle: {
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.slate600,
  },
  legend: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  legendSwatch: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.pine700,
  },
  axisText: {
    fontFamily: fonts.geistRegular,
    fontSize: 9,
    lineHeight: 12,
    color: colors.slate600,
  },
  body: { flexDirection: "row", gap: 4, height: PLOT_H },
  yAxis: { width: 28, height: PLOT_H },
  yLabel: { position: "absolute", right: 0, textAlign: "right" },
  plot: {
    width: PLOT_W,
    height: PLOT_H,
    borderRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.dew100,
    overflow: "hidden",
  },
  pointLabel: {
    position: "absolute",
    width: 28,
    textAlign: "center",
    fontFamily: fonts.geistSemiBold,
    fontSize: 9,
    lineHeight: 12,
    color: colors.slate600,
  },
  pointLabelLast: { color: colors.pine700 },
  xAxis: { height: 12 },
  xLabel: { position: "absolute", top: 0, width: 28, textAlign: "center" },
  footnote: {
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.slate600,
  },
});
