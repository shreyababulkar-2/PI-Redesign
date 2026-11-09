import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from "react-native";
import { colors, fonts, type } from "../../theme";
import { thinking } from "../../data/assistantAnswers";
import { useConversation } from "../../hooks/useConversation";
import { Icon } from "../Icon";
import { AnswerView } from "./AnswerView";
import { FadeIn } from "./FadeIn";
import { JumpToLatest } from "./JumpToLatest";
import { BackgroundGlow } from "./BackgroundGlow";
import { Composer } from "./Composer";
import { ThoughtBlock } from "./ThoughtBlock";
import { TypingDots } from "./TypingDots";
import { Welcome } from "./Welcome";
import { Stroke } from "../Stroke";
import { pointer } from "../../theme/cursor";

type Props = {
  /** When set, the collapse icon in the header calls this (used when the assistant is an overlay). */
  onCollapse?: () => void;
};

/**
 * The assistant. It starts on the welcome state with suggested questions; each question (typed or
 * picked) becomes a turn that shows the thought steps first and then the answer. The "new chat" icon
 * in the header clears the conversation.
 */
export function AssistantPanel({ onCollapse }: Props) {
  const {
    turns,
    generating,
    send,
    stop,
    regenerate,
    finishStreaming,
    toggleThought,
    reset,
    streamedWords,
  } = useConversation();
  const chatRef = useRef<ScrollViewInstance>(null);

  // When a question is sent it moves to the top of the chat, and the answer builds underneath it (the
  // usual chat pattern). The newest turn is at least one screen tall so there is room to scroll that far.
  const turnY = useRef<Record<number, number>>({});
  const pendingScroll = useRef<number | null>(null);
  const [chatHeight, setChatHeight] = useState(0);
  const lastTurnId = turns[turns.length - 1]?.id;
  useEffect(() => {
    // Wait for the new turn to be laid out (see onLayout below) before scrolling to it.
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

  // "Jump to latest": while an answer is being generated and the user has scrolled up so that part of it is
  // below the visible area, show a down arrow over the chat that scrolls back to it.
  const offsetY = useRef(0);
  // Where the newest answer ends, from the latest measurements (a child reports its layout before its
  // parent does, so the bottom is worked out here rather than when either one reports).
  const lastResponse = useRef({ id: -1, y: 0, height: 0 });
  const [showJump, setShowJump] = useState(false);
  function updateJump() {
    const { id, y, height } = lastResponse.current;
    const bottom = (turnY.current[id] ?? 0) + y + height;
    setShowJump(generating && bottom - (offsetY.current + chatHeight) > 24);
  }
  useEffect(updateJump, [generating, chatHeight]);

  const onToggle = toggleThought;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Icon name="assistantLogo" size={20} width={19.167} />
          <Text style={[type.assistantTitle, { color: colors.white }]}>
            Assistant
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New chat"
            onPress={reset}
            style={styles.headerButton}
          >
            <Icon name="addCircle" size={20} />
          </Pressable>
          <View style={styles.headerButton}>
            <Icon name="history" size={20} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Collapse assistant"
            disabled={!onCollapse}
            onPress={onCollapse}
            style={styles.headerButton}
          >
            <Icon name="collapse" size={20} />
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        <BackgroundGlow />

        <View style={styles.chat}>
          <ScrollView
            ref={chatRef}
            onLayout={(e) => setChatHeight(e.nativeEvent.layout.height)}
            onScroll={(e) => {
              offsetY.current = e.nativeEvent.contentOffset.y;
              updateJump();
            }}
            scrollEventThrottle={32}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {turns.length === 0 ? (
              <Welcome onPick={send} />
            ) : (
              turns.map((turn) => (
                <View
                  key={turn.id}
                  onLayout={(e) =>
                    onTurnLayout(turn.id, e.nativeEvent.layout.y)
                  }
                  style={[
                    styles.turn,
                    turn.id === lastTurnId && { minHeight: chatHeight },
                  ]}
                >
                  <FadeIn style={styles.userRow}>
                    <View style={styles.userBubble}>
                      <Text
                        style={[
                          type.chatBubble,
                          styles.userText,
                          { color: colors.slate800 },
                        ]}
                      >
                        {turn.question}
                      </Text>
                    </View>
                  </FadeIn>

                  <View
                    style={styles.response}
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
                      onToggle={() => onToggle(turn.id)}
                      startedAt={turn.startedAt}
                      thoughtSecs={turn.thoughtSecs}
                      stepTimes={turn.stepTimes}
                    />
                    {(turn.phase === "streaming" ||
                      turn.phase === "done" ||
                      (turn.phase === "stopped" && turn.stoppedWords > 0)) && (
                      <AnswerView
                        key={`${turn.id}-${turn.run}`}
                        answerId={turn.answerId}
                        phase={turn.phase}
                        stoppedWords={turn.stoppedWords}
                        onProgress={(w) => (streamedWords.current = w)}
                        onStreamed={() => finishStreaming(turn.id)}
                        onRegenerate={() => regenerate(turn.id)}
                      />
                    )}
                    {(turn.phase === "waiting" ||
                      turn.phase === "thinking") && <TypingDots />}
                    {turn.phase === "stopped" && turn.stoppedWords === 0 && (
                      <Text style={styles.stopped}>
                        You stopped this response
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {showJump && (
            <View pointerEvents="box-none" style={styles.jumpWrap}>
              <FadeIn rise={6} duration={180}>
                <JumpToLatest
                  onPress={() =>
                    chatRef.current?.scrollToEnd({ animated: true })
                  }
                />
              </FadeIn>
            </View>
          )}
        </View>

        <Composer onSend={send} generating={generating} onStop={stop} />
        <Stroke color={colors.slate100} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
  },
  header: {
    height: 40,
    backgroundColor: colors.pine800,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  headerButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
  },
  body: {
    flex: 1,
    overflow: "hidden",
    paddingVertical: 16,
    gap: 16,
    alignItems: "center",
  },
  chat: { flex: 1, width: "100%" },
  chatScroll: { flex: 1 },
  chatContent: { paddingHorizontal: 16, gap: 20 },
  turn: { width: "100%", gap: 20 },
  userRow: { width: "100%", alignItems: "flex-end", paddingLeft: 32 },
  userBubble: {
    // 73% of the chat width = the design's 265px at the 396px panel, and it scales with the panel.
    width: "73%",
    backgroundColor: colors.dew75,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 4,
  },
  userText: { textAlign: "left", textWrap: "pretty" } as TextStyle,
  jumpWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 4,
    alignItems: "center",
  },
  response: { width: "100%", gap: 12 },
  stopped: {
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.slate500,
  },
});
