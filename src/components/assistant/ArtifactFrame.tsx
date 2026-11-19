import { ReactNode, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { colors } from "../../theme";
import { vdr } from "../../assets/vdr";

/**
 * The frame an artefact loads into inside the drawer (Figma 88:25334): a bordered 8px-radius window under the tabs that
 * clips whatever the artefact draws at its own size. The artefact scrolls inside the frame, down and across, and
 * nothing else: no zoom and no links out. Soft edge shadows at the bottom and right (10% black, 16px) hint that
 * there is more, and fade away once the end is reached. The content sits 16px in from the sides and 12px from the top.
 */
export function ArtifactFrame({
  width,
  height,
  children,
}: {
  /** The artefact's own size. */
  width: number;
  height: number;
  children: ReactNode;
}) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [atEnd, setAtEnd] = useState({ x: false, y: false });
  const inner = { w: width + 32, h: height + 28 }; // plus the frame's padding (16 + 16, 12 + 16)
  const offset = useRef({ x: 0, y: 0 });
  const update = (x: number, y: number) => {
    offset.current = { x, y };
    const next = { x: x + box.w >= inner.w - 2, y: y + box.h >= inner.h - 2 };
    if (next.x !== atEnd.x || next.y !== atEnd.y) setAtEnd(next);
  };
  return (
    <View style={styles.frame} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={(e) => update(e.nativeEvent.contentOffset.x, offset.current.y)}
        contentContainerStyle={{ width: inner.w }}
        nestedScrollEnabled
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={32}
          onScroll={(e) => update(offset.current.x, e.nativeEvent.contentOffset.y)}
          contentContainerStyle={styles.content}
          nestedScrollEnabled
        >
          {children}
        </ScrollView>
      </ScrollView>

      {/* The frame's bottom and right edge shadows (exported as 16px strips, drawn at the frame's size). */}
      {box.w > 0 && !atEnd.y && (
        <View pointerEvents="none" style={[styles.fadeBottom, { width: box.w }]}>
          <Image
            source={vdr.edgeFadeBottom}
            contentFit="fill"
            style={{ width: 16, height: box.w, transform: [{ rotate: "90deg" }, { scaleY: -1 }] }}
          />
        </View>
      )}
      {box.h > 0 && !atEnd.x && (
        <View pointerEvents="none" style={[styles.fadeRight, { height: box.h }]}>
          <Image
            source={vdr.edgeFadeRight}
            contentFit="fill"
            style={{ width: 16, height: box.h, transform: [{ scaleY: -1 }] }}
          />
        </View>
      )}
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
  content: { paddingTop: 12, paddingBottom: 16, paddingHorizontal: 16 },
  fadeBottom: { position: "absolute", left: 0, bottom: 0, height: 16, opacity: 0.1, alignItems: "center", justifyContent: "center" },
  fadeRight: { position: "absolute", right: 0, top: 0, width: 16, opacity: 0.1 },
});
