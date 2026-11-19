import { ReactNode, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { colors } from "../../theme";

/** Where the artefact has been scrolled to: `x`/`y` are true once it has moved away from the start. */
export type ArtifactScroll = { x: boolean; y: boolean };

/**
 * The frame an artefact loads into inside the drawer (Figma 88:25334): a bordered 8px-radius window under the tabs that
 * clips whatever the artefact draws at its own size. The artefact scrolls inside the frame, down and across, and
 * nothing else: no zoom and no links out. The scroller is one element that scrolls both ways, so content can stick to
 * its top or left edge (`position: sticky`, as the table's header row and first column do). Nothing is drawn over the artefact inside the frame (no edge shadows or fades); the frame
 * itself reads as a level above its surroundings through the drawer's shadow. The artefact sits
 * 16px in from the sides and the bottom and 12px from the top (the frame's padding in the design).
 */
export function ArtifactFrame({ children }: { children: (scroll: ArtifactScroll) => ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  // Only the booleans below change what is drawn, so the artefact re-renders when they flip, not on every scroll event.
  const scroll: ArtifactScroll = { x: pos.x > 0, y: pos.y > 0 };
  return (
    <View style={styles.frame}>
      <View style={styles.window}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const { x, y } = e.nativeEvent.contentOffset;
            setPos((p) => {
              const q = { x: Math.round(x), y: Math.round(y) };
              // Re-render only when something that matters changed (leaving 0, or near an end).
              return (p.x > 0) === (q.x > 0) && (p.y > 0) === (q.y > 0) && Math.abs(p.x - q.x) < 24 && Math.abs(p.y - q.y) < 24
                ? p
                : q;
            });
          }}
          // On the web the scroller also scrolls across (it is vertical-only by default).
          style={Platform.OS === "web" ? ({ overflowX: "auto" } as object) : undefined}
          contentContainerStyle={{ alignSelf: "flex-start" }}
        >
          {children(scroll)}
        </ScrollView>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    minHeight: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(225,228,234,0.4)",
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  // 16px in from the sides and the bottom, 12px from the top; the scroller is clipped here, so scrolled content never shows in the margin.
  window: { flex: 1, minHeight: 0, paddingTop: 12, paddingBottom: 16, paddingHorizontal: 16, overflow: "hidden" },
});
