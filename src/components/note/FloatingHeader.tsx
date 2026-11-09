import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { floatingHeaderBackdrop } from '../../assets/images';
import { colors, type } from '../../theme';
import { noteTabs } from '../../data/researchNote';
import { transition } from '../../theme/motion';
import { useHover } from '../../hooks/useHover';
import { Icon } from '../Icon';
import { AssistantButton } from '../AssistantButton';
import { pointer } from '../../theme/cursor';

type Props = {
  activeTab: number;
  /** Title of the section currently in view. */
  activeSectionTitle: string;
};

/** Contents of the navigation pill: back button, note type and the current section chip. */
export function FloatingNavContent({ activeTab, activeSectionTitle }: Props) {
  const back = useHover();
  return (
    <View style={styles.navContent}>
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
  );
}

/**
 * Page-coloured fade behind the floating pills (Figma: 64px, solid to ~66% of the height then fading to ~5% at the
 * bottom edge, with a 1.5 background blur). Fills its parent's width.
 */
export function FloatingBackdrop() {
  return (
    <View pointerEvents="none" style={styles.backdrop}>
      {Platform.OS === 'web' && <View style={webBlur} />}
      <Image source={floatingHeaderBackdrop} contentFit="fill" style={StyleSheet.absoluteFill} />
    </View>
  );
}

type Variant = 'a' | 'b';

/**
 * Header shown once the page is scrolled: a navigation pill (back, note type, current section) and an
 * actions button over a soft white fade. Variant A centres both; variant B pins the pill to the left
 * and the actions to the right edge of the column.
 */
export function FloatingHeader({ activeTab, activeSectionTitle, variant }: Props & { variant: Variant }) {
  return (
    <View pointerEvents="box-none" style={styles.root}>
      <FloatingBackdrop />
      <View pointerEvents="box-none" style={[styles.group, variant === 'b' && styles.groupSplit]}>
        <View style={[styles.nav, styles.navShadow]}>
          <FloatingNavContent activeTab={activeTab} activeSectionTitle={activeSectionTitle} />
        </View>
        <View style={styles.cluster}>
          <View style={[styles.actions, styles.actionsShadow]}>
            <Icon name="floatMore" size={28} />
          </View>
          <AssistantButton size={36} />
        </View>
      </View>
    </View>
  );
}

/** Web-only: blur whatever scrolls behind the header, feathered out toward the bottom edge. */
const webBlur = {
  ...StyleSheet.absoluteFill,
  backdropFilter: 'blur(1.5px)',
  WebkitBackdropFilter: 'blur(1.5px)',
  maskImage: 'linear-gradient(to bottom, #000 66%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to bottom, #000 66%, transparent 100%)',
} as ViewStyle;

const styles = StyleSheet.create({
  root: { width: '100%', height: 64, padding: 12, alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFill },
  cluster: { flexDirection: 'row', gap: 8 },
  group: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8 },
  groupSplit: { width: '100%', justifyContent: 'space-between' },
  nav: {
    width: 280,
    height: 36,
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
  },
  navContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 4 },
  navShadow: { boxShadow: `0px 2px 12px ${colors.floatingShadow}` },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  back: { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center', ...pointer, ...transition(['background-color']) },
  backHover: { backgroundColor: colors.dew75 },
  title: { flexDirection: 'row', alignItems: 'center', ...pointer },
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
    ...pointer,
  },
  actionsShadow: { boxShadow: `0px 1px 2px ${colors.floatingShadowSoft}, 0px 2px 12px ${colors.floatingShadow}` },
});
