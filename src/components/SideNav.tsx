import { ComponentRef, useEffect, useRef, useState } from "react";
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
import { TEXT_SIZES, TextSizeKey, useTextSize } from "../state/textSize";

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
  const pod = useRef<ComponentRef<typeof View>>(null);
  // While expanded, a click anywhere outside the pod (or Escape) folds it back up.
  useEffect(() => {
    if (!expanded || Platform.OS !== "web") return;
    const onDown = (e: PointerEvent) => {
      const node = pod.current as unknown as HTMLElement | null;
      if (node && !node.contains(e.target as Node)) setExpanded(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);
  return (
    <View ref={pod} style={styles.pod}>
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
          {ACCOUNT_ITEMS.map((item) =>
            item.label === "Accessibility" ? (
              <AccessibilityButton
                key={item.label}
                icon={item.icon}
                tabIndex={expanded ? 0 : -1}
              />
            ) : (
              <NavButton
                key={item.label}
                label={item.label}
                icon={item.icon}
                tabIndex={expanded ? 0 : -1}
              />
            ),
          )}
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

/** The A / A- / A+ glyphs from Figma 519:2733 (16px), drawn in the row's text colour. */
const SIZE_GLYPHS: Record<TextSizeKey, string> = {
  default:
    "M10.145 8.42836C10.0231 8.42836 9.92226 8.38648 9.84231 8.30272C9.76236 8.21896 9.72048 8.11807 9.71667 8.00005C9.71286 7.88202 9.75474 7.78113 9.84231 7.69737C9.92987 7.61362 10.0308 7.57174 10.145 7.57174H13.5715C13.6933 7.57174 13.7942 7.61362 13.8741 7.69737C13.9541 7.78113 13.996 7.88202 13.9998 8.00005C14.0036 8.11807 13.9617 8.21896 13.8741 8.30272C13.7866 8.38648 13.6857 8.42836 13.5715 8.42836H10.145ZM3.57186 9.79894L2.90941 11.5522C2.87134 11.6473 2.81613 11.7216 2.7438 11.7749C2.67146 11.8282 2.58199 11.8548 2.47539 11.8548C2.31168 11.8548 2.18223 11.7863 2.08705 11.6492C1.99187 11.5122 1.97474 11.3675 2.03566 11.2152L4.69117 4.44222C4.72544 4.35085 4.78064 4.27852 4.85679 4.22521C4.93293 4.17191 5.01859 4.14526 5.11377 4.14526H5.47355C5.57254 4.14526 5.66011 4.17191 5.73625 4.22521C5.81239 4.27852 5.86569 4.35085 5.89615 4.44222L8.55738 11.2095C8.61449 11.3694 8.59545 11.516 8.50027 11.6492C8.40509 11.7825 8.27565 11.851 8.11194 11.8548C8.01295 11.8548 7.91967 11.8263 7.83211 11.7692C7.74454 11.7121 7.68363 11.634 7.64936 11.535L6.99262 9.79323H3.57186V9.79894ZM3.88024 8.94233H6.67853L5.31936 5.34453H5.25083L3.88024 8.94233Z",
  medium:
    "M4.07186 9.65368L3.40941 11.4069C3.37134 11.5021 3.31613 11.5763 3.2438 11.6296C3.17146 11.6829 3.08199 11.7096 2.97539 11.7096C2.81168 11.7096 2.68223 11.641 2.58705 11.504C2.49187 11.3669 2.47474 11.2222 2.53566 11.07L5.19117 4.29696C5.22544 4.20559 5.28064 4.13325 5.35679 4.07995C5.43293 4.02665 5.51859 4 5.61377 4H5.97355C6.07254 4 6.16011 4.02665 6.23625 4.07995C6.31239 4.13325 6.36569 4.20559 6.39615 4.29696L9.05738 11.0642C9.11449 11.2241 9.09545 11.3707 9.00027 11.504C8.90509 11.6372 8.77565 11.7058 8.61194 11.7096C8.51295 11.7096 8.41967 11.681 8.33211 11.6239C8.24454 11.5668 8.18363 11.4887 8.14936 11.3898L7.49262 9.64797H4.07186V9.65368ZM4.38024 8.79706H7.17853L5.81936 5.19927H5.75083L4.38024 8.79706Z",
  large:
    "M3.57186 9.79894L2.90941 11.5522C2.87134 11.6473 2.81613 11.7216 2.7438 11.7749C2.67146 11.8282 2.58199 11.8548 2.47539 11.8548C2.31168 11.8548 2.18223 11.7863 2.08705 11.6492C1.99187 11.5122 1.97474 11.3675 2.03566 11.2152L4.69117 4.44222C4.72544 4.35085 4.78064 4.27852 4.85679 4.22521C4.93293 4.17191 5.01859 4.14526 5.11377 4.14526H5.47355C5.57254 4.14526 5.66011 4.17191 5.73625 4.22521C5.81239 4.27852 5.86569 4.35085 5.89615 4.44222L8.55738 11.2095C8.61449 11.3694 8.59545 11.516 8.50027 11.6492C8.40509 11.7825 8.27565 11.851 8.11194 11.8548C8.01295 11.8548 7.91967 11.8263 7.83211 11.7692C7.74454 11.7121 7.68363 11.634 7.64936 11.535L6.99262 9.79323H3.57186V9.79894ZM3.88024 8.94233H6.67853L5.31936 5.34453H5.25083L3.88024 8.94233ZM11.4299 8.42836H10.145C10.0231 8.42836 9.92226 8.38648 9.84231 8.30272C9.76236 8.21896 9.72048 8.11807 9.71667 8.00005C9.71286 7.88202 9.75474 7.78113 9.84231 7.69737C9.92987 7.61362 10.0308 7.57174 10.145 7.57174H11.4299V6.28681C11.4299 6.16498 11.4718 6.06409 11.5555 5.98414C11.6393 5.90419 11.7402 5.86231 11.8582 5.8585C11.9762 5.85469 12.0771 5.89657 12.1609 5.98414C12.2446 6.0717 12.2865 6.17259 12.2865 6.28681V7.57174H13.5715C13.6933 7.57174 13.7942 7.61362 13.8741 7.69737C13.9541 7.78113 13.996 7.88202 13.9998 8.00005C14.0036 8.11807 13.9617 8.21896 13.8741 8.30272C13.7866 8.38648 13.6857 8.42836 13.5715 8.42836H12.2865V9.71328C12.2865 9.83511 12.2446 9.936 12.1609 10.016C12.0771 10.0959 11.9762 10.1378 11.8582 10.1416C11.7402 10.1454 11.6393 10.1035 11.5555 10.016C11.4718 9.92839 11.4299 9.8275 11.4299 9.71328V8.42836Z",
};

/**
 * The Accessibility button and its text-size menu (Figma 519:2733). The menu opens beside the pod, closes on
 * outside click or Escape, and changes only the size of the reading content, never the interface.
 */
function AccessibilityButton({
  icon,
  tabIndex,
}: {
  icon: IconName;
  tabIndex?: 0 | -1;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<ComponentRef<typeof View>>(null);
  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    const onDown = (e: PointerEvent) => {
      const node = wrap.current as unknown as HTMLElement | null;
      if (node && !node.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const hover = useHover();
  return (
    <View ref={wrap} style={styles.slot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Accessibility"
        accessibilityState={{ expanded: open }}
        tabIndex={tabIndex}
        onPress={() => setOpen((v) => !v)}
        {...hover.handlers}
        style={({ pressed }) => [
          styles.tile,
          (open || hover.hovered) && styles.tileHover,
          press(pressed),
        ]}
      >
        <Icon name={icon} size={20} />
      </Pressable>
      {hover.hovered && !open && (
        <SideTooltip label="Accessibility" left={42} />
      )}
      {open && <TextSizeMenu onDone={() => setOpen(false)} />}
    </View>
  );
}

/** Three rows (Default 12px, Medium 14px, Large 16px), each set in its own size so the choice previews itself. */
function TextSizeMenu({ onDone }: { onDone: () => void }) {
  const { size, setSize } = useTextSize();
  return (
    <FadeIn rise={0} duration={140} style={styles.sizeMenu}>
      <View accessibilityRole="radiogroup" style={styles.sizeList}>
        {TEXT_SIZES.map((s) => (
          <SizeRow
            key={s.key}
            label={s.label}
            px={s.px}
            glyph={SIZE_GLYPHS[s.key]}
            selected={s.key === size}
            onPress={() => {
              setSize(s.key);
              onDone();
            }}
          />
        ))}
      </View>
    </FadeIn>
  );
}

function SizeRow({
  label,
  px,
  glyph,
  selected,
  onPress,
}: {
  label: string;
  px: number;
  glyph: string;
  selected: boolean;
  onPress: () => void;
}) {
  const hover = useHover();
  const color = selected ? colors.pine800 : "#525866";
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label} text size, ${px} pixels`}
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.sizeRow,
        selected
          ? styles.sizeRowSelected
          : hover.hovered && styles.sizeRowHover,
        press(pressed),
      ]}
    >
      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        <Path d={glyph} fill={color} />
      </Svg>
      <Text
        style={{
          fontFamily: selected ? fonts.geistMedium : fonts.geistRegular,
          fontSize: px,
          lineHeight: 16,
          color: selected ? colors.pine800 : "#525866",
        }}
      >
        {label}
      </Text>
    </Pressable>
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
  // Beside the pod like the tooltips (4px off its edge), its bottom edge level with the button's.
  sizeMenu: {
    position: "absolute",
    left: 42,
    bottom: -4,
    padding: 5,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#f2f5f8",
    boxShadow:
      "0px 8px 24px rgba(24,27,37,0.1), 0px 1px 3px rgba(24,27,37,0.05)",
    zIndex: 70,
  },
  sizeList: { gap: 2, minWidth: 96 },
  sizeRow: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    ...pointer,
    ...transition(["background-color"]),
  },
  sizeRowHover: { backgroundColor: colors.slate100 },
  sizeRowSelected: { backgroundColor: "#f0f5f4" },
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
