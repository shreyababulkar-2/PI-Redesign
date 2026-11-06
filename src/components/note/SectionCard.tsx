import { LayoutChangeEvent, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { CARD_ACTIONS_STICKY_TOP } from '../../theme/layout';
import { colors, type } from '../../theme';
import { NoteSection } from '../../data/researchNote';
import { Icon } from '../Icon';
import { ActionButton } from './ActionButton';
import { StatusChip, VersionChip } from './Chip';
import { RichText } from './RichText';
import { Stroke } from '../Stroke';

/** `position: sticky` is web-only; elsewhere the icons simply stay at the card's top. */
const stickyActions = (Platform.OS === 'web'
  ? { position: 'sticky', top: CARD_ACTIONS_STICKY_TOP }
  : null) as ViewStyle | null;

const actions = [
  { icon: 'actionComment', hoverIcon: 'actionCommentHover', label: 'Comments' },
  { icon: 'actionCopy', hoverIcon: 'actionCopyHover', label: 'Copy' },
  { icon: 'actionLink', hoverIcon: 'actionLinkHover', label: 'Copy link' },
  { icon: 'actionMore', hoverIcon: 'actionMoreHover', label: 'More' },
] as const;

type Props = {
  section: NoteSection;
  onLayout?: (e: LayoutChangeEvent) => void;
  /** Body text zoom factor (1 = 100%). */
  zoom?: number;
};

export function SectionCard({ section, onLayout, zoom = 1 }: Props) {
  return (
    <View onLayout={onLayout} style={[styles.card, { maxWidth: section.maxWidth }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[type.sectionIndex, { color: colors.slate400 }]}>{section.index}</Text>
          <Text style={[type.sectionTitle, { color: colors.slate900 }]}>{section.title}</Text>
        </View>
        <View style={styles.chips}>
          <StatusChip status={section.status} />
          <VersionChip version={section.version} status={section.status} />
        </View>
      </View>

      <View style={styles.divider}>
        <Icon name={section.status === 'vetted' ? 'line3' : 'line4'} size={0} height={1} style={styles.dividerImg} />
      </View>

      <RichText blocks={section.body} regular={type.body} bold={type.bodyBold} color={colors.slate700} scale={zoom} />

      <Stroke color={colors.cardBorder} radius={8} />

      {/* Track spans the card; the icons stick below the floating header while the card scrolls. */}
      <View pointerEvents="box-none" style={styles.actionsTrack}>
        <View style={[styles.actions, stickyActions]}>
          {actions.map((a) => (
            <ActionButton key={a.icon} icon={a.icon} hoverIcon={a.hoverIcon} label={a.label} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  divider: { height: 0, width: '100%' },
  dividerImg: { position: 'absolute', top: -1, left: 0, width: '100%' },
  actionsTrack: { position: 'absolute', top: 0, bottom: 0, right: -33, width: 28 },
  actions: { marginTop: 15, gap: 4, justifyContent: 'center' },
});
