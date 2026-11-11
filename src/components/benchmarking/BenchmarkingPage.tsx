import { ReactNode, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, fonts } from "../../theme";
import {
  benchmarkAnalysis,
  categoryGroups,
  overallCompany,
  overallStats,
} from "../../data/benchmarking";
import { BENCHMARK_TABS, useActiveTab } from "../../state/activeTab";
import { useHover } from "../../hooks/useHover";
import { Icon } from "../Icon";
import { pointer } from "../../theme/cursor";
import { transition } from "../../theme/motion";
import { BenchmarkTable, createScrollGroup, DotsIcon, TableItem, Unit } from "./BenchmarkTable";

/**
 * Benchmarking tab (Figma "Benchmarking - New", 373:23715): a sub-tab bar, the analysis summary and two
 * comparison cards. Returned as siblings so the screen's scroll list spaces them like the other pages.
 */
export function BenchmarkingPage() {
  const overallItems = useMemo<TableItem[]>(
    () => [
      { type: "header" },
      { type: "gap", height: 4 },
      { type: "company", company: overallCompany },
      { type: "stat", label: "All companies: Mean", values: overallStats.mean },
      { type: "stat", label: "All companies: Median", values: overallStats.median },
    ],
    [],
  );
  const categoryItems = useMemo<TableItem[]>(() => {
    const items: TableItem[] = [{ type: "header" }, { type: "gap", height: 4 }];
    categoryGroups.forEach((g, i) => {
      if (i > 0) items.push({ type: "gap", height: 8 });
      items.push({ type: "title", text: g.title }, { type: "gap", height: 4 });
      g.companies.forEach((company) => items.push({ type: "company", company }));
      items.push(
        { type: "stat", label: "All companies: Mean", values: g.mean },
        { type: "stat", label: "All companies: Median", values: g.median },
      );
    });
    return items;
  }, []);
  const hover = useHover();
  // Both tables share one horizontal scroll position.
  const [scrollGroup] = useState(createScrollGroup);
  // Market cap and EV are shown in ₹ Mn or ₹ Cr; the chip in the first card flips both tables.
  const [unit, setUnit] = useState<Unit>("Mn");

  return (
    <>
      <SubTabs />
      <Analysis />

      <Card radius={10}>
        <CardHeader title="Overall comparison">
          <View style={styles.tools}>
            <UnitChip unit={unit} onToggle={() => setUnit((u) => (u === "Mn" ? "Cr" : "Mn"))} />
            <View style={styles.divider} />
            <View style={styles.iconPair}>
              <Icon name="tableExpand" size={28} style={pointer} />
              <DotsIcon />
            </View>
          </View>
        </CardHeader>
        <View style={styles.tableWrap}>
          <BenchmarkTable items={overallItems} actionsWidth={50} unit={unit} scrollGroup={scrollGroup} />
        </View>
      </Card>

      <Pressable {...hover.handlers} style={styles.cardPressable}>
        <Card radius={12}>
          <CardHeader title="Category-wise comparison">
            <FilterChip label="Regulatory classification" />
          </CardHeader>
          <View style={styles.tableWrap}>
            <BenchmarkTable
              items={categoryItems}
              actionsWidth={76}
              unit={unit}
              scrollGroup={scrollGroup}
              headerIcons={hover.hovered}
            />
          </View>
        </Card>
      </Pressable>
    </>
  );
}

/** Sub-tabs under the page header; the chosen one is dark with a short green underline. */
function SubTabs() {
  const { benchTab, setBenchTab } = useActiveTab();
  return (
    <View style={styles.subTabs} accessibilityRole="tablist">
      {BENCHMARK_TABS.map((label, i) => (
        <SubTab
          key={label}
          label={label}
          active={i === benchTab}
          onPress={() => setBenchTab(i)}
        />
      ))}
    </View>
  );
}

function SubTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      {...hover.handlers}
      style={styles.subTab}
    >
      <Text
        style={[
          styles.subTabText,
          { color: active || hover.hovered ? colors.slate700 : colors.slate500 },
        ]}
      >
        {label}
      </Text>
      {active && <View style={styles.underline} />}
    </Pressable>
  );
}

