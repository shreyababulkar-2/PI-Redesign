import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../theme';
import { Icon } from './Icon';
import { IconName } from '../assets/icons';
import { pointer } from '../theme/cursor';

const NAV_ITEMS: IconName[] = ['navItem1', 'navItemSelected', 'navItem2', 'navItem3', 'navItem4', 'navItem5'];
const SELECTED: IconName = 'navItemSelected';
const FOOTER_ITEMS: IconName[] = ['navBottom1', 'navBottom2', 'navBottom3'];

/** Two floating pods on the left edge: primary navigation (pine) and account/utilities (white). */
export function SideNav() {
  return (
    <>
      <View style={[styles.pod, styles.primaryPod]}>
        <View style={styles.collapse}>
          <Icon name="navCollapse" size={16} />
        </View>
        <View style={styles.group}>
          <Icon name="navDivider" size={20} height={1} />
          <View style={styles.list}>
            {NAV_ITEMS.map((icon) =>
              icon === SELECTED ? (
                <View key={icon} style={styles.itemSlot}>
                  <View style={styles.selected}>
                    <Icon name={icon} size={17.778} />
                  </View>
                </View>
              ) : (
                <View key={icon} style={[styles.itemSlot, styles.item]}>
                  <Icon name={icon} size={20} />
                </View>
              ),
            )}
          </View>
        </View>
      </View>

      <View style={[styles.pod, styles.footerPod]}>
        <View style={styles.footerList}>
          {FOOTER_ITEMS.map((icon) => (
            <View key={icon} style={[styles.itemSlot, styles.item]}>
              <Icon name={icon} size={20} />
            </View>
          ))}
          <View style={styles.role}>
            <View style={styles.avatar}>
              <Text style={[type.avatar, { color: colors.pine950 }]}>P</Text>
            </View>
          </View>
        </View>
      </View>
    </>
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
  primaryPod: { top: 8, gap: 16, backgroundColor: colors.pine800, boxShadow: '0px 1px 2px rgba(0,0,0,0.1)' },
  // Anchored to the bottom edge (8px inset, matching the primary pod's top inset) so it stays pinned at any viewport height.
  footerPod: { bottom: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder },
  collapse: {
    width: 28,
    height: 28,
    padding: 4,
    borderRadius: 8,
    backgroundColor: colors.white10,
    alignItems: 'center',
    justifyContent: 'center',
    ...pointer,
  },
  group: { alignItems: 'center', gap: 12 },
  list: { gap: 8 },
  itemSlot: { width: 32, height: 32 },
  item: { padding: 4, alignItems: 'center', justifyContent: 'center', ...pointer },
  selected: {
    padding: 7.111,
    borderRadius: 7.111,
    backgroundColor: colors.pine100,
    alignSelf: 'flex-start',
    ...pointer,
  },
  footerList: { gap: 6 },
  role: {
    backgroundColor: colors.white10,
    borderWidth: 1,
    borderColor: colors.white10,
    borderRadius: 24,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    ...pointer,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.dew100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
