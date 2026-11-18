import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { colors, fonts } from "../theme";
import { pointer } from "../theme/cursor";
import { press, transition } from "../theme/motion";
import { useHover } from "../hooks/useHover";
import { SideNav } from "../components/SideNav";
import { useScreen } from "../state/screen";
import { vdr } from "../assets/vdr";
import { thinking } from "../data/assistantAnswers";
import { useConversation } from "../hooks/useConversation";
import { AnswerView } from "../components/assistant/AnswerView";
import { FadeIn } from "../components/assistant/FadeIn";
import { JumpToLatest } from "../components/assistant/JumpToLatest";
import { ThoughtBlock } from "../components/assistant/ThoughtBlock";
import { TypingDots } from "../components/assistant/TypingDots";

/**
 * Full view of the assistant (Figma "VDR - Agentic exp", node 28:15209 "Central chat"): chat history on the left,
 * a top bar with the chat title, and a 602px conversation column with the composer pinned underneath. Opened by
 * sending a question from the VDR composer. Geist throughout.
 */

type Src = (typeof vdr)[keyof typeof vdr];

function Img({ src, w, h = w, style }: { src: Src; w: number; h?: number; style?: object }) {
  return (
    <Image
      source={src}
      contentFit="fill"
      style={[{ width: w, height: h }, style]}
      accessibilityElementsHidden
    />
  );
}

const body = {
  fontFamily: fonts.geistRegular,
  fontSize: 12,
  lineHeight: 18,
  letterSpacing: 0.09,
  color: colors.slate800,
} as const;

const HISTORY: { label: string; items: string[] }[] = [
  { label: "Today", items: ["IC discussion preparations", "Summarise Q3 financials"] },
  { label: "Yesterday", items: ["Valuation comps vs. peers", "Key legal risks in term sheet", "Market size & growth drivers"] },
  { label: "Last 7 days", items: ["Founder background check", "Cap table review", "Draft diligence checklist"] },
];

