import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, type } from '../theme';
import { Icon } from './Icon';
import { IconName } from '../assets/icons';
import { pointer } from '../theme/cursor';
import { transition } from '../theme/motion';
import { useHover } from '../hooks/useHover';

const NAV_ITEMS: IconName[] = ['navItem1', 'navItemSelected', 'navItem2', 'navItem3', 'navItem4', 'navItem5'];
const SELECTED: IconName = 'navItemSelected';

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
  navBottom4: 'navBottom4Light',
};

/** Green pod whose caret expands it in place to show the account items. */
export function SideNav() {
  return <SideNavExpanding green />;
}

/** The divider-bracketed list of main navigation items shared by both layouts. */
function NavGroup({ green, closeDivider }: { green: boolean; closeDivider: boolean }) {
  return (
    <View style={styles.group}>
      <Divider green={green} />
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
      {/* Always mounted so it can ease in with the expansion; hidden it also gives back its 12px gap. */}
      <Divider green={green} visible={closeDivider} />
    </View>
  );
}

/** Figma's group dividers are zero-height lines: they sit on the group's edge and take no layout space. */
function Divider({ green, visible = true }: { green: boolean; visible?: boolean }) {
  return (
    <View
      style={[
        styles.divider,
        { opacity: visible ? 1 : 0, marginTop: visible ? 0 : -12 },
        transition(['opacity', 'margin-top'], 240),
      ]}
    >
      <Icon name={green ? 'navDividerLight' : 'navDivider'} size={20} height={1} />
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

/** Account items in the in-place layout, top to bottom (Figma 401:3498): bell, help, bug, then the avatar. */
const EXPANDED_ITEMS: { icon: IconName; label: string }[] = [
  { icon: 'navBottom1', label: 'Notifications' },
  { icon: 'navBottom3', label: 'Help & support' },
  { icon: 'navBottom2', label: 'Report a bug' },
  { icon: 'navBottom4', label: 'Accessibility' },
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
      <View style={[styles.groupB, expanded && styles.groupBExpanded]}>
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
            <Svg
              width={20}
              height={20}
              viewBox="0 0 20 20"
              style={[{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }, transition(['transform'], 240) as object]}
            >
              <Path d="M6.4 8.4H13.6L10 12.2Z" fill={caretColor} stroke={caretColor} strokeWidth={0.8} strokeLinejoin="round" />
            </Svg>
          </Pressable>
          {/* Always mounted: it opens by growing its height and fading, so the pod eases downward. */}
          <View
            aria-hidden={!expanded}
            pointerEvents={expanded ? 'auto' : 'none'}
            style={[
              styles.expandedList,
              { maxHeight: expanded ? 176 : 0, opacity: expanded ? 1 : 0, marginTop: expanded ? 2 : 0 },
              transition(['max-height', 'opacity', 'margin-top'], 240),
            ]}
          >
              {EXPANDED_ITEMS.map(({ icon, label }) => (
                <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} tabIndex={expanded ? 0 : -1} style={[styles.itemSlot, styles.item]}>
                  <Icon name={green ? (LIGHT[icon] ?? icon) : icon} size={20} />
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" accessibilityLabel="My profile" style={[styles.roleB, green && styles.roleBGreen]}>
                <View style={styles.avatarB}>
                  <Text style={styles.avatarText}>A</Text>
                </View>
              </Pressable>
          </View>
        </View>
      </View>
    </View>
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
  groupB: { gap: 8, alignItems: 'center', ...transition(['gap'], 240) },
  // Expanded, the two groups sit 16px apart (Figma 441:31562).
  groupBExpanded: { gap: 16 },
  moreB: { width: 32, alignItems: 'center' },
  caretB: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', ...pointer, ...transition(['background-color']) },
  expandedList: { gap: 4, alignItems: 'center', overflow: 'hidden' },
  roleB: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...pointer },
  roleBGreen: { backgroundColor: colors.white10, borderWidth: 1, borderColor: colors.white10 },
  avatarB: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.dew100, alignItems: 'center', justifyContent: 'center' },
  podGreen: { gap: 16, backgroundColor: colors.pine800, boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' },
  collapse: { width: 28, height: 28, padding: 4, borderRadius: 8, alignItems: 'center', justifyContent: 'center', ...pointer },
  collapseWhite: { backgroundColor: colors.dew75 },
  collapseGreen: { backgroundColor: colors.white10 },
  group: { alignItems: 'center', gap: 12 },
  divider: { height: 0, alignSelf: 'stretch', alignItems: 'center' },
  list: { gap: 8 },
  itemSlot: { width: 32, height: 32 },
  item: { padding: 4, alignItems: 'center', justifyContent: 'center', ...pointer },
  selected: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', ...pointer },
  // White pod: pine gradient tile + inner edge behind a white 20px icon, a 1px pine ring and a soft shadow.
  selectedOnWhite: { boxShadow: `0px 0px 0px 1px ${colors.pine700}, 0px 1px 2px rgba(0,0,0,0.15)` },
  // Green pod: pale-green tile with a pine icon.
  selectedOnGreen: { backgroundColor: colors.pine100 },
  caretOpenWhite: { backgroundColor: colors.slate100 },
  caretOpenGreen: { backgroundColor: colors.white10 },
  avatarText: { ...type.avatar, fontSize: 10, lineHeight: 14, color: colors.pine950 },
});
