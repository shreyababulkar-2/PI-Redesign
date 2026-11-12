import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { floatingHeaderBackdrop } from '../../assets/images';
import { colors, type } from '../../theme';
import { noteTabs } from '../../data/researchNote';
import { press, transition } from '../../theme/motion';
import { Icon } from '../Icon';
import { AssistantButton } from '../AssistantButton';
import { KebabMenu } from './KebabMenu';
import { useActiveTab } from '../../state/activeTab';
import { pointer } from '../../theme/cursor';
export type Tone = 'white' | 'green';

type Props = {
  activeTab: number;
  /** White (default) or green navigation pill; the text and icons flip to white on green. */
  tone?: Tone;
  /** Title of the section currently in view. */
  activeSectionTitle: string;
};

/** The section chip shows at most this many characters; anything longer is cut with an ellipsis. */
const SECTION_CHIP_MAX_CHARS = 25;

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Contents of the navigation pill (Figma 459:41542): the note type with a chevron and the current section chip. */
export function FloatingNavContent({ activeTab, activeSectionTitle, tone = 'white' }: Props) {
  const { setTab } = useActiveTab();
  const green = tone === 'green';
  return (
    <View style={styles.navContent}>
      {/* The note type opens a small menu to switch tab (Figma 459:41699). */}
      <KebabMenu
        items={noteTabs.map((label) => ({ label }))}
        selected={noteTabs[activeTab]}
        onSelect={(label) => setTab(noteTabs.indexOf(label as (typeof noteTabs)[number]))}
        placement={{ right: undefined, left: -12, marginTop: 16 }}
        minWidth={120}
      >
        {({ open, toggle }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch tab"
            accessibilityState={{ expanded: open }}
            onPress={toggle}
            style={({ pressed }) => [styles.title, press(pressed)]}
          >
            <Text numberOfLines={1} style={[type.floatingTitle, { color: green ? colors.white : colors.slate900 }]}>
              {noteTabs[activeTab]}
            </Text>
            <View style={[{ transform: [{ rotate: open ? '180deg' : '0deg' }] }, transition(['transform'], 200) as object]}>
              <Icon name={green ? "floatChevronLight" : "floatChevron"} size={18} />
            </View>
          </Pressable>
        )}
      </KebabMenu>
      <View style={styles.sectionChip}>
        <Text numberOfLines={1} style={[type.floatingChip, { color: colors.pine800 }]}>
          {truncate(activeSectionTitle, SECTION_CHIP_MAX_CHARS)}
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

type Variant = 'left' | 'center';

/**
 * Header shown once the page is scrolled: a navigation pill (back, note type, current section) and an
 * actions button over a soft white fade. The `center` variant centres both; `left` pins the pill to the left
 * and the actions to the right edge of the column.
 */
export function FloatingHeader({ activeTab, activeSectionTitle, variant }: Props & { variant: Variant }) {
  const floatingNav = 'white' as Tone;
  return (
    <View pointerEvents="box-none" style={styles.root}>
      <FloatingBackdrop />
      <View pointerEvents="box-none" style={[styles.group, variant === 'left' && styles.groupSplit]}>
        <View style={[styles.nav, styles.navShadow, floatingNav === 'green' && styles.navGreen]}>
          <FloatingNavContent activeTab={activeTab} activeSectionTitle={activeSectionTitle} tone={floatingNav} />
        </View>
        <View style={styles.cluster}>
          <KebabMenu>
            {({ open, toggle }) => (
              <Pressable accessibilityRole="button" accessibilityLabel="More actions" accessibilityState={{ expanded: open }} onPress={toggle} style={({ pressed }) => press(pressed)}>
                <View style={[styles.actions, styles.actionsShadow]}>
                  <Icon name="floatMore" size={28} />
                </View>
              </Pressable>
            )}
          </KebabMenu>
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
  // Hugs its content (Figma: 258 wide with "Background checks on the company"); the chip truncates when narrow.
  nav: {
    flexShrink: 1,
    minWidth: 0,
    height: 36,
    backgroundColor: colors.white,
    borderRadius: 8,
  },
  // Fills the pill's full 36px so the title and chip centre on it (at 34px they sat 1px high).
  navContent: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 36, paddingRight: 4, paddingLeft: 12 },
  navGreen: { backgroundColor: colors.pine800 },
  navShadow: { boxShadow: `0px 2px 12px ${colors.floatingShadow}` },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  back: { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center', ...pointer, ...transition(['background-color']) },
  backHover: { backgroundColor: colors.dew75 },
  backHoverGreen: { backgroundColor: colors.white10 },
  title: { flexDirection: 'row', alignItems: 'center', ...pointer },
  sectionChip: {
    flexShrink: 1,
    minWidth: 1,
    height: 26,
    justifyContent: 'center',
    paddingHorizontal: 8,
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
