import { ComponentRef, ReactNode, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { colors, fonts } from "../../theme";
import { IconName } from "../../assets/icons";
import { pointer } from "../../theme/cursor";
import { transition } from "../../theme/motion";
import { useHover } from "../../hooks/useHover";
import { Icon } from "../Icon";
import { FadeIn } from "../assistant/FadeIn";

/** Page actions under the kebab (Figma 441:32753). */
/** `icon`/`hover` are optional: text-only menus (the tab switcher) omit them. */
export type MenuItem = {
  label: string;
  icon?: IconName;
  hover?: IconName;
  subtitle?: string;
  /** Small green status after the title, e.g. "Published" on the latest version. */
  badge?: string;
};

export const PAGE_MENU_ITEMS: MenuItem[] = [
  { label: "All comments", icon: "menuComments", hover: "menuCommentsDark" },
  { label: "Notification settings", icon: "menuBell", hover: "menuBellDark" },
  {
    label: "Global instructions",
    icon: "menuInstructions",
    hover: "menuInstructionsDark",
  },
  { label: "User activity", icon: "menuActivity", hover: "menuActivityDark" },
  { label: "Notes", icon: "menuNotes", hover: "menuNotesDark" },
];

/**
 * The page menu once the header has scrolled into its floating form (Figma 507:10399): the Download and Manage
 * members buttons that left the bar move in on top of the usual actions.
 */
export const SCROLLED_MENU_ITEMS: MenuItem[] = [
  { label: "Download", icon: "menuSave", hover: "menuSaveDark" },
  { label: "Manage members", icon: "menuMembers", hover: "menuMembersDark" },
  ...PAGE_MENU_ITEMS,
];

/** Section-level actions under a section card's "more" button (Figma 448:33700). */
export const SECTION_MENU_ITEMS: MenuItem[] = [
  { label: "Edit", icon: "menuEdit", hover: "menuEditDark" },
  { label: "Regenerate", icon: "menuRegenerate", hover: "menuRegenerateDark" },
  { label: "Download", icon: "menuDownload", hover: "menuDownloadDark" },
];

/** Closes whichever menu is open, so opening another one never leaves two showing. */
let closeOpenMenu: (() => void) | null = null;

type Props = {
  /** The trigger button, given the open state and a toggle; the menu opens 6px below it, right-aligned. */
  children: (state: { open: boolean; toggle: () => void }) => ReactNode;
  items?: MenuItem[];
  style?: ViewStyle;
  /** Overrides where the menu sits relative to the trigger (default: below it, right-aligned). */
  placement?: ViewStyle;
  /** Marks one row as the current choice (pale green fill). */
  selected?: string;
  onSelect?: (label: string) => void;
  minWidth?: number;
  /** Fixed menu width, for the page menus (171 in Figma). */
  width?: number;
};

/** Wraps a kebab button and shows the page actions menu under it when pressed. */
export function KebabMenu({
  children,
  items = PAGE_MENU_ITEMS,
  style,
  placement,
  selected,
  onSelect,
  minWidth,
  width,
}: Props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<ComponentRef<typeof View>>(null);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    closeOpenMenu?.();
    closeOpenMenu = close;
    // Scrolling closes the menu: it is anchored to a button that moves away. Scroll events don't bubble, so
    // listen in the capture phase to catch the page's inner scroll view.
    // Wheel and touch moves cover the moment before the scroll event, and scroll containers that don't emit one.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // Clicking (or tapping) anywhere outside the trigger and menu closes it, whatever is under the pointer, and
    // the click still reaches that element. Pointer down in the capture phase so nothing can swallow it first.
    const onPointerDown = (e: PointerEvent) => {
      const anchor = anchorRef.current as unknown as HTMLElement | null;
      if (anchor && e.target instanceof Node && anchor.contains(e.target))
        return;
      close();
    };
    if (Platform.OS === "web") {
      document.addEventListener("keydown", onKey);
      document.addEventListener("pointerdown", onPointerDown, true);
    }
    const events = ["scroll", "wheel", "touchmove"];
    if (Platform.OS === "web")
      events.forEach((e) =>
        document.addEventListener(e, close, { capture: true, passive: true }),
      );
    return () => {
      if (closeOpenMenu === close) closeOpenMenu = null;
      if (Platform.OS === "web") {
        document.removeEventListener("keydown", onKey);
        document.removeEventListener("pointerdown", onPointerDown, true);
      }
      if (Platform.OS === "web")
        events.forEach((e) => document.removeEventListener(e, close, true));
    };
  }, [open]);
  return (
    <View ref={anchorRef} style={[styles.anchor, style]}>
      {children({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <>
          {/* Native click-away layer. On web a document-level listener does this (see above), so that clicks on
              the assistant, side nav and other panels close the menu too. */}
          {Platform.OS !== "web" && (
            <Pressable
              accessibilityLabel="Close menu"
              onPress={() => setOpen(false)}
              style={styles.backdrop}
            />
          )}
          {/* Eases in from just above (a small drop and fade); the wrapper carries the placement. */}
          <FadeIn
            rise={-4}
            duration={140}
            style={{ ...styles.placement, ...placement }}
          >
            <View
              accessibilityRole="menu"
              style={[
                styles.menu,
                items === PAGE_MENU_ITEMS && styles.menuPage,
                minWidth ? { minWidth } : null,
                width ? { width } : null,
              ]}
            >
              {items.map((item) => (
                <MenuRow
                  key={item.label}
                  {...item}
                  selected={item.label === selected}
                  onPress={() => {
                    setOpen(false);
                    onSelect?.(item.label);
                  }}
                />
              ))}
            </View>
          </FadeIn>
        </>
      )}
    </View>
  );
}

