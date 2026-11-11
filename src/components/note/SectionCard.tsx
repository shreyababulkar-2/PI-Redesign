import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { CARD_ACTIONS_STICKY_TOP } from '../../theme/layout';
import { colors, type } from '../../theme';
import { NoteSection } from '../../data/researchNote';
import { Icon } from '../Icon';
import { appear, leaving } from '../../theme/motion';
import { useActiveTab } from '../../state/activeTab';
import { ActionButton } from './ActionButton';
import { KebabMenu, SECTION_MENU_ITEMS } from './KebabMenu';
import { VersionChip } from './Chip';
import { RichText } from './RichText';
import { Stroke } from '../Stroke';

/** `position: sticky` is web-only; elsewhere the icons simply stay at the card's top. */
const stickyActions = (Platform.OS === 'web'
  ? { position: 'sticky', top: CARD_ACTIONS_STICKY_TOP }
  : null) as ViewStyle | null;

const actions = [
  { icon: 'actionComment', hoverIcon: 'actionCommentHover', label: 'Comments' },
  { icon: 'actionCopy', hoverIcon: 'actionCopyHover', label: 'Copy' },
  { icon: 'actionLink', hoverIcon: 'actionLinkHover', label: 'Copy link', size: 16 },
  { icon: 'actionMore', hoverIcon: 'actionMoreHover', label: 'More' },
] as const;

/** The section as plain text for the clipboard: title, then paragraphs and bullets. */
function sectionText(section: NoteSection): string {
  const lines = section.body.map((b) => {
    if (b.kind === 'spacer') return '';
    const text = b.segments.map((s) => s.text).join('');
    return b.kind === 'bullet' ? `• ${text}` : text;
  });
  return [`${section.index} ${section.title}`, '', ...lines].join('\n').replace(/\n{3,}/g, '\n\n');
}

/** Copy action: copies the section, then shows a check for a moment as confirmation. */
function CopyAction({ action, text }: { action: (typeof actions)[number]; text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);
  return (
    <ActionButton
      {...action}
      label={copied ? 'Copied' : action.label}
      done={copied}
      onPress={() => {
        if (Platform.OS === 'web') navigator.clipboard?.writeText(text).catch(() => {});
        setCopied(true);
      }}
    />
  );
}

/** Version chip with its history dropdown (Figma 459:41993): newest first, the current one highlighted. */
function VersionHistory({ section }: { section: NoteSection }) {
  const latest = parseInt(section.version.replace(/\D/g, ''), 10) || 1;
  const [current, setCurrent] = useState(latest);
  const items = Array.from({ length: Math.min(latest, 4) }, (_, i) => ({
    label: `Version ${latest - i}`,
    subtitle: 'Updated by Canvs · 9 Nov ‘26, 12:40 PM',
  }));
  return (
    <KebabMenu
      items={items}
      selected={`Version ${current}`}
      onSelect={(label) => setCurrent(parseInt(label.replace(/\D/g, ''), 10))}
      minWidth={215}
    >
      {({ open, toggle }) => <VersionChip version={`v${current}`} open={open} onPress={toggle} />}
    </KebabMenu>
  );
}

type Props = {
  section: NoteSection;
  onLayout?: (e: LayoutChangeEvent) => void;
  /** Body text zoom factor (1 = 100%). */
  zoom?: number;
  /** Position on the page, for the staggered entrance. */
  index?: number;
};

export function SectionCard({ section, onLayout, zoom = 1, index = 0 }: Props) {
  const { switching } = useActiveTab();
  return (
    <View onLayout={onLayout} style={[styles.card, { maxWidth: section.maxWidth }, appear(index), leaving(switching)]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[type.sectionTitle, styles.index, { color: colors.slate900 }]}>{section.index}</Text>
          <Text numberOfLines={1} style={[type.sectionTitle, styles.title, { color: colors.slate900 }]}>
            {section.title}
          </Text>
        </View>
        <View style={styles.chips}>
          <VersionHistory section={section} />
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
          {actions.map((a) =>
            a.icon === 'actionMore' ? (
              <KebabMenu key={a.icon} items={SECTION_MENU_ITEMS}>
                {({ open, toggle }) => <ActionButton {...a} active={open} onPress={toggle} />}
              </KebabMenu>
            ) : a.icon === 'actionCopy' ? (
              <CopyAction key={a.icon} action={a} text={sectionText(section)} />
            ) : (
              <ActionButton key={a.icon} {...a} />
            ),
          )}
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
    gap: 10,
  },
  // zIndex: every View is its own stacking context on web, so without this the body text that follows the header
  // paints over the version menu that drops down from it.
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 2, zIndex: 5 },
  // The title truncates with an ellipsis when the card gets narrow; the index and chips never shrink.
  titleRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 12 },
  index: { flexShrink: 0 },
  title: { flexShrink: 1, minWidth: 0 },
  chips: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Runs edge to edge: 2px in from each card edge (Figma: x 2, width 598 in a 602px card).
  divider: { height: 1, marginHorizontal: -14 },
  dividerImg: { width: '100%' },
  actionsTrack: { position: 'absolute', top: 0, bottom: 0, right: -33, width: 28, zIndex: 5 },
  actions: { marginTop: 15, gap: 4, justifyContent: 'center' },
});
