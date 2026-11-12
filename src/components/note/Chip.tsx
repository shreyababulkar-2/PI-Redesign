import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, type } from '../../theme';
import { Icon } from '../Icon';
import { useHover } from '../../hooks/useHover';
import { press, transition } from '../../theme/motion';
import { pointer } from '../../theme/cursor';

/** Section header chip (Figma "Chips/Rounded"): 20px tall, 11px Mona Sans, ending in a chevron. */
export function VersionChip({
  version,
  open = false,
  onPress,
}: {
  version: string;
  /** The version history menu is open: the chevron flips. */
  open?: boolean;
  onPress?: () => void;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Version ${version.replace(/^v/, '')}, show version history`}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: hover.hovered && !open ? colors.slate100 : colors.shark50 },
        // Open: the same fill with a hairline outline (Figma 459:41734).
        open && { boxShadow: 'inset 0px 0px 0px 1px #f0eeee' },
        press(pressed),
      ]}
    >
      <Text style={[type.chip, { color: colors.grey700 }]}>{version}</Text>
      <View style={[{ transform: [{ rotate: open ? '180deg' : '0deg' }] }, transition(['transform'], 200) as object]}>
        <Icon name="chevronDown12" size={12} />
      </View>
    </Pressable>
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
