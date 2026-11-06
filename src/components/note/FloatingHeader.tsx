import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { floatingHeaderBackdrop } from '../../assets/images';
import { colors, type } from '../../theme';
import { noteTabs } from '../../data/researchNote';
import { useHover } from '../../hooks/useHover';
import { Icon } from '../Icon';

type Props = {
  activeTab: number;
  /** Title of the section currently in view. */
  activeSectionTitle: string;
};

/**
 * Header shown once the page is scrolled (Figma "Scrolled state", node 288:16886): a centred
 * navigation pill (back, note type, current section) and an actions button, floating over a soft
 * white fade while the content scrolls underneath. 60px tall.
 */
export function FloatingHeader({ activeTab, activeSectionTitle }: Props) {
  const back = useHover();
  return (
    <View pointerEvents="box-none" style={styles.root}>
      {/* Fade + subtle blur so scrolling content dissolves under the pills instead of cutting off. */}
      <View pointerEvents="none" style={styles.backdrop}>
        {Platform.OS === 'web' && <View style={webBlur} />}
        <Image source={floatingHeaderBackdrop} contentFit="fill" style={StyleSheet.absoluteFill} />
      </View>

      <View pointerEvents="box-none" style={styles.group}>
        <View style={[styles.nav, styles.navShadow]}>
          <View style={styles.titleRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              {...back.handlers}
              style={[styles.back, back.hovered && styles.backHover]}
            >
              <Icon name="floatBack" size={13.714} />
            </Pressable>
            <View style={styles.title}>
              <Text numberOfLines={1} style={[type.floatingTitle, { color: colors.slate800 }]}>
                {noteTabs[activeTab]}
              </Text>
              <Icon name="floatChevron" size={18} />
            </View>
          </View>
          <View style={styles.sectionChip}>
            <Text numberOfLines={1} style={[type.floatingChip, { color: colors.pine800 }]}>
              {activeSectionTitle}
            </Text>
          </View>
        </View>

        <View style={[styles.actions, styles.actionsShadow]}>
          <Icon name="floatMore" size={28} />
        </View>
      </View>
    </View>
  );
}

/** Web-only: blur whatever scrolls behind the header, feathered out toward the bottom edge. */
const webBlur = {
  ...StyleSheet.absoluteFill,
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  maskImage: 'linear-gradient(to bottom, #000 40%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to bottom, #000 40%, transparent 100%)',
} as ViewStyle;

const styles = StyleSheet.create({
  root: { width: '100%', height: 60, padding: 12, alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFill },
  group: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8 },
  nav: {
    width: 280,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 4,
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
  },
  navShadow: { boxShadow: `0px 2px 12px ${colors.floatingShadow}` },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  back: { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  backHover: { backgroundColor: colors.dew75 },
  title: { flexDirection: 'row', alignItems: 'center' },
  sectionChip: {
    flex: 1,
    minWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.dew75,
    overflow: 'hidden',
  },
  actions: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionsShadow: { boxShadow: `0px 1px 2px ${colors.floatingShadowSoft}, 0px 2px 12px ${colors.floatingShadow}` },
});
