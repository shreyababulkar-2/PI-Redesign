import { ReactNode, useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
import { IconName } from "../../assets/icons";
import { WithTooltip } from "../Tooltip";
import { COMPARISON_MENU_ITEMS, KebabMenu } from "../note/KebabMenu";
import { pointer } from "../../theme/cursor";
import { appear, leaving, press, transition } from "../../theme/motion";
import {
  BenchmarkTable,
  createScrollGroup,
  TableItem,
  Unit,
} from "./BenchmarkTable";

/**
 * Benchmarking tab (Figma "Benchmarking - New", 373:23715): a sub-tab bar, the analysis summary and two
 * comparison cards. Returned as siblings so the screen's scroll list spaces them like the other pages.
 */
export function BenchmarkingPage() {
  const { benchTab } = useActiveTab();
  const overallItems = useMemo<TableItem[]>(
    () => [
      { type: "header" },
      { type: "gap", height: 4 },
      { type: "company", company: overallCompany },
      { type: "stat", label: "All companies: Mean", values: overallStats.mean },
      {
        type: "stat",
        label: "All companies: Median",
        values: overallStats.median,
      },
    ],
    [],
  );
  const categoryItems = useMemo<TableItem[]>(() => {
    const items: TableItem[] = [{ type: "header" }, { type: "gap", height: 4 }];
    categoryGroups.forEach((g, i) => {
      if (i > 0) items.push({ type: "gap", height: 8 });
      items.push({ type: "title", text: g.title }, { type: "gap", height: 4 });
      g.companies.forEach((company) =>
        items.push({ type: "company", company }),
      );
      items.push(
        { type: "stat", label: "All companies: Mean", values: g.mean },
        { type: "stat", label: "All companies: Median", values: g.median },
      );
    });
    return items;
  }, []);
  // Both tables share one horizontal scroll position.
  const [scrollGroup] = useState(createScrollGroup);
  // Market cap and EV are shown in ₹ Mn or ₹ Cr; the chip in the first card flips both tables.
  const [unit, setUnit] = useState<Unit>("Mn");

  return (
    <>
      <SubTabs />
      <Analysis />

      <Card key={`overall-${benchTab}`} radius={10} index={2}>
        <CardHeader title="Overall comparison">
          <View style={styles.tools}>
            <WithTooltip text="Switch units" side="bottom">
              <UnitChip
                unit={unit}
                onToggle={() => setUnit((u) => (u === "Mn" ? "Cr" : "Mn"))}
              />
            </WithTooltip>
            <View style={styles.divider} />
            <View style={styles.iconPair}>
              <IconTool icon="tableExpand" label="Expand" />
              <IconTool icon="tableComments" label="Comments" />
              <KebabMenu items={COMPARISON_MENU_ITEMS} width={195}>
                {({ open, toggle }) => (
                  <WithTooltip text="More" side="bottom" disabled={open}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="More"
                      accessibilityState={{ expanded: open }}
                      onPress={toggle}
                      style={({ pressed }) => press(pressed)}
                    >
                      <Icon name="tableMore" size={28} style={pointer} />
                    </Pressable>
                  </WithTooltip>
                )}
              </KebabMenu>
            </View>
          </View>
        </CardHeader>
        <View style={styles.tableWrap}>
          <BenchmarkTable
            items={overallItems}
            unit={unit}
            scrollGroup={scrollGroup}
          />
        </View>
      </Card>

      <View key={`category-${benchTab}`} style={styles.cardPressable}>
        <Card radius={12} index={3}>
          <CardHeader title="Category-wise comparison">
            <View style={styles.tools}>
              <FilterChip label="By Regulatory classification" />
              <View style={styles.divider} />
              <IconTool icon="tableComments" label="Comments" />
            </View>
          </CardHeader>
          <View style={styles.tableWrap}>
            <BenchmarkTable
              items={categoryItems}
              rowAction
              unit={unit}
              scrollGroup={scrollGroup}
            />
          </View>
        </Card>
      </View>
    </>
  );
}

/** A 28px icon button in a card header (Figma "Segmented Control"): press feedback and a tooltip below it. */
function IconTool({ icon, label }: { icon: IconName; label: string }) {
  return (
    <WithTooltip text={label} side="bottom">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => press(pressed)}
      >
        <Icon name={icon} size={28} style={pointer} />
      </Pressable>
    </WithTooltip>
  );
}