export function AssistantScreen() {
  const { question } = useScreen();
  const {
    turns,
    generating,
    send,
    stop,
    regenerate,
    finishStreaming,
    toggleThought,
    streamedWords,
  } = useConversation();
  const chatRef = useRef<ScrollViewInstance>(null);

  // The question that opened this view is sent once, on arrival.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    send(question || DEFAULT_QUESTION);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A sent question moves to the top of the chat and the answer builds underneath it; the newest turn is at least
  // one screen tall so there is room to scroll that far (same pattern as the assistant panel).
  const turnY = useRef<Record<number, number>>({});
  const pendingScroll = useRef<number | null>(null);
  const [chatHeight, setChatHeight] = useState(0);
  const lastTurnId = turns[turns.length - 1]?.id;
  useEffect(() => {
    pendingScroll.current = lastTurnId ?? null;
  }, [lastTurnId]);
  function onTurnLayout(id: number, y: number) {
    turnY.current[id] = y;
    if (id === lastTurnId) updateJump();
    if (pendingScroll.current === id) {
      pendingScroll.current = null;
      setTimeout(() => chatRef.current?.scrollTo({ y, animated: true }), 30);
    }
  }

  // "Jump to latest": while an answer is being written below the visible area, a down arrow scrolls back to it.
  const offsetY = useRef(0);
  const lastResponse = useRef({ id: -1, y: 0, height: 0 });
  const [showJump, setShowJump] = useState(false);
  function updateJump() {
    const { id, y, height } = lastResponse.current;
    const bottom = (turnY.current[id] ?? 0) + y + height;
    setShowJump(generating && bottom - (offsetY.current + chatHeight) > 24);
  }
  useEffect(updateJump, [generating, chatHeight]);

  return (
    <View style={styles.root}>
      <History />
      <View style={styles.main}>
        <TopBar />
        <View style={styles.column}>
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={chatRef}
              onLayout={(e) => setChatHeight(e.nativeEvent.layout.height)}
              onScroll={(e) => {
                offsetY.current = e.nativeEvent.contentOffset.y;
                updateJump();
              }}
              scrollEventThrottle={32}
              style={{ flex: 1 }}
              contentContainerStyle={styles.thread}
              showsVerticalScrollIndicator={false}
            >
              {turns.map((turn) => (
                <View
                  key={turn.id}
                  onLayout={(e) => onTurnLayout(turn.id, e.nativeEvent.layout.y)}
                  style={[
                    { gap: 24 },
                    turn.id === lastTurnId && { minHeight: chatHeight },
                  ]}
                >
                  <FadeIn style={styles.userRow}>
                    <View style={styles.bubble}>
                      <Text style={[body, { textAlign: "right" }]}>{turn.question}</Text>
                    </View>
                  </FadeIn>
                  <View
                    style={{ gap: 12 }}
                    onLayout={(e) => {
                      if (turn.id !== lastTurnId) return;
                      const { y, height } = e.nativeEvent.layout;
                      lastResponse.current = { id: turn.id, y, height };
                      updateJump();
                    }}
                  >
                    <ThoughtBlock
                      thinking={thinking[turn.answerId]}
                      phase={turn.phase}
                      steps={turn.steps}
                      expanded={turn.expanded}
                      onToggle={() => toggleThought(turn.id)}
                      startedAt={turn.startedAt}
                      thoughtSecs={turn.thoughtSecs}
                      stepTimes={turn.stepTimes}
                    />
                    {(turn.phase === "streaming" ||
                      turn.phase === "done" ||
                      (turn.phase === "stopped" && turn.stoppedWords > 0)) && (
                      <AnswerView
                        key={`${turn.id}-${turn.run}`}
                        wide
                        answerId={turn.answerId}
                        phase={turn.phase}
                        stoppedWords={turn.stoppedWords}
                        onProgress={(w) => (streamedWords.current = w)}
                        onStreamed={() => finishStreaming(turn.id)}
                        onRegenerate={() => regenerate(turn.id)}
                      />
                    )}
                    {(turn.phase === "waiting" || turn.phase === "thinking") && <TypingDots />}
                    {turn.phase === "stopped" && turn.stoppedWords === 0 && (
                      <Text style={styles.stopped}>You stopped this response</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
            {showJump && (
              <View pointerEvents="box-none" style={styles.jumpWrap}>
                <FadeIn rise={6} duration={180}>
                  <JumpToLatest onPress={() => chatRef.current?.scrollToEnd({ animated: true })} />
                </FadeIn>
              </View>
            )}
          </View>
          <ChatComposer onSend={send} generating={generating} onStop={stop} />
        </View>
      </View>
      <SideNav />
    </View>
  );
}

const DEFAULT_QUESTION =
  "Based on the available information, how prepared are we to make an investment decision? Highlight key considerations and gaps.";

/* ----------------------------------------------------------------- history */

function History() {
  return (
    <View style={styles.history}>
      <View style={styles.historyHead}>
        <Text style={[body, { fontFamily: fonts.geistMedium, letterSpacing: 0 }]}>Chat history</Text>
        <View style={styles.row6}>
          <SoftButton label="New chat" src={vdr.addChat} w={16} />
          <SoftButton label="Collapse chat history" src={vdr.collapseHistory} w={12} turn />
        </View>
      </View>
      <View style={styles.search}>
        <Img src={vdr.search} w={16} />
        <Text style={[body, { color: colors.slate500, letterSpacing: 0 }]}>Search chats</Text>
      </View>
      <View style={{ gap: 12 }}>
        {HISTORY.map((g) => (
          <View key={g.label} style={{ gap: 2 }}>
            <Text style={styles.date}>{g.label}</Text>
            {g.items.map((item) => (
              <HistoryItem key={item} label={item} active={item === "IC discussion preparations"} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function HistoryItem({ label, active }: { label: string; active: boolean }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.historyItem,
        active ? styles.historyActive : hover.hovered && { backgroundColor: colors.slate50 },
        press(pressed),
      ]}
    >
      {active && <View style={styles.activeDot} />}
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontFamily: active ? fonts.geistMedium : fonts.geistRegular,
          fontSize: 12,
          lineHeight: 16,
          letterSpacing: active ? 0.144 : 0,
          color: active ? colors.pine900 : colors.slate600,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SoftButton({ label, src, w, turn }: { label: string; src: Src; w: number; turn?: boolean }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.soft,
        hover.hovered && { backgroundColor: colors.slate100 },
        press(pressed),
      ]}
    >
      <Img src={src} w={w} style={turn ? { transform: [{ rotate: "180deg" }] } : undefined} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ top bar */

function TopBar() {
  return (
    <View style={styles.topBar}>
      <View style={styles.company}>
        <Image source={vdr.companyLogo} style={{ width: 16, height: 16, borderRadius: 76 }} />
        <Text numberOfLines={1} style={styles.companyText}>
          Juspay Technologies Private limited
        </Text>
      </View>
      <Text style={[styles.title, { position: "absolute", left: 0, right: 0, textAlign: "center" }]} pointerEvents="none">
        IC discussion preparations
      </Text>
      <View style={[styles.row8, { justifyContent: "flex-end", width: 136 }]}>
        <SoftButton label="Context" src={vdr.assistantTopbarA} w={16} />
        <SoftButton label="Notes" src={vdr.assistantTopbarB} w={16} />
        <Pressable accessibilityRole="button" accessibilityLabel="More" style={({ pressed }) => [press(pressed), { ...pointer }]}>
          <Img src={vdr.assistantTopbarMore} w={28} />
        </Pressable>
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- composer */

function ChatComposer({
  onSend,
  generating,
  onStop,
}: {
  onSend: (q: string) => void;
  generating: boolean;
  onStop: () => void;
}) {
  const [value, setValue] = useState("");
  const [height, setHeight] = useState(18);
  const typing = value.trim().length > 0;
  const send = () => {
    const q = value.trim();
    if (!q) return;
    setValue("");
    setHeight(18);
    onSend(q);
  };
  return (
    <View style={styles.composer}>
      <View style={styles.row16}>
        <View style={styles.row8}>
          <SquareButton src={vdr.plus} label="Add" />
          <SquareButton src={vdr.attach} label="Attach" />
        </View>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Ask anything about this deal..."
          placeholderTextColor={colors.slate600}
          multiline
          numberOfLines={1}
          rows={1}
          onContentSizeChange={(e) => setHeight(Math.min(90, Math.max(18, e.nativeEvent.contentSize.height)))}
          onKeyPress={(e) => {
            const ev = e.nativeEvent as unknown as { key: string; shiftKey?: boolean };
            if (ev.key === "Enter" && !ev.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          accessibilityLabel="Ask anything about this deal"
          style={[styles.input, { height: typing ? height : 18 }]}
        />
        {generating ? (
          // One answer at a time: the send button becomes a stop button while the answer is being written.
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop generating"
            onPress={onStop}
            style={({ pressed }) => [styles.stop, press(pressed)]}
          >
            <View style={styles.stopSquare} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={!typing}
            onPress={send}
            style={({ pressed }) => [{ ...pointer }, press(pressed && typing)]}
          >
            <Img src={typing ? vdr.sendTyping : vdr.send} w={28} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function SquareButton({ src, label }: { src: Src; label: string }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.square,
        hover.hovered && { backgroundColor: colors.slate200 },
        press(pressed),
      ]}
    >
      <Img src={src} w={16} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ styles */

const styles = StyleSheet.create({
  // 56px clears the side nav; 8px gaps and inset (Figma: history at 60, top bar to 1272).
  root: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 56,
    paddingRight: 8,
    backgroundColor: colors.slate50,
  },
  row6: { flexDirection: "row", alignItems: "center", gap: 6 },
  row8: { flexDirection: "row", alignItems: "center", gap: 8 },
  row16: { flexDirection: "row", alignItems: "center", gap: 16 },

  history: {
    width: 250,
    gap: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.white,
  },
  historyHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  soft: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.slate50,
    ...pointer,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.slate50,
  },
  date: {
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.slate400,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 8,
    ...pointer,
    ...transition(["background-color"]),
  },
  historyActive: { backgroundColor: "#f0f5f4" },
  activeDot: { width: 4, height: 4, borderRadius: 100, backgroundColor: colors.pine900 },

  main: { flex: 1, minWidth: 0, gap: 8 },
  topBar: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  company: { width: 136, flexDirection: "row", alignItems: "center", gap: 4 },
  companyText: {
    flex: 1,
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.44,
    textTransform: "uppercase",
    color: colors.slate600,
  },
  title: { fontFamily: fonts.geistMedium, fontSize: 14, lineHeight: 18, color: colors.slate800 },

  column: { flex: 1, width: "100%", maxWidth: 602, alignSelf: "center", paddingBottom: 8 },
  thread: { gap: 24, paddingTop: 4, paddingBottom: 24 },
  userRow: { alignItems: "flex-end" },
  bubble: {
    maxWidth: 480,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 2,
    backgroundColor: colors.white,
  },

  jumpWrap: { position: "absolute", left: 0, right: 0, bottom: 4, alignItems: "center" },
  stopped: { fontFamily: fonts.geistRegular, fontSize: 10, lineHeight: 14, color: colors.slate500 },
  stop: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.pine700,
    ...pointer,
  },
  stopSquare: { width: 10, height: 10, borderRadius: 2, backgroundColor: colors.white },
  composer: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    boxShadow: "0px 2px 4px rgba(0,0,0,0.02)",
  },
  square: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.slate100,
    ...pointer,
    ...transition(["background-color"]),
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontFamily: fonts.geistRegular,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.09,
    color: colors.slate800,
    resize: "none",
    outlineStyle: "none",
  } as object,
});
