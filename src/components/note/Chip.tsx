import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, type } from '../../theme';
import { Icon } from '../Icon';
import { pointer } from '../../theme/cursor';

/** Section header chip (Figma "Chips/Rounded"): 20px tall, 11px Mona Sans, ending in a chevron. */
export function VersionChip({ version }: { version: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.shark50 }]}>
      <Text style={[type.chip, { color: colors.grey700 }]}>{version}</Text>
      <Icon name="chevronDown12" size={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { backgroundColor: '#f0eeee', cursor: 'default' as never },
  stageText: { fontFamily: fonts.interRegular, fontSize: 10, lineHeight: 16, color: '#333333' },
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

/** Deal stage next to the company name (Figma 441:32313): grey pill, Inter 10. */
export function StageChip({ label }: { label: string }) {
  return (
    <View style={[styles.chip, styles.stage]}>
      <Text style={styles.stageText}>{label}</Text>
    </View>
  );
}
