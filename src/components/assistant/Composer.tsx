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
import { transition } from "../../theme/motion";
import { useHover } from "../../hooks/useHover";
import { Icon } from "../Icon";
import { Stroke } from "../Stroke";
import { Tooltip } from "./Tooltip";
import { pointer } from "../../theme/cursor";

const LINE_HEIGHT = 18;
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
 * Prompt area (Figma "Smart assist" states). Multi-line input that grows up to six lines then scrolls;
 * Enter sends, Shift+Enter adds a line. Attached files show as chips above the text. The send button is
 * grey while empty and pine once there is something to send, and the border turns pine on focus.
 */
export function Composer({ onSend, generating = false, onStop }: Props) {
  const [text, setText] = useState("");
  const [height, setHeight] = useState(LINE_HEIGHT);
  const [focused, setFocused] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const canSend = text.trim().length > 0 && !generating;

  function send() {
    const value = text.trim();
    if (!value) return;
    onSend?.(value);
    setText("");
    setHeight(LINE_HEIGHT);
    setFiles([]);
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
  const radius = focused ? 6 : 12;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.composer,
          { borderRadius: radius, paddingTop: files.length ? 8 : 10 },
          focused && styles.composerFocused,
        ]}
      >
        <View style={styles.content}>
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
            onChangeText={setText}
            onContentSizeChange={(e) =>
              setHeight(
                Math.min(
                  Math.max(e.nativeEvent.contentSize.height, LINE_HEIGHT),
                  LINE_HEIGHT * MAX_LINES,
                ),
              )
            }
            onKeyPress={onKeyPress}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            multiline
            placeholder={assistant.composerPlaceholder}
            placeholderTextColor={colors.slate500}
            accessibilityLabel="Ask a follow up question"
            style={[
              type.composer,
              styles.input,
              { height, color: colors.slate800 },
            ]}
          />
        </View>

        <View style={styles.actions}>
          <View style={styles.attach}>
            <AttachButton
              icon="upload"
              label="Upload file"
              onPress={async () => addFiles(await pickFiles())}
            />
            <AttachButton
              icon="dataRoom"
              label="Choose from data room"
              onPress={() => addFiles(assistant.dataRoomFiles)}
            />
          </View>
          {generating ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Stop generating"
              onPress={onStop}
              style={({ pressed }) => [
                styles.send,
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
                canSend && pointer,
                pressed && canSend && styles.pressed,
              ]}
            >
              <Icon name={canSend ? "sendActive" : "send"} size={24} />
            </Pressable>
          )}
        </View>
        <Stroke
          color={focused ? colors.pine700 : colors.slate100}
          radius={radius}
        />
      </View>
    </View>
  );
}

function AttachButton({
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
    <View style={styles.attachSlot}>
      {hover.hovered && <Tooltip label={label} />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        {...hover.handlers}
        style={[styles.attachButton, hover.hovered && styles.attachButtonHover]}
      >
        <Icon name={icon} size={16} />
      </Pressable>
    </View>
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
  composer: {
    width: "100%",
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 12,
    boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
  },
  composerFocused: { boxShadow: "0px 0px 0px 3px rgba(34,115,62,0.15)" },
  content: { gap: 8 },
  chips: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 2 },
  input: {
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    ...(Platform.OS === "web"
      ? ({ outlineStyle: "none", resize: "none" } as object)
      : null),
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attach: { flexDirection: "row", alignItems: "center", gap: 6 },
  attachSlot: { position: "relative" },
  attachButton: {
    // 24px square with a 16px icon (Figma composer).
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.slate50,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
    ...transition(["background-color"]),
  },
  attachButtonHover: { backgroundColor: colors.dew75 },
  send: { width: 24, height: 24, ...transition(["transform"]) },
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
  pressed: { transform: [{ scale: 0.92 }] },
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
