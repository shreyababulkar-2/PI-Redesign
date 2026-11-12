import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, fonts } from "../theme";
import { Icon } from "./Icon";
import { FadeIn } from "./assistant/FadeIn";
import { IconName } from "../assets/icons";
import { pointer } from "../theme/cursor";
import { press, transition } from "../theme/motion";
import { useHover } from "../hooks/useHover";

/** Side nav levels (Figma 499:3860): L1 shows the product mark at the top, L2 a back chevron. */
export type NavLevel = "L1" | "L2";

/** Main destinations. The active one is a pale-green tile with the filled icon. */
const NAV_ITEMS: {
  key: string;
  label: string;
  icon: IconName;
  activeIcon: IconName;
}[] = [
  {
    key: "feed",
    label: "News feed",
    icon: "navFeed",
    activeIcon: "navFeedActive",
  },
  {
    key: "deals",
    label: "Active deals",
    icon: "navDeals",
    activeIcon: "navDealsActive",
  },
  {
    key: "benchmarking",
    label: "Benchmarking",
    icon: "navBenchmark",
    activeIcon: "navBenchmarkActive",
  },
  {
    key: "management",
    label: "Management",
    icon: "navManage",
    activeIcon: "navManageActive",
  },
  {
    key: "prospecting",
    label: "Prospecting",
    icon: "navProspect",
    activeIcon: "navProspectActive",
  },
];

/** Account items that fold away under the caret, top to bottom. */
const ACCOUNT_ITEMS: { label: string; icon: IconName }[] = [
  { label: "Help & support", icon: "navBottom3Light" },
  { label: "Report a bug", icon: "navBottom2Light" },
  { label: "Accessibility", icon: "navBottom4Light" },
];

/** `?navLevel=L1` previews the other level; the app itself sits inside a deal, so it defaults to L2. */
function readLevel(): NavLevel {
  if (Platform.OS !== "web" || typeof window === "undefined") return "L2";
  try {
    return new URLSearchParams(window.location.search)
      .get("navLevel")
      ?.toUpperCase() === "L1"
      ? "L1"
      : "L2";
  } catch {
    return "L2";
  }
}

/**
 * The floating green pod (Figma "Side nav", 499:3860): a top control (product mark or back chevron), the five
 * destinations between two hairlines, and a caret that expands the pod in place to reveal help, bug report
 * and accessibility. Hovering an item lights its tile and shows its name beside the pod.
 */
