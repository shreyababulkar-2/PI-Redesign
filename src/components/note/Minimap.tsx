import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { NoteSection } from '../../data/researchNote';
import { SectionNavPopup } from './SectionNavPopup';

/** Gap between the tick column and the popup, per the Figma placement (kept hoverable). */
const POPUP_GAP = 10;
/**
 * Grace period before closing once the pointer has left both the ticks and the menu,
 * so a slightly imprecise path from the ticks to the menu never dismisses it.
 */
const CLOSE_DELAY_MS = 400;

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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const show = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  const hide = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, [cancelClose]);

  const select = useCallback(
    (id: string) => {
      cancelClose();
      setOpen(false);
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
        {sections.map((s) => {
          const active = s.id === activeId;
          return (
            <View
              key={s.id}
              style={[styles.tick, { width: active ? 20 : 14, backgroundColor: active ? colors.pine800 : colors.slate300 }]}
            />
          );
        })}
      </View>

      {open && (
        <View style={styles.popupAnchor}>
          <SectionNavPopup sections={sections} activeId={activeId} onSelect={select} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 20, top: 0, zIndex: 10 },
  ticks: { width: 20, paddingVertical: 4, gap: 8 },
  tick: { height: 2, borderRadius: 2 },
  // Popup top sits 24px above the tick column. Transparent left padding bridges the gap
  // between ticks and menu so the pointer never leaves the hover area on the way across.
  popupAnchor: { position: 'absolute', top: -24, left: 20, paddingLeft: POPUP_GAP, zIndex: 10 },
});
