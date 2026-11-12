import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEvent,
  View,
} from "react-native";
import { colors, fonts, type } from "../../theme";
import { assistant } from "../../data/researchNote";
import { benchmarkAssistant } from "../../data/benchmarking";
import { useActiveTab } from "../../state/activeTab";
import { useSelectionContext } from "../../state/selectionContext";
import { transition } from "../../theme/motion";
import { useHover } from "../../hooks/useHover";
import { Icon } from "../Icon";
import { FadeIn } from "./FadeIn";
import { Stroke } from "../Stroke";
import { pointer } from "../../theme/cursor";

/** Line height of typed text; the placeholder is set on 18. */
const LINE_HEIGHT = 16;
const PLACEHOLDER_LINE_HEIGHT = 18;
const MAX_LINES = 6;

type Props = {
  /** Called with the trimmed text when the user sends (Enter or the send button). */
  onSend?: (text: string) => void;
  /** An answer is being generated: the send button becomes a stop button and sending is paused. */
  generating?: boolean;
  onStop?: () => void;
};

/** Web only: open the system file picker and resolve with the chosen file names. */
function pickFiles(): Promise<string[]> {
  if (Platform.OS !== "web") return Promise.resolve([]);
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = () =>
      resolve(Array.from(input.files ?? []).map((f) => f.name));
    input.oncancel = () => resolve([]);
    input.click();
  });
}

/**
 * Prompt area (Figma "Smart assist" states). Empty or one line: a single 44px row with the plus button,
 * the text and the send button. Once the text wraps or files are attached it
 * stacks: text (and file chips) on top, plus and send on a row below. The plus button opens a small
 * menu (upload from device / choose from data room). Enter sends, Shift+Enter adds a line. The send
 * button is grey while empty and pine once there is something to send; the border turns pine on focus.
 *
 * It is one tree in both layouts (the plus and send buttons are absolutely placed) so the input keeps
 * focus when it switches.
 */
