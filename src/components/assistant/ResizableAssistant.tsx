import { useEffect, useRef, useState } from "react";
import {
  PanResponder,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { colors } from "../../theme";
import { useHover } from "../../hooks/useHover";
import { AssistantPanel } from "./AssistantPanel";

export const ASSISTANT_MIN_WIDTH = 396;
/** Screen padding (56 left clears the nav pods, 12 right) plus the 12 gap between the two columns. */
const LAYOUT_CHROME = 56 + 12 + 12;

/** Web only: stop text from being selected while the handle is dragged. */
function setSelectable(selectable: boolean) {
  if (Platform.OS === "web")
    document.body.style.userSelect = selectable ? "" : "none";
}

/**
 * The assistant panel with a drag handle on its left edge. Width runs from the design size (396)
 * up to an even 50/50 split with the note column.
 */
export function ResizableAssistant() {
  const { width: windowWidth } = useWindowDimensions();
  const max = Math.max(
    ASSISTANT_MIN_WIDTH,
    Math.floor((windowWidth - LAYOUT_CHROME) / 2),
  );
  const [requested, setRequested] = useState(ASSISTANT_MIN_WIDTH);
  const [dragging, setDragging] = useState(false);
  const hover = useHover();

  // Latest bounds/width for the responder, which is created once.
  const live = useRef({ max, width: ASSISTANT_MIN_WIDTH });
  const width = Math.min(Math.max(requested, ASSISTANT_MIN_WIDTH), max);
  useEffect(() => {
    live.current = { max, width };
  }, [max, width]);
  const startWidth = useRef(ASSISTANT_MIN_WIDTH);

  // The responder is created once; its handlers read the latest bounds through `live` at event time
  // (the lint rule can't tell these closures only run in event handlers, never during render).
  /* eslint-disable react-hooks/refs */
  const [responder] = useState(() => {
    const end = () => {
      setDragging(false);
      setSelectable(true);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startWidth.current = live.current.width;
        setDragging(true);
        setSelectable(false);
      },
      // Dragging left (negative dx) widens the panel.
      onPanResponderMove: (_e, g) => {
        const next = startWidth.current - g.dx;
        setRequested(
          Math.min(Math.max(next, ASSISTANT_MIN_WIDTH), live.current.max),
        );
      },
      onPanResponderRelease: () => end(),
      onPanResponderTerminate: () => end(),
    });
  });
  /* eslint-enable react-hooks/refs */

  const active = dragging || hover.hovered;

  return (
    <View style={[styles.wrap, { width }]}>
      <AssistantPanel />
      <View
        {...responder.panHandlers}
        {...(hover.handlers as object)}
        accessibilityRole="adjustable"
        accessibilityLabel="Resize assistant"
        style={styles.handle}
      >
        <View style={[styles.bar, active && styles.barActive]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  // Sits in the 12px gap beside the panel, full height.
  handle: {
    position: "absolute",
    top: 8,
    bottom: 7,
    left: -10,
    width: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
    ...(Platform.OS === "web"
      ? ({ cursor: "col-resize", touchAction: "none" } as object)
      : null),
  },
  bar: {
    width: 3,
    height: 40,
    borderRadius: 2,
    backgroundColor: colors.slate300,
    opacity: 0,
  },
  barActive: { opacity: 1 },
});
