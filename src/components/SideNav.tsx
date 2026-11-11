import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, type } from '../theme';
import { Icon } from './Icon';
import { IconName } from '../assets/icons';
import { pointer } from '../theme/cursor';
import { transition } from '../theme/motion';
import { useHover } from '../hooks/useHover';
import { useDesignOptions } from '../state/designOptions';

const NAV_ITEMS: IconName[] = ['navItem1', 'navItemSelected', 'navItem2', 'navItem3', 'navItem4', 'navItem5'];
const SELECTED: IconName = 'navItemSelected';

/** Account/utility items that fold away under the caret and open as a flyout on hover. */
const FLYOUT: { icon: IconName; label: string }[] = [
  { icon: 'navBottom1', label: 'Notifications' },
  { icon: 'navBottom2', label: 'Report a bug' },
  { icon: 'navBottom3', label: 'Help & support' },
];

/** Icons for the green pod are white at 60% opacity, so they are separate files. */
const LIGHT: Partial<Record<IconName, IconName>> = {
  navItem1: 'navItem1Light',
  navItem2: 'navItem2Light',
  navItem3: 'navItem3Light',
  navItem4: 'navItem4Light',
  navItem5: 'navItem5Light',
  navBottom1: 'navBottom1Light',
  navBottom2: 'navBottom2Light',
  navBottom3: 'navBottom3Light',
};

/** `popout` keeps the account items in a hover flyout; `inplace` expands the pod itself. */
export function SideNav() {
  const { sideNav, sideNavLayout } = useDesignOptions();
  const green = sideNav === 'green';
  return sideNavLayout === 'inplace' ? <SideNavExpanding green={green} /> : <SideNavFlyout green={green} />;
}

/** The divider-bracketed list of main navigation items shared by both layouts. */
function NavGroup({ green, closeDivider }: { green: boolean; closeDivider: boolean }) {
  return (
    <View style={styles.group}>
      <Icon name={green ? 'navDividerLight' : 'navDivider'} size={20} height={1} />
      <View style={styles.list}>
        {NAV_ITEMS.map((icon) =>
          icon === SELECTED ? (
            <View key={icon} style={styles.itemSlot}>
              {green ? (
                <View style={[styles.selected, styles.selectedOnGreen]}>
                  <Icon name="navItemSelectedGreen" size={17.778} />
                </View>
              ) : (
                <View style={[styles.selected, styles.selectedOnWhite]}>
                  <Icon name="navSelectedBg" size={32} style={StyleSheet.absoluteFill} />
                  <Icon name={icon} size={20} />
                </View>
              )}
            </View>
          ) : (
            <View key={icon} style={[styles.itemSlot, styles.item]}>
              <Icon name={green ? (LIGHT[icon] ?? icon) : icon} size={20} />
            </View>
          ),
        )}
      </View>
      {closeDivider && <Icon name={green ? 'navDividerLight' : 'navDivider'} size={20} height={1} />}
    </View>
  );
}

function CollapseButton({ green }: { green: boolean }) {
  return (
    <View style={[styles.collapse, green ? styles.collapseGreen : styles.collapseWhite]}>
      <Icon name={green ? 'navCollapseLight' : 'navCollapse'} size={16} />
    </View>
  );
}

/**
 * Pop-out layout: one floating pod on the left edge (white or green, see the design options menu). The account
 * and utility items are tucked under the caret at the bottom: hovering the caret opens them as a flyout
 * to the right.
 */
function SideNavFlyout({ green }: { green: boolean }) {
  return (
    <View style={[styles.pod, green ? styles.podGreen : styles.podWhite]}>
      <CollapseButton green={green} />
      {/* The white pod also closes the group with a divider; the green one does not. */}
      <NavGroup green={green} closeDivider={!green} />
      <MoreCaret green={green} />
    </View>
  );
}

/** Account items in the in-place layout, top to bottom (Figma 401:3498): bell, help, bug, then the avatar. */
const EXPANDED_ITEMS: { icon: IconName; label: string }[] = [
  { icon: 'navBottom1', label: 'Notifications' },
  { icon: 'navBottom3', label: 'Help & support' },
  { icon: 'navBottom2', label: 'Report a bug' },
];

/**
 * In-place layout (Figma 401:3745): the same pod, but the caret expands it in place. Clicking it flips the caret
 * up and the pod grows downward to show the account items and avatar; clicking again folds it back.
 */
