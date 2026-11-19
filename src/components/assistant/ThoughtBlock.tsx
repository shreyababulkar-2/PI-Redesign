import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, fonts } from "../../theme";
import { Thinking } from "../../data/assistantAnswers";
import { Phase } from "../../hooks/useConversation";
import { Icon } from "../Icon";
import { FadeIn } from "./FadeIn";
import { Pulse } from "./Pulse";
import { ShimmerText } from "./ShimmerText";
import { pointer } from "../../theme/cursor";
import { transition } from "../../theme/motion";
import { ThinkingDots } from "./TypingDots";

type Props = {
  /** The steps, file count and source count for this answer. */
  thinking: Thinking;
  phase: Phase;
  /** How many steps have finished; the next one (if any) is the one in progress. */
  steps: number;
  expanded: boolean;
  onToggle: () => void;
  /** When the question was sent, for the live counter. */
  startedAt: number;
  /** Whole seconds it spent thinking, once it has finished. */
  thoughtSecs: number;
  /** How long each finished step took. */
  stepTimes: string[];
  /** White steps panel instead of the pale grey one (the full assistant view). */
  white?: boolean;
};

type StepState = "done" | "active" | "pending";

/**
/**
 * The reasoning summary (Figma "Answer generating"): a quiet grey line that reads "Thinking for N secs ·
 * 3 files · 6 sources" with the seconds counting up while the assistant works, and "Thought for N secs"
 * once it has finished. It is collapsed by default; opening it shows the steps, each with where it is:
 * pending steps are dim with an empty dot, the one in progress has a spinner and pulsing label, and
 * finished ones get a check and their duration.
 */
export function ThoughtBlock({
  thinking,
  phase,
  steps,
  expanded,
  onToggle,
  startedAt,
  thoughtSecs,
  stepTimes,
  white = false,
}: Props) {
  const list = thinking.steps;
  const working = phase === "waiting" || phase === "thinking";
  // The line shimmers for as long as the assistant is still producing the answer.
  const generating = working || phase === "streaming";
  // The file and source counts creep up as the work progresses, then settle on the final numbers.
  const progress = working ? steps / list.length : 1;
  const grow = (final: number, start: number) =>
    Math.max(
      1,
      Math.min(final, Math.round(final * (start + (1 - start) * progress))),
    );
  const fileCount = grow(thinking.files, 0.34);
  const sourceCount = grow(thinking.sources, 0.17);
  const files = `${fileCount} ${fileCount === 1 ? "file" : "files"}`;
  const sources = `${sourceCount} ${sourceCount === 1 ? "source" : "sources"}`;
  const active = phase === "thinking" ? Math.min(steps, list.length - 1) : -1;
  const color = expanded ? colors.pine700 : colors.slate500;
  const text = [styles.summary, { color }];

  // Live counter while working.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!working) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [working]);
  const secs = working
    ? Math.max(1, Math.floor((now - startedAt) / 1000))
    : thoughtSecs;
  // The full assistant view keeps it plain while thinking; the time, files and sources appear once the answer starts.
  const plain = white && working;
  const label = plain
    ? "Assistant is thinking"
    : `${working ? "Thinking" : "Thought"} for ${secs} ${secs === 1 ? "sec" : "secs"}`;

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.line}
      >
        {generating ? (
          <ShimmerText
            style={styles.summary}
            // Plain "Assistant is thinking" is green (Figma 62:24796) and still shimmers like the other thinking lines.
            base={plain || expanded ? colors.pine700 : colors.slate500}
            shine={plain || expanded ? colors.pine950 : colors.slate900}
          >
            {plain ? label : `${label} · ${files} · ${sources}`}
          </ShimmerText>
        ) : (
          <>
            <Text style={text}>{label}</Text>
            <View style={styles.dot} />
            <Text style={text}>{files}</Text>
            <View style={styles.dot} />
            <Text style={text}>{sources}</Text>
          </>
        )}
        {/* One slot, two icons: the pulsing dots while it only says "Assistant is thinking", which fade into the
            downward arrow when the thinking is over and the answer begins. */}
        <View style={styles.slot}>
          <View
            pointerEvents="none"
            style={[styles.slotIcon, { opacity: plain ? 1 : 0 }, transition(["opacity"], 200) as object]}
          >
            <ThinkingDots />
          </View>
          <View style={[{ opacity: plain ? 0 : 1 }, transition(["opacity"], 200) as object]}>
            <Icon
              name="thoughtChevron"
              size={16}
              style={expanded ? styles.flipped : undefined}
            />
          </View>
        </View>
      </Pressable>

      {expanded && (
        <FadeIn rise={4} duration={200}>
          <View style={[styles.panel, white && styles.panelWhite]}>
            {list.map((step, i) => {
              const state: StepState = working
                ? i < steps
                  ? "done"
                  : i === active
                    ? "active"
                    : "pending"
                : "done";
              return (
                <View key={step.label} style={styles.row}>
                  <View style={styles.label}>
                    {working && <StatusMark state={state} />}
                    {state === "active" ? (
                      <Pulse>
                        <Text style={[styles.stepText, styles.stepActive]}>
                          {step.label}
                        </Text>
                      </Pulse>
                    ) : (
                      <Text
                        style={[
                          styles.stepText,
                          state === "pending" && styles.stepPending,
                        ]}
                      >
                        {step.label}
                      </Text>
                    )}
                    {step.expandable && (
                      <Icon name="thoughtChevron" size={12} />
                    )}
                  </View>
                  {state === "done" && (
                    <FadeIn rise={0} duration={240}>
                      <Text style={styles.time}>
                        ({stepTimes[i] ?? "1.0s"})
                      </Text>
                    </FadeIn>
                  )}
                </View>
              );
            })}
          </View>
        </FadeIn>
      )}
    </View>
  );
}

/** The leading marker of a step: a check when finished, a spinner when in progress, an empty dot when waiting. */
function StatusMark({ state }: { state: StepState }) {
  return (
    <View style={styles.mark}>
      {state === "done" && (
        <FadeIn rise={0} duration={200}>
          <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <Path
              d="M2.5 6.4l2.3 2.3 4.7-5"
              stroke={colors.pine700}
              strokeWidth={1.3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </FadeIn>
      )}
      {state === "active" && <Spinner />}
      {state === "pending" && <View style={styles.pendingDot} />}
    </View>
  );
}

function Spinner() {
  const [turn] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [turn]);
  return (
    <Animated.View
      style={[
        styles.spinner,
        {
          transform: [
            {
              rotate: turn.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { width: "100%", gap: 8 },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 16,
    alignSelf: "flex-start",
    ...pointer,
  },
  summary: { fontFamily: fonts.geistRegular, fontSize: 10, lineHeight: 12 },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.slate300,
  },
  slot: { width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  slotIcon: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  flipped: { transform: [{ rotate: "180deg" }] },
  panel: {
    gap: 10,
    padding: 11,
    borderRadius: 6,
    backgroundColor: colors.slate50,
    borderWidth: 0.5,
    borderColor: colors.slate200,
  },
  panelWhite: { backgroundColor: colors.white },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minHeight: 12,
  },
  label: { flexDirection: "row", alignItems: "center", flexShrink: 1, gap: 8 },
  stepText: {
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 12,
    color: colors.slate600,
  },
  stepActive: { color: colors.slate800 },
  stepPending: { color: colors.slate400 },
  time: {
    fontFamily: fonts.geistRegular,
    fontSize: 9,
    lineHeight: 12,
    color: colors.slate400,
  },
  mark: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.slate300,
  },
  spinner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderTopColor: colors.pine700,
  },
});