export function SideNav({ level = readLevel() }: { level?: NavLevel }) {
  const [activeKey, setActiveKey] = useState("deals");
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.pod}>
      {level === "L1" ? <Icon name="navLogo" size={28} /> : <BackButton />}

      <View style={styles.group}>
        <Divider />
        <View style={styles.list}>
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.key}
              label={item.label}
              icon={item.icon}
              activeIcon={item.activeIcon}
              active={item.key === activeKey}
              onPress={() => setActiveKey(item.key)}
            />
          ))}
        </View>
        <Divider />
      </View>

      <View style={styles.more}>
        <CaretButton
          expanded={expanded}
          onPress={() => setExpanded((v) => !v)}
        />
        {/* Always mounted: it opens by growing its height and fading, so the pod eases downward. */}
        <View
          aria-hidden={!expanded}
          pointerEvents={expanded ? "auto" : "none"}
          style={[
            styles.account,
            {
              maxHeight: expanded ? 104 : 0,
              opacity: expanded ? 1 : 0,
              marginTop: expanded ? 8 : 0,
            },
            transition(["max-height", "opacity", "margin-top"], 240),
          ]}
        >
          {ACCOUNT_ITEMS.map((item) => (
            <NavButton
              key={item.label}
              label={item.label}
              icon={item.icon}
              tabIndex={expanded ? 0 : -1}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

/** Figma's group dividers are zero-height lines: they sit on the group's edge and take no layout space. */
function Divider() {
  return (
    <View style={styles.divider}>
      <Icon name="navDividerLight" size={20} height={1} />
    </View>
  );
}

type NavButtonProps = {
  label: string;
  icon: IconName;
  /** Filled icon shown on the pale-green tile when this is the active destination. */
  activeIcon?: IconName;
  active?: boolean;
  tabIndex?: 0 | -1;
  onPress?: () => void;
};

/** A 32px tile: soft white fill on hover, pale green when active, with its name in a tooltip while hovered. */
function NavButton({
  label,
  icon,
  activeIcon,
  active = false,
  tabIndex,
  onPress,
}: NavButtonProps) {
  const hover = useHover();
  return (
    <View style={styles.slot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={activeIcon ? { selected: active } : undefined}
        tabIndex={tabIndex}
        onPress={onPress}
        {...hover.handlers}
        style={({ pressed }) => [
          styles.tile,
          active ? styles.tileActive : hover.hovered && styles.tileHover,
          press(pressed),
        ]}
      >
        <Icon name={active && activeIcon ? activeIcon : icon} size={20} />
      </Pressable>
      {hover.hovered && <SideTooltip label={label} left={42} />}
    </View>
  );
}

/** The white tooltip beside the pod: 4px from its edge, centred on the 32px tile (or 28px button) it names. */
function SideTooltip({
  label,
  left,
  top = 3,
}: {
  label: string;
  left: number;
  top?: number;
}) {
  return (
    <FadeIn rise={0} duration={120} style={{ ...styles.tooltip, left, top }}>
      <Text numberOfLines={1} style={styles.tooltipText}>
        {label}
      </Text>
    </FadeIn>
  );
}

/** The back chevron at the top of the L2 pod. */
function BackButton() {
  const hover = useHover();
  return (
    <View style={styles.collapseSlot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        {...hover.handlers}
        style={({ pressed }) => [
          styles.collapse,
          hover.hovered && styles.collapseHover,
          press(pressed),
        ]}
      >
        <Icon name="navCollapseLight" size={16} />
      </Pressable>
      {hover.hovered && <SideTooltip label="Back" left={40} top={1} />}
    </View>
  );
}

function CaretButton({
  expanded,
  onPress,
}: {
  expanded: boolean;
  onPress: () => void;
}) {
  const hover = useHover();
  const color = "rgba(255,255,255,0.6)";
  return (
    <View style={styles.collapseSlot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? "Show fewer items" : "Show more items"}
        accessibilityState={{ expanded }}
        onPress={onPress}
        {...hover.handlers}
        style={({ pressed }) => [
          styles.caret,
          hover.hovered && styles.tileHover,
          press(pressed),
        ]}
      >
        <Svg
          width={20}
          height={20}
          viewBox="0 0 20 20"
          style={[
            { transform: [{ rotate: expanded ? "180deg" : "0deg" }] },
            transition(["transform"], 240) as object,
          ]}
        >
          <Path
            d="M6.4 8.4H13.6L10 12.2Z"
            fill={color}
            stroke={color}
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
      {hover.hovered && (
        <SideTooltip
          label={expanded ? "Show less" : "Show more"}
          left={40}
          top={1}
        />
      )}
    </View>
  );
}

/** Lets the account list's tooltips poke out sideways while its height is still clipped (web). */
const clipVertically = (
  Platform.OS === "web"
    ? { clipPath: "inset(0px -200px)" }
    : { overflow: "hidden" }
) as ViewStyle;

const styles = StyleSheet.create({
  pod: {
    position: "absolute",
    left: 4,
    top: 8,
    width: 44,
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 10,
    gap: 16,
    borderRadius: 10,
    backgroundColor: colors.pine800,
    boxShadow: "0px 1px 4px rgba(0,0,0,0.1)",
    zIndex: 30,
  },
  // A 28px slot that holds the button and its tooltip.
  collapseSlot: { width: 28, height: 28, position: "relative" },
  collapseHover: { backgroundColor: "rgba(255,255,255,0.2)" },
  collapse: {
    width: 28,
    height: 28,
    padding: 4,
    borderRadius: 8,
    backgroundColor: colors.white10,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
  },
  group: { alignItems: "center", gap: 12 },
  divider: { height: 0, alignSelf: "stretch", alignItems: "center" },
  list: { gap: 8 },
  slot: { width: 32, height: 32, position: "relative" },
  tile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
    ...transition(["background-color"]),
  },
  tileHover: { backgroundColor: colors.white10 },
  tileActive: { backgroundColor: colors.pine100 },
  // The tooltip sits 4px beyond the pod's edge (the slot is 6px inside it) and is centred on the tile.
  tooltip: {
    position: "absolute",
    left: 42,
    top: 3,
    height: 26,
    paddingHorizontal: 8,
    justifyContent: "center",
    borderRadius: 4,
    backgroundColor: colors.white,
    boxShadow: "0px 2px 8px rgba(0,0,0,0.12)",
    zIndex: 60,
  },
  tooltipText: {
    fontFamily: fonts.geistSemiBold,
    fontSize: 11,
    lineHeight: 18,
    color: "#2b303b",
  },
  more: { alignItems: "center" },
  caret: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
    ...transition(["background-color"]),
  },
  account: { gap: 4, alignItems: "center", ...clipVertically },
});
