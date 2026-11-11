import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { transition } from '../theme/motion';
import { DesignOptions, OPTION_VALUES, useDesignOptions } from '../state/designOptions';
import { pointer } from '../theme/cursor';

type Row = { key: keyof DesignOptions; label: string; format: (v: string) => string };

const LABELS: Record<string, string> = { popout: 'Pop out', inplace: 'In place' };
const label = (v: string) => LABELS[v] ?? v[0].toUpperCase() + v.slice(1);
const cap = (v: string) => v[0].toUpperCase() + v.slice(1);

const ROWS: Row[] = [
  { key: 'scrolledHeader', label: 'Scrolled header', format: label },
  { key: 'sideNavLayout', label: 'Side nav layout', format: label },
  { key: 'sideNav', label: 'Side nav colour', format: cap },
  { key: 'floatingNav', label: 'Floating nav', format: cap },
];

/**
 * Review-only menu for flipping between design variants. Collapsed it is a small pill; expanded it
 * lists one segmented control per option. Not part of the product UI.
 */
export function OptionsSwitcher() {
  const options = useDesignOptions();
  const [open, setOpen] = useState(false);

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      {open && (
        <View style={styles.panel}>
          {ROWS.map(({ key, label, format }) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <View style={styles.segmented}>
                {(OPTION_VALUES[key] as readonly string[]).map((value) => {
                  const active = options[key] === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityLabel={`${label}: ${format(value)}`}
                      accessibilityState={{ selected: active }}
                      onPress={() => options.setOption(key, value as never)}
                      style={[styles.option, active && styles.optionActive]}
                    >
                      <Text style={[styles.optionText, active && styles.optionTextActive]}>{format(value)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Design options"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={styles.toggle}
      >
        <Text style={styles.toggleText}>Design options</Text>
        <Text style={styles.caret}>{open ? '▾' : '▴'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 12, alignItems: 'center', gap: 8, zIndex: 40 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.slate900,
    boxShadow: '0px 4px 16px rgba(0,0,0,0.18)',
    ...pointer,
  },
  toggleText: { fontFamily: fonts.geistMedium, fontSize: 11, color: colors.slate100 },
  caret: { fontSize: 9, color: colors.slate300 },
  panel: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.slate900,
    boxShadow: '0px 8px 24px rgba(0,0,0,0.22)',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 24 },
  label: { fontFamily: fonts.geistRegular, fontSize: 11, color: colors.slate300 },
  segmented: { flexDirection: 'row', gap: 2, padding: 2, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  option: {
    minWidth: 44,
    height: 22,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    ...pointer,
    ...transition(['background-color']),
  },
  optionActive: { backgroundColor: colors.white },
  optionText: { fontFamily: fonts.geistMedium, fontSize: 11, color: colors.slate300 },
  optionTextActive: { color: colors.slate900 },
});