/**
 * Sub-tabs under the page header. The chosen one is dark and a short green underline slides to it (rather than
 * disappearing from one tab and appearing on another).
 */
function SubTabs() {
  const { benchTab, setBenchTab, switching } = useActiveTab();
  const [layouts, setLayouts] = useState<
    Record<number, { x: number; y: number; width: number; height: number }>
  >({});
  const active = layouts[benchTab];
  return (
    <View
      style={[styles.subTabs, appear(0), leaving(switching)]}
      accessibilityRole="tablist"
    >
      {BENCHMARK_TABS.map((label, i) => (
        <SubTab
          key={label}
          label={label}
          active={i === benchTab}
          disabled={i === BENCHMARK_TABS.length - 1}
          onPress={() => setBenchTab(i)}
          onLayout={(e: LayoutChangeEvent) => {
            const l = e.nativeEvent.layout;
            setLayouts((prev) =>
              prev[i] &&
              prev[i].x === l.x &&
              prev[i].width === l.width &&
              prev[i].y === l.y
                ? prev
                : { ...prev, [i]: l },
            );
          }}
        />
      ))}
      {/* Mounted once the active tab has been measured, so it starts in place and only moves on later changes. */}
      {active && (
        <View
          pointerEvents="none"
          style={[
            styles.underline,
            {
              left: active.x + active.width / 2 - 30,
              top: active.y + active.height - 2,
            },
            transition(["left", "top"], 220),
          ]}
        />
      )}
    </View>
  );
}

function SubTab({
  label,
  active,
  disabled = false,
  onPress,
  onLayout,
}: {
  label: string;
  active: boolean;
  /** Not built yet: looks like the other tabs but does nothing. */
  disabled?: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      onLayout={onLayout}
      {...hover.handlers}
      style={[styles.subTab, disabled && { cursor: "default" as never }]}
    >
      <Text
        style={[
          styles.subTabText,
          {
            color:
              active || (hover.hovered && !disabled)
                ? colors.slate700
                : colors.slate500,
          },
          transition(["color"], 200),
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Analysis() {
  return (
    <View
      style={[styles.analysis, appear(1), leaving(useActiveTab().switching)]}
    >
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
            <Text style={styles.analysisCounts}>
              {benchmarkAnalysis.counts}
            </Text>
          </View>
          <Pressable accessibilityRole="button" style={styles.analysisLink}>
            <Text style={styles.analysisLinkText}>
              {benchmarkAnalysis.link}
            </Text>
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

function Card({
  radius,
  index,
  children,
}: {
  radius: number;
  index: number;
  children: ReactNode;
}) {
  return (
    <View style={[styles.card, { borderRadius: radius }, appear(index)]}>
      {children}
    </View>
  );
}

function CardHeader({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
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
      style={({ pressed }) => [
        styles.chip,
        hover.hovered && styles.chipHover,
        press(pressed),
      ]}
    >
      <Text style={styles.chipText}>₹ {unit}</Text>
      <Icon name="unitCaret" size={14} />
    </Pressable>
  );
}

/** A plain label pill (Figma 499:17736): it states how the table is grouped and is not interactive. */
function FilterChip({ label }: { label: string }) {
  return (
    <View style={[styles.chip, styles.chipLarge, styles.chipStatic]}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
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
    // Above the table below, so the header's dropdowns aren't painted underneath it.
    zIndex: 5,
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
  divider: {
    width: 1,
    height: 14,
    borderRadius: 100,
    backgroundColor: colors.slate200,
  },
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
  chipStatic: { paddingRight: 8, cursor: "default" as never },
  chipHover: { backgroundColor: colors.slate100 },
  chipText: {
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.grey700,
  },
});
