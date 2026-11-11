import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../../theme';
import { transition } from '../../theme/motion';
import { NoteSection } from '../../data/researchNote';
import { Icon } from '../Icon';
import { Stroke } from '../Stroke';
import { pointer } from '../../theme/cursor';

type Props = {
  sections: NoteSection[];
  activeId: string;
  /** The section currently under the pointer (in the ticks or in this menu). */
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

/**
 * Floating section menu (Figma "Active item" / "Hover item", nodes 332:4075 / 332:4106): 248 × 412,
 * 8px padding, 8px radius, 32px rows with 8px padding, gradient "New custom section" button.
 */
export function SectionNavPopup({ sections, activeId, hoveredId, onHover, onSelect }: Props) {
  const main = sections.filter((s) => s.group === 'main');
  const custom = sections.filter((s) => s.group === 'custom');

  return (
    <View style={styles.root}>
      <View style={styles.groups}>
        <View>
          {main.map((s) => (
            <NavItem
              key={s.id}
              label={s.title}
              active={s.id === activeId}
              hovered={s.id === hoveredId}
              onHover={(on) => onHover(on ? s.id : null)}
              onPress={() => onSelect(s.id)}
            />
          ))}
        </View>
        <View style={styles.divider}>
          <Icon name="menuDivider" size={0} height={1} style={styles.dividerImg} />
        </View>
        <View>
          {custom.map((s) => (
            <NavItem
              key={s.id}
              label={s.title}
              active={s.id === activeId}
              hovered={s.id === hoveredId}
              onHover={(on) => onHover(on ? s.id : null)}
              onPress={() => onSelect(s.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.addButton}>
        <Icon name="menuButtonBg" size={0} width={232} height={28} style={StyleSheet.absoluteFill} />
        <Icon name="plusWhite" size={16} />
        <Text style={[type.menuButton, { color: colors.white }]}>New custom section</Text>
      </View>

      <Stroke color={colors.dew100} radius={8} />
    </View>
  );
}

type ItemProps = { label: string; active: boolean; hovered: boolean; onHover: (on: boolean) => void; onPress: () => void };

/** Hover is controlled so hovering the matching tick highlights this row, and vice versa. */
function NavItem({ label, active, hovered, onHover, onPress }: ItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onHoverIn={() => onHover(true)}
      onHoverOut={() => onHover(false)}
      style={[
        styles.item,
        active ? styles.itemActive : styles.itemDefault,
        // Figma "Hover item" (292:17529): slate-100 fill on non-active rows; the active row keeps its green fill.
        !active && hovered && styles.itemHover,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[active ? type.menuItemActive : type.menuItem, { color: active ? colors.pine900 : colors.slate600 }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 248,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 8,
    gap: 8,
    boxShadow: '2px 4px 12px rgba(0,0,0,0.15)',
  },
  groups: { width: '100%', gap: 4 },
  item: { height: 32, flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 8, ...pointer, ...transition(['background-color']) },
  // Selected row fill per Figma 441:31176.
  itemActive: { backgroundColor: '#f0f5f4', borderRadius: 6 },
  itemDefault: { borderRadius: 4 },
  itemHover: { backgroundColor: colors.slate100 },
  divider: { height: 0, width: '100%' },
  dividerImg: { position: 'absolute', top: -1, left: 0, width: '100%' },
  // 232 × 28 with the pine gradient + inner edge drawn by the SVG layer, a 1px pine ring and a soft shadow.
  addButton: {
    height: 28,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 6,
    boxShadow: `0px 0px 0px 1px ${colors.pine700}, 0px 1px 2px rgba(0,0,0,0.15)`,
    ...pointer,
  },
});
