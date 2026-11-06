import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../../theme';
import { Icon } from '../Icon';
import { SectionStatus } from '../../data/researchNote';
import { pointer } from '../../theme/cursor';

/** Section header chips (Figma "Chips/Rounded"): 20px tall, 11px Mona Sans, ending in a chevron. */
const STATUS = {
  vetted: {
    label: 'Vetted',
    bg: colors.pine700,
    fg: colors.white,
    icon: 'successFilled',
    chevron: 'chipChevronWhite',
  },
  unvetted: {
    label: 'Unvetted',
    bg: colors.neutralChipBg,
    fg: colors.neutralChipText,
    icon: 'errorFilled',
    chevron: 'chipChevronWarning',
  },
} as const;

export function StatusChip({ status }: { status: SectionStatus }) {
  const s = STATUS[status];
  return (
    <View style={[styles.chip, { backgroundColor: s.bg, paddingHorizontal: 4 }]}>
      <Icon name={s.icon} size={12} />
      <Text style={[type.chip, { color: s.fg }]}>{s.label}</Text>
      <Icon name={s.chevron} size={12} />
    </View>
  );
}

export function VersionChip({ version }: { version: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.shark50 }]}>
      <Text style={[type.chip, { color: colors.grey700 }]}>{version}</Text>
      <Icon name="chevronDown12" size={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 40,
    ...pointer,
  },
});