export function Composer({ onSend, generating = false, onStop }: Props) {
  const { tab } = useActiveTab();
  const selection = useSelectionContext();
  const placeholder = selection.text
    ? "Ask a question related to this selection"
    : tab === 2
      ? benchmarkAssistant.placeholder
      : assistant.composerPlaceholder;
  const [text, setText] = useState("");
  const [height, setHeight] = useState(LINE_HEIGHT);
  const [focused, setFocused] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  // Sticky once the text has wrapped, until it is cleared, so the narrower inline width cannot flip-flop.
  const [wrapped, setWrapped] = useState(false);
  const canSend = text.trim().length > 0 && !generating;
  const stacked = files.length > 0 || wrapped;

  function send() {
    const value = text.trim();
    if (!value) return;
    onSend?.(value);
    setText("");
    setHeight(LINE_HEIGHT);
    setWrapped(false);
    setFiles([]);
  }

  function onChangeText(value: string) {
    setText(value);
    if (!value) {
      setWrapped(false);
      setHeight(LINE_HEIGHT);
    }
  }

  function onKeyPress(e: TextInputKeyPressEvent) {
    // Web only: the event carries shiftKey and can be cancelled so Enter doesn't insert a newline.
    const ev = e.nativeEvent as typeof e.nativeEvent & { shiftKey?: boolean };
    if (ev.key === "Enter" && !ev.shiftKey) {
      e.preventDefault();
      if (!generating) send();
    }
  }

  const addFiles = (names: string[]) =>
    setFiles((prev) => [...prev, ...names.filter((n) => !prev.includes(n))]);

  const inputHeight = text ? height : PLACEHOLDER_LINE_HEIGHT;

  return (
    <View style={styles.wrap}>
      {/* Text selected in the note sits above the composer as context (Figma 452:34840). */}
      <View style={selection.text ? styles.contextBox : null}>
        {selection.text && (
          <ContextStrip text={selection.text} onRemove={selection.clear} />
        )}
        <View
          style={[
            styles.composer,
            stacked ? styles.composerStacked : styles.composerInline,
            stacked && files.length > 0 && { paddingTop: 11 },
            focused && styles.composerFocused,
          ]}
        >
          <View
            style={[
              styles.content,
              stacked ? styles.contentStacked : styles.contentInline,
            ]}
          >
            {files.length > 0 && (
              <View style={styles.chips}>
                <Chip
                  label={files[0]}
                  file
                  onRemove={() => setFiles((prev) => prev.slice(1))}
                />
                {files.length > 1 && (
                  <Chip
                    label={`+${files.length - 1} files`}
                    onRemove={() => setFiles((prev) => prev.slice(0, 1))}
                  />
                )}
              </View>
            )}
            <TextInput
              value={text}
              onChangeText={onChangeText}
              onContentSizeChange={(e) => {
                const h = e.nativeEvent.contentSize.height;
                if (text && h > LINE_HEIGHT * 1.5) setWrapped(true);
                setHeight(
                  Math.min(Math.max(h, LINE_HEIGHT), LINE_HEIGHT * MAX_LINES),
                );
              }}
              onKeyPress={onKeyPress}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              multiline
              placeholder={placeholder}
              placeholderTextColor={colors.slate500}
              accessibilityLabel="Ask a follow up question"
              style={[
                type.composer,
                styles.input,
                {
                  height: inputHeight,
                  lineHeight: text ? LINE_HEIGHT : PLACEHOLDER_LINE_HEIGHT,
                  color: colors.slate800,
                },
              ]}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add files"
            accessibilityState={{ expanded: menuOpen }}
            onPress={() => setMenuOpen((open) => !open)}
            style={[
              styles.plus,
              stacked ? styles.atBottom : styles.atTop,
              menuOpen && styles.plusOpen,
            ]}
          >
            <Icon name={menuOpen ? "plusGreen" : "plus"} size={16} />
          </Pressable>

          {generating ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Stop generating"
              onPress={onStop}
              style={({ pressed }) => [
                styles.send,
                stacked ? styles.atBottom : styles.atTop,
                styles.stop,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.stopSquare} />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={send}
              style={({ pressed }) => [
                styles.send,
                stacked ? styles.atBottom : styles.atTop,
                canSend && pointer,
                pressed && canSend && styles.pressed,
              ]}
            >
              <Icon name={canSend ? "sendActive" : "send"} size={24} />
            </Pressable>
          )}

          {menuOpen && (
            <>
              <Pressable
                accessibilityLabel="Close menu"
                onPress={() => setMenuOpen(false)}
                style={styles.backdrop}
              />
              <FadeIn
                rise={4}
                duration={140}
                style={{
                  ...styles.menu,
                  ...(stacked ? styles.menuStacked : styles.menuInline),
                }}
              >
                <MenuItem
                  icon="upload"
                  label="Upload from device"
                  onPress={async () => {
                    setMenuOpen(false);
                    addFiles(await pickFiles());
                  }}
                />
                <MenuItem
                  icon="dataRoom"
                  label="Choose from data room"
                  onPress={() => {
                    setMenuOpen(false);
                    addFiles(assistant.dataRoomFiles);
                  }}
                />
              </FadeIn>
            </>
          )}
          <Stroke
            color={focused || menuOpen ? colors.pine700 : colors.slate100}
            radius={12}
          />
        </View>
      </View>
    </View>
  );
}

/** The selected excerpt (one line, truncated) with a Remove action, on the dark green strip above the composer. */
function ContextStrip({
  text,
  onRemove,
}: {
  text: string;
  onRemove: () => void;
}) {
  const hover = useHover();
  return (
    <View style={styles.strip}>
      <View style={styles.stripMain}>
        <Icon name="selectionSparkles" size={12} />
        <Text numberOfLines={1} style={styles.stripText}>
          {text}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Remove selected text from context"
        onPress={onRemove}
        {...hover.handlers}
        style={styles.stripRemove}
      >
        <Text
          style={[styles.stripRemoveText, { opacity: hover.hovered ? 1 : 0.8 }]}
        >
          Remove
        </Text>
      </Pressable>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: "upload" | "dataRoom";
  label: string;
  onPress: () => void;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={onPress}
      {...hover.handlers}
      style={[styles.menuItem, hover.hovered && styles.menuItemHover]}
    >
      <Icon name={icon} size={16} />
      <Text style={styles.menuText}>{label}</Text>
    </Pressable>
  );
}

