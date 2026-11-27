import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, type } from '../../../../theme';
import { transition } from '../../../../theme/motion';
import { NoteSection } from '../../data/researchNote';
import { Icon } from '../../../../components/Icon';
import { Stroke } from '../../../../components/Stroke';
import { pointer } from '../../../../theme/cursor';
import { useHover } from '../../../../hooks/useHover';
import { vdr } from '../../../../assets/vdr';

type Props = {
  sections: NoteSection[];
  activeId: string;
  /** The section currently under the pointer (in the ticks or in this menu). */
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  /** True once the menu is docked as a panel beside the page; the header button then undocks it. */
  docked?: boolean;
  /** Docks the menu (from the hover popup) or undocks it (from the docked panel). */
  onToggleDock?: () => void;
};

/**
 * Floating section menu (Figma "Active item" / "Hover item", nodes 332:4075 / 332:4106): 248 × 412,
 * 8px padding, 8px radius, 32px rows with 8px padding, gradient "New custom section" button.
 */
export function SectionNavPopup({ sections, activeId, hoveredId, onHover, onSelect, docked = false, onToggleDock }: Props) {
  const main = sections.filter((s) => s.group === 'main');
  const custom = sections.filter((s) => s.group === 'custom');

  return (
    <View style={[styles.root, docked && styles.rootDocked]}>
      {/* Figma 940:48566: a 24px header with the dock button; the same chevrons point right to dock and left to undock. */}
      <View style={styles.header}>
        <DockButton docked={docked} onPress={onToggleDock} />
      </View>
      <View style={[styles.groups, docked && { flex: 1 }]}>
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

      <View style={[styles.addButton, docked && styles.addButtonDocked]}>
        {/* The popup's 232px artwork can't stretch to the docked width, so the docked button is a plain gradient. */}
        {!docked && <Icon name="menuButtonBg" size={0} width={232} height={28} style={StyleSheet.absoluteFill} />}
        <Icon name="plusWhite" size={16} />
        <Text style={[type.menuButton, { color: colors.white }]}>Add new custom section</Text>
      </View>

      {!docked && <Stroke color={colors.dew100} radius={8} />}
    </View>
  );
}

function DockButton({ docked, onPress }: { docked: boolean; onPress?: () => void }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={docked ? 'Undock sections' : 'Dock sections'}
      onPress={onPress}
      {...hover.handlers}
      style={[styles.dock, hover.hovered && { backgroundColor: colors.slate100 }]}
    >
      <Image source={vdr.chevronsUp} contentFit="fill" style={{ width: 16, height: 16, transform: [{ rotate: docked ? '90deg' : '-90deg' }] }} />
    </Pressable>
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
  header: { height: 24, width: '100%', flexDirection: 'row', alignItems: 'center' },
  dock: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', ...pointer, ...transition(['background-color']) },
  groups: { width: '100%', gap: 4 },
  // Docked (Figma 940:48893): a 195px card the height of the page, rows ellipsised, the button kept at the bottom.
  rootDocked: { width: 195, height: '100%', boxShadow: 'none' },
  item: { height: 32, flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 8, ...pointer, ...transition(['background-color']) },
  // Selected row fill per Figma 441:31176.
  itemActive: { backgroundColor: '#f0f5f4', borderRadius: 6 },
  itemDefault: { borderRadius: 4 },
  itemHover: { backgroundColor: colors.slate100 },
  divider: { height: 0, width: '100%' },
  dividerImg: { position: 'absolute', top: -1, left: 0, width: '100%' },
  // 232 × 28 with the pine gradient + inner edge drawn by the SVG layer, a 1px pine ring and a soft shadow.
  addButtonDocked: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    boxShadow: 'none',
    backgroundImage: `linear-gradient(130deg, ${colors.pine700} 4.6%, ${colors.pine900} 102.6%)`,
  } as object,
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