function SideNavExpanding({ green }: { green: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hover = useHover();
  const caretColor = green ? 'rgba(255,255,255,0.6)' : colors.slate500;
  return (
    <View style={[styles.pod, green ? styles.podGreen : styles.podWhiteB]}>
      <CollapseButton green={green} />
      <View style={styles.groupB}>
        {/* Green only closes the group with a divider once expanded. */}
        <NavGroup green={green} closeDivider={!green || expanded} />
        <View style={styles.moreB}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Show fewer items' : 'Show more items'}
            accessibilityState={{ expanded }}
            onPress={() => setExpanded((v) => !v)}
            {...hover.handlers}
            style={[
              styles.caretB,
              hover.hovered && (green ? styles.caretOpenGreen : styles.caretOpenWhite),
            ]}
          >
            <Svg width={20} height={20} viewBox="0 0 20 20" style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
              <Path d="M6.4 8.4H13.6L10 12.2Z" fill={caretColor} stroke={caretColor} strokeWidth={0.8} strokeLinejoin="round" />
            </Svg>
          </Pressable>
          {expanded && (
            <View style={styles.expandedList}>
              {EXPANDED_ITEMS.map(({ icon, label }) => (
                <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} style={[styles.itemSlot, styles.item]}>
                  <Icon name={green ? (LIGHT[icon] ?? icon) : icon} size={20} />
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" accessibilityLabel="My profile" style={[styles.roleB, green && styles.roleBGreen]}>
                <View style={styles.avatarB}>
                  <Text style={styles.avatarText}>A</Text>
                </View>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

/** The caret that hides the account items. Hovering turns it to point right and opens the flyout. */
function MoreCaret({ green }: { green: boolean }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  // Opening is instant; closing waits a beat so the pointer can travel from the caret into the flyout
  // (hover can briefly drop while crossing between the two).
  const handlers = useMemo(
    () => ({
      onHoverIn: () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setOpen(true);
      },
      onHoverOut: () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setOpen(false), 120);
      },
    }),
    [],
  );
  const caretColor = green ? (open ? colors.white : 'rgba(255,255,255,0.6)') : open ? colors.pine800 : colors.slate500;
  return (
    // A Pressable (not a View) because only Pressable reports hover on web; its flyout child counts as inside.
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Notifications, help and profile"
      accessibilityState={{ expanded: open }}
      {...handlers}
      style={styles.caretWrap}
    >
      <View style={[styles.caret, open && (green ? styles.caretOpenGreen : styles.caretOpenWhite)]}>
        <Svg width={20} height={20} viewBox="0 0 20 20" style={{ transform: [{ rotate: open ? '-90deg' : '0deg' }] }}>
          <Path
            d="M6.4 8.4H13.6L10 12.2Z"
            fill={caretColor}
            stroke={caretColor}
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      {open && (
        // The left padding bridges the gap between the pod and the flyout so the pointer can cross it.
        <Pressable {...handlers} style={[styles.flyoutHit, { top: green ? -42 : -46 }]}>
          <View style={styles.flyout}>
            {FLYOUT.map(({ icon, label }) => (
              <FlyoutRow key={label} label={label}>
                <Icon name={icon} size={20} />
              </FlyoutRow>
            ))}
            <FlyoutRow label="My profile">
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>P</Text>
              </View>
            </FlyoutRow>
          </View>
        </Pressable>
      )}
    </Pressable>
  );
}

function FlyoutRow({ label, children }: { label: string; children: React.ReactNode }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="menuitem"
      {...hover.handlers}
      style={[styles.flyoutRow, hover.hovered && styles.flyoutRowHover]}
    >
      <View style={styles.flyoutIcon}>{children}</View>
      <Text style={styles.flyoutText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pod: {
    position: 'absolute',
    left: 4,
    top: 8,
    width: 44,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 30,
  },
  podWhite: { gap: 12, backgroundColor: colors.white, boxShadow: '0px 1px 6px rgba(0,0,0,0.08)' },
  // The in-place layout's white pod tightens the bottom padding: the caret row sits 6px from the edge.
  podWhiteB: { gap: 12, paddingBottom: 6, backgroundColor: colors.white, boxShadow: '0px 1px 6px rgba(0,0,0,0.08)' },
  groupB: { gap: 8, alignItems: 'center' },
  moreB: { width: 32, alignItems: 'center', gap: 2 },
  caretB: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', ...pointer, ...transition(['background-color']) },
  expandedList: { gap: 4, alignItems: 'center' },
  roleB: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...pointer },
  roleBGreen: { backgroundColor: colors.white10, borderWidth: 1, borderColor: colors.white10 },
  avatarB: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.dew100, alignItems: 'center', justifyContent: 'center' },
  podGreen: { gap: 16, backgroundColor: colors.pine800, boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' },
  collapse: { width: 28, height: 28, padding: 4, borderRadius: 8, alignItems: 'center', justifyContent: 'center', ...pointer },
  collapseWhite: { backgroundColor: colors.dew75 },
  collapseGreen: { backgroundColor: colors.white10 },
  group: { alignItems: 'center', gap: 12 },
  list: { gap: 8 },
  itemSlot: { width: 32, height: 32 },
  item: { padding: 4, alignItems: 'center', justifyContent: 'center', ...pointer },
  selected: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', ...pointer },
  // White pod: pine gradient tile + inner edge behind a white 20px icon, a 1px pine ring and a soft shadow.
  selectedOnWhite: { boxShadow: `0px 0px 0px 1px ${colors.pine700}, 0px 1px 2px rgba(0,0,0,0.15)` },
  // Green pod: pale-green tile with a pine icon.
  selectedOnGreen: { backgroundColor: colors.pine100 },
  caretWrap: { position: 'relative', width: 28, height: 28 },
  caret: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...pointer,
    ...transition(['background-color']),
  },
  caretOpenWhite: { backgroundColor: colors.slate100 },
  caretOpenGreen: { backgroundColor: colors.white10 },
  // Starts at the caret's right edge; the flyout sits 10px past the pod (Figma 402:3395).
  flyoutHit: { position: 'absolute', left: 28, paddingLeft: 18, zIndex: 40 },
  flyout: {
    width: 160,
    padding: 4,
    gap: 2,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    boxShadow: '0px 8px 24px rgba(24,27,37,0.1), 0px 1px 3px rgba(24,27,37,0.05)',
  },
  flyoutRow: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 6,
    ...pointer,
    ...transition(['background-color']),
  },
  flyoutRowHover: { backgroundColor: colors.slate100 },
  flyoutIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  flyoutText: { fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 20, color: colors.slate600 },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.dew100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...type.avatar, fontSize: 10, lineHeight: 14, color: colors.pine950 },
});
