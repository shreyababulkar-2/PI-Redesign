import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../theme';
import { Icon } from './Icon';
import { IconName } from '../assets/icons';
import { pointer } from '../theme/cursor';
import { Tone, useDesignOptions } from '../state/designOptions';

const NAV_ITEMS: IconName[] = ['navItem1', 'navItemSelected', 'navItem2', 'navItem3', 'navItem4', 'navItem5'];
const SELECTED: IconName = 'navItemSelected';
const FOOTER_ITEMS: IconName[] = ['navBottom1', 'navBottom2', 'navBottom3'];

/** Icons for the green pods are white at 60% opacity, so they are separate files. */
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

/**
 * Two floating pods on the left edge: primary navigation and account/utilities. Each can be white or
 * green independently (see the design options menu).
 */
export function SideNav() {
  const { sideNavTop, sideNavBottom } = useDesignOptions();
  return (
    <>
      <TopPod tone={sideNavTop} />
      <BottomPod tone={sideNavBottom} />
    </>
  );
}

function TopPod({ tone }: { tone: Tone }) {
  const green = tone === 'green';
  return (
    <View style={[styles.pod, styles.topPod, green ? styles.podGreen : styles.podWhite]}>
      <View style={[styles.collapse, green ? styles.collapseGreen : styles.collapseWhite]}>
        <Icon name={green ? 'navCollapseLight' : 'navCollapse'} size={16} />
      </View>
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
      </View>
    </View>
  );
}

function BottomPod({ tone }: { tone: Tone }) {
  const green = tone === 'green';
  return (
    <View style={[styles.pod, styles.bottomPod, green ? styles.podGreen : [styles.podWhite, styles.podWhiteBorder]]}>
      <View style={styles.footerList}>
        {FOOTER_ITEMS.map((icon) => (
          <View key={icon} style={[styles.itemSlot, styles.item]}>
            <Icon name={green ? (LIGHT[icon] ?? icon) : icon} size={20} />
          </View>
        ))}
        <View style={[styles.role, green && styles.roleGreen]}>
          <View style={styles.avatar}>
            <Text style={[type.avatar, { color: colors.pine950 }]}>P</Text>
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
    width: 44,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 30,
  },
  topPod: { top: 8, gap: 16 },
  // Anchored to the bottom edge (8px inset, matching the top pod's inset) so it stays pinned at any viewport height.
  bottomPod: { bottom: 8 },
  podWhite: { backgroundColor: colors.white, boxShadow: '0px 1px 6px rgba(0,0,0,0.08)' },
  podWhiteBorder: { borderWidth: 1, borderColor: colors.cardBorder },
  podGreen: { backgroundColor: colors.pine800, boxShadow: '0px 1px 4px rgba(0,0,0,0.1)' },
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
  footerList: { gap: 6 },
  role: { borderRadius: 24, padding: 4, flexDirection: 'row', alignItems: 'center', ...pointer },
  roleGreen: { backgroundColor: colors.white10, borderWidth: 1, borderColor: colors.white10, padding: 3 },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.dew100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