function MenuRow({
  label,
  icon,
  hover: hoverIcon,
  subtitle,
  badge,
  selected = false,
  onPress,
}: {
  label: string;
  subtitle?: string;
  badge?: string;
  icon?: IconName;
  hover?: IconName;
  selected?: boolean;
  onPress: () => void;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={onPress}
      {...hover.handlers}
      style={[
        styles.row,
        subtitle ? styles.rowTwoLine : null,
        selected && styles.rowSelected,
        selected && subtitle ? styles.rowTwoLineSelected : null,
        hover.hovered && !selected && styles.rowHover,
      ]}
    >
      {icon && (
        <Icon name={hover.hovered && hoverIcon ? hoverIcon : icon} size={20} />
      )}
      {subtitle ? (
        <View style={styles.twoLine}>
          <View style={styles.titleRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { lineHeight: 16, color: "#2b303b" },
                (hover.hovered || selected) && styles.labelHover,
                selected && { fontFamily: fonts.geistSemiBold },
              ]}
            >
              {label}
            </Text>
            {badge ? (
              <>
                <View style={styles.badgeDot} />
                <Text numberOfLines={1} style={styles.badgeText}>
                  {badge}
                </Text>
              </>
            ) : null}
          </View>
          <Text
            numberOfLines={1}
            style={[styles.subtitle, selected && { color: "#525866" }]}
          >
            {subtitle}
          </Text>
        </View>
      ) : (
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            (hover.hovered || selected) && styles.labelHover,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  anchor: { position: "relative", zIndex: 50 },
  backdrop: {
    position: "absolute",
    top: -2000,
    left: -2000,
    right: -2000,
    bottom: -2000,
  },
  backdropWeb: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as unknown as ViewStyle,
  placement: { position: "absolute", top: "100%", right: 0, marginTop: 6 },
  menu: {
    minWidth: 122,
    padding: 4,
    gap: 2,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#f2f5f8",
    boxShadow:
      "0px 8px 24px rgba(24,27,37,0.1), 0px 1px 3px rgba(24,27,37,0.05)",
  },
  menuPage: { width: 171 },
  row: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 6,
    ...pointer,
    ...transition(["background-color"]),
  },
  rowHover: { backgroundColor: colors.slate100 },
  // Version history rows (Figma 459:41993): title over a 10px subtitle, 50px tall, 8px padding.
  rowTwoLine: { height: "auto", minHeight: 50, padding: 8 },
  rowTwoLineSelected: {},
  titleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  badgeDot: {
    width: 2,
    height: 2,
    borderRadius: 100,
    backgroundColor: "#205b34",
  },
  badgeText: {
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 16,
    color: "#205b34",
  },
  twoLine: { flex: 1, minWidth: 0, gap: 2 },
  subtitle: {
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 16,
    color: "#717784",
  },
  // Current choice in a switcher menu (Figma 459:41704).
  rowSelected: { backgroundColor: "#f0f5f4" },
  label: {
    fontFamily: fonts.geistRegular,
    fontSize: 12,
    lineHeight: 20,
    color: "#525866",
  },
  labelHover: { color: "#2b303b" },
});
