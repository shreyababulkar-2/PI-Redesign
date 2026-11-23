import { useEffect, useState } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";

/**
 * The design's layout grid (Figma 41:19965, "Document - Expanded to max width"): 12 columns, an 8px gutter, 60px in
 * from the left and 8px from the right, plus 4px rows. Toggle it with Ctrl+G (as in Figma), or open the page with
 * `?grid=1`. Web only, and it never takes clicks.
 */
const COLUMNS = 12;
const GUTTER = 8;
const MARGIN_LEFT = 60;
const MARGIN_RIGHT = 8;
const ROW = 4;
const COLUMN_COLOR = "rgba(254,94,42,0.10)";
const ROW_COLOR = "rgba(254,94,42,0.08)";

export function GridOverlay() {
  const { width } = useWindowDimensions();
  const [on, setOn] = useState(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("grid") === "1";
  });
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        setOn((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (Platform.OS !== "web" || !on) return null;
  const column = Math.max(0, (width - MARGIN_LEFT - MARGIN_RIGHT - GUTTER * (COLUMNS - 1)) / COLUMNS);
  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={[StyleSheet.absoluteFill, rows]} />
      {Array.from({ length: COLUMNS }, (_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: MARGIN_LEFT + i * (column + GUTTER),
            width: column,
            backgroundColor: COLUMN_COLOR,
          }}
        />
      ))}
    </View>
  );
}

const rows = {
  backgroundImage: `repeating-linear-gradient(to bottom, ${ROW_COLOR} 0, ${ROW_COLOR} 1px, transparent 1px, transparent ${ROW}px)`,
} as object;

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100000 },
});
