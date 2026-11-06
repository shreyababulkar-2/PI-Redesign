import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../../theme';
import { Icon } from '../Icon';
import { SectionStatus } from '../../data/researchNote';

/**
 * Chip sizes follow the Figma header frames: the Vetted / version chips are 24px tall with
 * 12/18 text, while the Unvetted / version chips keep the original 20px, 10/16 sizing.
 * Both statuses end with a chevron.
 */
const STATUS = {
  vetted: {
    label: 'Vetted',
    bg: colors.pine700,
    fg: colors.white,
    icon: 'successFilled',
    chevron: 'chipChevronWhite',
    text: type.chipLg,
    height: 24,
  },
  unvetted: {
    label: 'Unvetted',
    bg: colors.neutralChipBg,
    fg: colors.neutralChipText,
    icon: 'errorFilled',
    chevron: 'chipChevronWarning',
    text: type.chip,
    height: undefined,
  },
} as const;

export function StatusChip({ status }: { status: SectionStatus }) {
  const s = STATUS[status];
  return (
    <View style={[styles.chip, { backgroundColor: s.bg, gap: 4, height: s.height }]}>
      <Icon name={s.icon} size={12} />
      <Text style={[s.text, { color: s.fg }]}>{s.label}</Text>
      <Icon name={s.chevron} size={12} />
    </View>
  );
}

export function VersionChip({ version, status }: { version: string; status: SectionStatus }) {
  const s = STATUS[status];
  return (
    <View style={[styles.chip, { backgroundColor: colors.shark50, gap: 2, height: s.height }]}>
      <Text style={[s.text, { color: colors.grey700 }]}>{version}</Text>
      <Icon name="chevronDown12" size={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 40,
  },
});
