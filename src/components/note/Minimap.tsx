import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { motion, transition } from '../../theme/motion';
import { NoteSection } from '../../data/researchNote';
import { SectionNavPopup } from './SectionNavPopup';
import { pointer } from '../../theme/cursor';

/** Gap between the tick column and the popup, per the Figma placement (kept hoverable). */
const POPUP_GAP = 10;
/**
 * Grace period before closing once the pointer has left both the ticks and the menu. The gap
 * between them is bridged by transparent padding, so this only has to absorb a brief wobble.
 */
const CLOSE_DELAY_MS = 80;
/** Closing fades faster than opening so the menu gets out of the way promptly. */
const CLOSE_FADE_MS = 90;

type Props = {
  sections: NoteSection[];
  activeId: string;
  onSelect: (id: string) => void;
};

/**
 * Left-edge floating navigation: one tick per section (active = 20px pine, others 14px slate).
 * Hovering the ticks expands the section menu; it stays open while the pointer is over either
 * the ticks or the menu (including the gap between them) and closes shortly after it leaves both.
 */
export function Minimap({ sections, activeId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  // The section under the pointer, in either the ticks or the menu, so the two always agree.
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The popup stays mounted while it fades out, so closing eases instead of snapping.
  const [mounted, setMounted] = useState(false);
  const [reveal] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: open ? 1 : 0,
      duration: open ? motion.fast : CLOSE_FADE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
  }, [open, reveal]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const show = useCallback(() => {
    cancelClose();
    setMounted(true);
    setOpen(true);
  }, [cancelClose]);

  const hide = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, [cancelClose]);

  // Picking a section scrolls the page behind but leaves the menu up; it closes on its own once the
  // pointer leaves, so you can keep stepping through sections.
  const select = useCallback(
    (id: string) => {
      cancelClose();
      onSelect(id);
    },
    [cancelClose, onSelect],
  );

  useEffect(() => cancelClose, [cancelClose]);

  // Pointer enter/leave bubble from descendants (unlike Pressable hover, which ends when the
  // pointer moves onto a nested Pressable), so one handler pair covers ticks, gap and menu items.
  return (
    <View onPointerEnter={show} onPointerLeave={hide} style={styles.root}>
      <View style={styles.ticks}>
        {sections.map((s) => (
          <Tick
            key={s.id}
            section={s}
            active={s.id === activeId}
            hovered={s.id === hoveredId}
            onHover={(on) => setHoveredId((cur) => (on ? s.id : cur === s.id ? null : cur))}
            onPress={() => select(s.id)}
          />
        ))}
      </View>

      {mounted && (
        <Animated.View
          style={[
            styles.popupAnchor,
            { opacity: reveal, transform: [{ translateX: reveal.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] },
          ]}
        >
          <SectionNavPopup
            sections={sections}
            activeId={activeId}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onSelect={select}
          />
        </Animated.View>
      )}
    </View>
  );
}

const tickTransition = transition(['width', 'background-color'], motion.base);

type TickProps = {
  section: NoteSection;
  active: boolean;
  hovered: boolean;
  onHover: (on: boolean) => void;
  onPress: () => void;
};

/** One section tick. The 2px line sits in a 10px-tall, full-width row so it is easy to click. */
function Tick({ section, active, hovered, onHover, onPress }: TickProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Go to ${section.title}`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onHoverIn={() => onHover(true)}
      onHoverOut={() => onHover(false)}
      style={styles.tickRow}
    >
      <View
        style={[
          styles.tick,
          { width: active ? 20 : 14, backgroundColor: active ? colors.pine800 : hovered ? colors.slate500 : colors.slate300 },
          tickTransition,
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 20, top: 0, zIndex: 10, ...pointer },
  // 10px rows (2px line + 8px gap) keep the original spacing while giving each tick a real hit area.
  ticks: { width: 20 },
  tickRow: { height: 10, width: 20, justifyContent: 'center', ...pointer },
  tick: { height: 2, borderRadius: 2 },
  // Popup top sits 24px above the tick column. Transparent left padding bridges the gap
  // between ticks and menu so the pointer never leaves the hover area on the way across.
  popupAnchor: { position: 'absolute', top: -24, left: 20, paddingLeft: POPUP_GAP, zIndex: 10 },
});