function Analysis() {
  return (
    <View style={styles.analysis}>
      <View style={styles.analysisIcon}>
        <Svg width={19} height={20} viewBox="0 0 19 20" fill="none">
          <Path
            d="M9.5 3.5l1.3 3.6 3.6 1.3-3.6 1.3-1.3 3.6-1.3-3.6-3.6-1.3 3.6-1.3L9.5 3.5zM14.7 12.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6z"
            fill={colors.pine800}
          />
        </Svg>
      </View>
      <View style={styles.analysisMain}>
        <View style={styles.analysisHead}>
          <View style={styles.analysisTitleRow}>
            <Text style={styles.analysisTitle}>{benchmarkAnalysis.title}</Text>
            <Text style={styles.analysisCounts}>{benchmarkAnalysis.counts}</Text>
          </View>
          <Pressable accessibilityRole="button" style={styles.analysisLink}>
            <Text style={styles.analysisLinkText}>{benchmarkAnalysis.link}</Text>
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <Path
                d="M5.2 3l4 4-4 4"
                stroke={colors.pine800}
                strokeWidth={1.3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        </View>
        <Text numberOfLines={2} style={styles.analysisBody}>
          {benchmarkAnalysis.body}
        </Text>
      </View>
    </View>
  );
}

function Card({ radius, children }: { radius: number; children: ReactNode }) {
  return <View style={[styles.card, { borderRadius: radius }]}>{children}</View>;
}

function CardHeader({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function UnitChip({ unit, onToggle }: { unit: Unit; onToggle: () => void }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Units: ₹ ${unit}. Switch to ₹ ${unit === "Mn" ? "Cr" : "Mn"}`}
      onPress={onToggle}
      {...hover.handlers}
      style={[styles.chip, hover.hovered && styles.chipHover]}
    >
      <Text style={styles.chipText}>₹ {unit}</Text>
      <Icon name="unitCaret" size={14} />
    </Pressable>
  );
}

function FilterChip({ label }: { label: string }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      {...hover.handlers}
      style={[styles.chip, styles.chipLarge, hover.hovered && styles.chipHover]}
    >
      <Text style={styles.chipText}>{label}</Text>
      <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
        <Path
          d="M3 4.8l3 3 3-3"
          stroke={colors.slate500}
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Starts 20px up under the header card (whose bottom edge is 8px into the bar) and spans the column.
  subTabs: {
    alignSelf: "stretch",
    flexDirection: "row",
    marginTop: -20,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  subTab: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    marginBottom: -8,
    ...pointer,
  },
  subTabText: {
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.13,
  },
  underline: {
    position: "absolute",
    left: "50%",
    marginLeft: -30,
    bottom: 0,
    width: 60,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.pine800,
  },
  analysis: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 9,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f0f5f4",
    borderWidth: 1,
    borderColor: colors.white,
  },
  analysisIcon: { width: 19, height: 20, marginTop: 1 },
  analysisMain: { flex: 1, gap: 5 },
  analysisHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  analysisTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  analysisTitle: {
    fontFamily: fonts.geistMedium,
    fontSize: 12,
    lineHeight: 20,
    color: colors.slate900,
  },
  analysisCounts: {
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.slate500,
  },
  analysisLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 8,
    ...pointer,
  },
  analysisLinkText: {
    fontFamily: fonts.geistRegular,
    fontSize: 12,
    lineHeight: 20,
    color: colors.pine800,
  },
  analysisBody: {
    fontFamily: fonts.geistRegular,
    fontSize: 12,
    lineHeight: 20,
    color: colors.slate600,
    paddingRight: 20,
  },
  card: {
    alignSelf: "stretch",
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.white,
    paddingTop: 12,
    paddingBottom: 2,
  },
  cardPressable: { alignSelf: "stretch" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    minHeight: 28,
  },
  cardTitle: {
    fontFamily: fonts.geistMedium,
    fontSize: 12,
    lineHeight: 22,
    letterSpacing: 0.6,
    color: colors.slate800,
    textTransform: "uppercase",
  },
  tools: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconPair: { flexDirection: "row", gap: 4 },
  divider: { width: 1, height: 14, borderRadius: 100, backgroundColor: colors.slate200 },
  tableWrap: { marginTop: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 20,
    paddingLeft: 8,
    paddingRight: 4,
    borderRadius: 40,
    backgroundColor: colors.shark50,
    ...pointer,
    ...transition(["background-color"]),
  },
  chipLarge: { height: 24 },
  chipHover: { backgroundColor: colors.slate100 },
  chipText: {
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.grey700,
  },
});
