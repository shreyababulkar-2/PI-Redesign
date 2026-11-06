import { useState } from 'react';
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
  onSelect: (id: string) => void;
};

/** Floating section menu (Figma "Menu", node 291:17407): 248 × 412, 8px padding, 8px radius. */
export function SectionNavPopup({ sections, activeId, onSelect }: Props) {
  const main = sections.filter((s) => s.group === 'main');
  const custom = sections.filter((s) => s.group === 'custom');

  return (
    <View style={styles.root}>
      <View style={styles.groups}>
        <View>
          {main.map((s) => (
            <NavItem key={s.id} label={s.title} active={s.id === activeId} paddingX={10} onPress={() => onSelect(s.id)} />
          ))}
        </View>
        <View style={styles.divider}>
          <Icon name="menuDivider" size={0} height={1} style={styles.dividerImg} />
        </View>
        <View>
          {custom.map((s) => (
            <NavItem key={s.id} label={s.title} active={s.id === activeId} paddingX={12} onPress={() => onSelect(s.id)} />
          ))}
        </View>
      </View>

      <View style={styles.addButton}>
        <Icon name="plusWhite" size={16} />
        <Text style={[type.menuButton, { color: colors.white }]}>New custom section</Text>
      </View>

      <Stroke color={colors.dew100} radius={8} />
    </View>
  );
}

type ItemProps = { label: string; active: boolean; paddingX: number; onPress: () => void };

function NavItem({ label, active, paddingX, onPress }: ItemProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.item,
        { paddingHorizontal: paddingX },
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
    boxShadow: '2px 4px 6px rgba(0,0,0,0.15)',
  },
  groups: { width: '100%', gap: 4 },
  item: { height: 32, flexDirection: 'row', alignItems: 'center', width: '100%', ...pointer, ...transition(['background-color']) },
  itemActive: { backgroundColor: colors.pine100, borderRadius: 6 },
  itemDefault: { borderRadius: 4 },
  itemHover: { backgroundColor: colors.slate100 },
  divider: { height: 0, width: '100%' },
  dividerImg: { position: 'absolute', top: -1, left: 0, width: '100%' },
  addButton: {
    height: 28,
    backgroundColor: colors.pine800,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 6,
    overflow: 'hidden',
    ...pointer,
  },
});
