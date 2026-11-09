import { useEffect, useRef, useState } from "react";
import {
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { colors } from "../../theme";
import { useHover } from "../../hooks/useHover";
import { AssistantPanel } from "./AssistantPanel";
import { useAssistantOverlay } from "../../state/assistantOverlay";

/** Narrowest the assistant is allowed to get (the Figma design width). */
export const ASSISTANT_MIN_WIDTH = 396;
/** The assistant can never take more than half of the screen. */
const MAX_RATIO = 0.5;
/** Default share of the window: 396px at the 1280px design width. */
const DEFAULT_RATIO = ASSISTANT_MIN_WIDTH / 1280;
const STORAGE_KEY = "pi-redesign:assistant-ratio";

/** Share of the window chosen earlier in this browser session (survives reloads, not new sessions). */
function readStoredRatio(): number {
  if (Platform.OS !== "web") return DEFAULT_RATIO;
  try {
    const n = Number(window.sessionStorage.getItem(STORAGE_KEY));
    return Number.isFinite(n) && n > 0 && n <= MAX_RATIO ? n : DEFAULT_RATIO;
  } catch {
    return DEFAULT_RATIO;
  }
}

function storeRatio(ratio: number) {
  if (Platform.OS !== "web") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, ratio.toFixed(4));
  } catch {
    // storage unavailable: the width just won't persist
  }
}

/** Web only: stop text from being selected while the handle is dragged. */
function setSelectable(selectable: boolean) {
  if (Platform.OS === "web")
    document.body.style.userSelect = selectable ? "" : "none";
}

/**
 * The assistant. It takes a share of the window (about 31% by default), clamped between its
 * minimum width and 50% of the screen, so it scales as the window does; dragging the handle on its
 * left edge changes that share. Below ASSISTANT_COLLAPSE_BELOW it collapses; the header's assistant
 * button then opens it as an overlay.
 */
export function ResizableAssistant() {
  const { width: windowWidth } = useWindowDimensions();
  const {
    collapsed,
    open: overlayOpen,
    setOpen: setOverlayOpen,
  } = useAssistantOverlay();
  const [ratio, setRatio] = useState(readStoredRatio);
  const [dragging, setDragging] = useState(false);
  const hover = useHover();

  const max = Math.floor(windowWidth * MAX_RATIO);
  const width = Math.min(
    Math.max(Math.round(ratio * windowWidth), ASSISTANT_MIN_WIDTH),
    Math.max(max, ASSISTANT_MIN_WIDTH),
  );

  // Latest values for the responder, which is created once.
  const live = useRef({ windowWidth, width });
  useEffect(() => {
    live.current = { windowWidth, width };
  }, [windowWidth, width]);
  const startWidth = useRef(ASSISTANT_MIN_WIDTH);

  // The responder reads the latest values through `live` at event time (the lint rule can't tell these
  // closures only run in event handlers, never during render).
  /* eslint-disable react-hooks/refs */
  const [responder] = useState(() => {
    const end = () => {
      setDragging(false);
      setSelectable(true);
      storeRatio(live.current.width / live.current.windowWidth);
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
        const { windowWidth: w } = live.current;
        const next = Math.min(
          Math.max(startWidth.current - g.dx, ASSISTANT_MIN_WIDTH),
          w * MAX_RATIO,
        );
        setRatio(next / w);
      },
      onPanResponderRelease: () => end(),
      onPanResponderTerminate: () => end(),
    });
  });
  /* eslint-enable react-hooks/refs */

  if (collapsed) {
    // Collapsed: nothing beside the note. The header's assistant button opens it as an overlay.
    if (!overlayOpen) return null;
    return (
      <>
        <Pressable
          accessibilityLabel="Close assistant"
          onPress={() => setOverlayOpen(false)}
          style={styles.scrim}
        />
        <View style={styles.overlay}>
          <AssistantPanel onCollapse={() => setOverlayOpen(false)} />
        </View>
      </>
    );
  }

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
  // Sits in the 8px gap beside the panel (overlapping its edge by 4px), full height.
  handle: {
    position: "absolute",
    top: 8,
    bottom: 8,
    left: -8,
    width: 12,
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
  // Collapsed state: the panel is an overlay over the note, above a dimmed scrim.
  scrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(15,23,41,0.12)",
    zIndex: 59,
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 8,
    bottom: 0,
    width: ASSISTANT_MIN_WIDTH,
    maxWidth: "100%",
    zIndex: 60,
  },
});