/** A file chip. Hovering reveals the dark remove badge on its top-right corner (Figma 354:20632). */
function Chip({
  label,
  file,
  onRemove,
}: {
  label: string;
  file?: boolean;
  onRemove: () => void;
}) {
  const hover = useHover();
  return (
    <Pressable {...hover.handlers} style={styles.chipWrap}>
      <View style={[styles.chip, hover.hovered && styles.chipLifted]}>
        {file && <Icon name="fileSmall" size={16} />}
        <Text numberOfLines={1} style={styles.chipText}>
          {label}
        </Text>
      </View>
      {hover.hovered && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          onPress={onRemove}
          style={styles.remove}
        >
          <Icon name="chipRemove" size={12} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", paddingHorizontal: 16 },
  contextBox: {
    paddingTop: 8,
    // Same 12px corners as the composer inside it, so no green shows at its bottom corners.
    borderRadius: 12,
    backgroundColor: colors.pine900,
    boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
  },
  strip: {
    height: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stripMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stripText: {
    flex: 1,
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.white,
  },
  stripRemove: { ...pointer, ...transition(["opacity"]) },
  stripRemoveText: {
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 12,
    color: colors.white,
  },
  composer: {
    width: "100%",
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    borderRadius: 12,
    boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
  },
  // Single row: 10px above and below the 24px row.
  composerInline: { paddingTop: 10, paddingBottom: 10 },
  // Text on top, a 24px actions row below (reserved by contentStacked's bottom padding).
  composerStacked: { paddingTop: 9, paddingBottom: 11 },
  composerFocused: { boxShadow: "0px 0px 0px 2px rgba(34,115,62,0.15)" },
  content: { gap: 8 },
  // Leave room for the absolutely placed plus (24 + 8) and send (8 + 24) buttons.
  contentInline: {
    minHeight: 24,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  contentStacked: { paddingBottom: 36 },
  chips: { flexDirection: "row", alignItems: "center", gap: 6 },
  input: {
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    ...(Platform.OS === "web"
      ? ({ outlineStyle: "none", resize: "none" } as object)
      : null),
  },
  atTop: { top: 10 },
  atBottom: { bottom: 10 },
  plus: {
    position: "absolute",
    left: 12,
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    ...pointer,
    ...transition(["background-color"]),
  },
  plusOpen: { backgroundColor: colors.dew75 },
  send: {
    position: "absolute",
    right: 12,
    width: 24,
    height: 24,
    zIndex: 3,
    ...transition(["transform"]),
  },
  // Stop: the pine circle with a small white square, as in most chat UIs.
  stop: {
    borderRadius: 12,
    backgroundColor: colors.pine700,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
  },
  stopSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  pressed: { transform: [{ scale: 0.96 }] },
  // Catches taps outside the menu so any tap closes it. On web it is fixed to the viewport: an oversized
  // absolute box would make the assistant's overflow-hidden parent scrollable and shift the composer.
  backdrop: {
    position: Platform.OS === "web" ? ("fixed" as "absolute") : "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  menu: {
    position: "absolute",
    left: 12,
    padding: 4,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate50,
    boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
    zIndex: 4,
  },
  // Stacked: over the text area, 8px above the actions row (Figma 354:20428). Single row: the composer keeps
  // its height, so the menu sits just above it.
  menuStacked: { bottom: 43 },
  menuInline: { bottom: "100%", marginBottom: 8 },
  menuItem: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
    ...pointer,
  },
  menuItemHover: { backgroundColor: "#f0f5f4" },
  menuText: {
    fontFamily: fonts.geistRegular,
    fontSize: 12,
    lineHeight: 16,
    color: "#2b303b",
  },
  chipWrap: { position: "relative" },
  chip: {
    height: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 6,
    paddingRight: 8,
    borderRadius: 6,
    backgroundColor: colors.slate50,
    borderWidth: 0.5,
    borderColor: colors.slate200,
    maxWidth: 220,
  },
  chipLifted: { boxShadow: "0px 1px 3px rgba(0,0,0,0.05)" },
  chipText: {
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 18,
    color: colors.slate600,
    flexShrink: 1,
  },
  remove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 12,
    height: 12,
    ...pointer,
  },
});
