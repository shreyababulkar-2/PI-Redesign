import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, fonts, type } from "../../theme";
import { assistant } from "../../data/researchNote";
import { AnswerId, answers } from "../../data/assistantAnswers";
import { Phase } from "../../hooks/useConversation";
import { transition } from "../../theme/motion";
import { useHover } from "../../hooks/useHover";
import { useResponseScale } from "../../hooks/useResponseScale";
import { Icon } from "../Icon";
import { RichText } from "../note/RichText";
import { AnswerTable } from "./AnswerTable";
import { FadeIn } from "./FadeIn";
import { RevenueChart } from "./RevenueChart";
import { plainText, truncateBlocks, wordsOf } from "./streamText";
import { pointer } from "../../theme/cursor";

type Props = {
  answerId: AnswerId;
  phase: Phase;
  /** Words that had been written when the user stopped the answer. */
  stoppedWords: number;
  /** Reports how many words are written so far (read when the user presses stop). */
  onProgress: (words: number) => void;
  onStreamed: () => void;
  onRegenerate: () => void;
};

/**
 * The assistant's answer. While `phase` is "streaming" the written summary appears word by word with
 * human-ish pacing (a short beat at the end of sentences); once it is complete the table or chart
 * fades in, followed by the copy and regenerate actions. The content is a fixed example.
 */
export function AnswerView({
  answerId,
  phase,
  stoppedWords,
  onProgress,
  onStreamed,
  onRegenerate,
}: Props) {
  const content = answers[answerId];
  const words = useMemo(() => wordsOf(content.blocks), [content]);
  const total = words.length;
  const [shown, setShown] = useState(0);
  const streaming = phase === "streaming";

  useEffect(() => {
    if (!streaming) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let n = 0;
    const tick = () => {
      if (cancelled) return;
      n = Math.min(total, n + 1 + Math.floor(Math.random() * 2)); // 1–2 words at a time
      setShown(n);
      onProgress(n);
      if (n >= total) {
        onStreamed();
        return;
      }
      const pause = /[.:;]$/.test(words[n - 1]) ? 150 + Math.random() * 130 : 0; // breathe at sentence ends
      timer = setTimeout(tick, 38 + Math.random() * 32 + pause); // about 28 words a second
    };
    timer = setTimeout(tick, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming]);

  const stopped = phase === "stopped";
  const visible = streaming ? shown : stopped ? stoppedWords : total;
  const blocks = useMemo(
    () => truncateBlocks(content.blocks, visible),
    [content, visible],
  );
  const complete = phase === "done";
  const scale = useResponseScale();

  return (
    <View style={styles.root}>
      {blocks.length > 0 && (
        <RichText
          blocks={blocks}
          regular={type.answer}
          bold={type.answerBold}
          color={colors.slate800}
          scale={scale}
        />
      )}
      {stopped && <Text style={styles.stopped}>You stopped this response</Text>}

      {complete && content.table && (
        <FadeIn rise={8} duration={300}>
          <Section title={content.table.title} scale={scale}>
            <AnswerTable spec={content.table} />
          </Section>
        </FadeIn>
      )}
      {complete && content.chart && (
        <FadeIn rise={8} duration={300}>
          <Section title={assistant.chart.title} scale={scale}>
            <RevenueChart />
          </Section>
        </FadeIn>
      )}

      {(complete || stopped) && (
        <FadeIn
          rise={0}
          duration={260}
          delay={complete && (content.table || content.chart) ? 180 : 0}
        >
          <View style={styles.actions}>
            <CopyButton text={plainText(blocks)} />
            <ActionButton
              icon="refresh"
              label="Regenerate answer"
              onPress={onRegenerate}
            />
          </View>
        </FadeIn>
      )}
    </View>
  );
}

function Section({
  title,
  scale,
  children,
}: {
  title: string;
  scale: number;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text
          style={[
            type.answerBold,
            {
              color: colors.slate800,
              fontSize: type.answerBold.fontSize * scale,
              lineHeight: type.answerBold.lineHeight * scale,
            },
          ]}
        >
          {title}
        </Text>
        <View style={styles.expand}>
          <Icon name="expand" size={20} />
        </View>
      </View>
      {children}
    </View>
  );
}

/** Copies the answer; the icon turns into a check for a moment as confirmation. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);
  return (
    <ActionButton
      icon="copySmall"
      label={copied ? "Copied" : "Copy answer"}
      done={copied}
      onPress={() => {
        if (Platform.OS === "web")
          navigator.clipboard?.writeText(text).catch(() => {});
        setCopied(true);
      }}
    />
  );
}

type ActionProps = {
  icon: "copySmall" | "refresh";
  label: string;
  done?: boolean;
  onPress: () => void;
};

function ActionButton({ icon, label, done, onPress }: ActionProps) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.action,
        hover.hovered && styles.actionHover,
        pressed && styles.actionPressed,
      ]}
    >
      {done ? (
        <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
          <Path
            d="M3.5 8.5l3 3 6-6.5"
            stroke={colors.pine700}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : (
        <Icon name={icon} size={16} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%", gap: 12 },
  caret: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.pine700,
  },
  stopped: {
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.slate500,
  },
  section: { width: "100%", gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expand: { width: 20, height: 20, ...pointer },
  actions: { flexDirection: "row", gap: 4 },
  action: {
    width: 24,
    height: 24,
    // Bare icons: no fill or border at rest, just a light tint on hover.
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
    ...transition(["background-color", "transform"]),
  },
  actionHover: { backgroundColor: colors.slate100 },
  actionPressed: { transform: [{ scale: 0.92 }] },
});
