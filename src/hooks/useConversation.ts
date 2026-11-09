import { useCallback, useEffect, useRef, useState } from "react";
import { AnswerId, answerIdFor, thinking } from "../data/assistantAnswers";

/**
 * waiting   – the question is sent, a short pause before anything appears
 * thinking  – the thought steps are revealed one by one
 * streaming – the answer is written out word by word
 * done      – finished
 * stopped   – the user pressed stop part-way
 */
export type Phase = "waiting" | "thinking" | "streaming" | "done" | "stopped";

export type Turn = {
  id: number;
  question: string;
  answerId: AnswerId;
  phase: Phase;
  /** How many thought steps are visible so far. */
  steps: number;
  /** Whether the "Thought for…" steps panel is open. */
  expanded: boolean;
  /** Words of the answer that had been written when the user pressed stop. */
  stoppedWords: number;
  /** Bumped by "regenerate" so the answer streams again from the start. */
  run: number;
  /** When the question was sent, for the live "Thinking for N secs" counter. */
  startedAt: number;
  /** How long it thought, in whole seconds (set once the answer starts). */
  thoughtSecs: number;
  /** How long each finished step took, e.g. "1.2s". */
  stepTimes: string[];
};

/** Pauses, in ms. Slightly randomised so the rhythm doesn't feel mechanical. */
const WAIT_MS: [number, number] = [800, 1300];
const STEP_MS: [number, number] = [650, 1100];
const HOLD_MS: [number, number] = [400, 700];
const between = ([min, max]: [number, number]) =>
  min + Math.random() * (max - min);

const isGenerating = (t: Turn) =>
  t.phase === "waiting" || t.phase === "thinking" || t.phase === "streaming";

/**
 * Conversation state for the assistant. Each question becomes a turn that goes through the phases
 * above, the way chat assistants do: a beat of waiting, visible thinking steps, then a streamed answer.
 */
export function useConversation() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextId = useRef(1);
  /** Words of the answer written so far; updated by the streaming view (a ref: it changes ~30x a second). */
  const streamedWords = useRef(0);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const patch = useCallback((id: number, change: Partial<Turn>) => {
    setTurns((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...change } : t)),
    );
  }, []);

  const generating = turns.some(isGenerating);

  const send = useCallback(
    (question: string) => {
      if (turns.some(isGenerating)) return; // one answer at a time
      const id = nextId.current++;
      const answerId = answerIdFor(question);
      const total = thinking[answerId].steps.length;
      streamedWords.current = 0;
      const startedAt = Date.now();
      setTurns((prev) => [
        ...prev,
        {
          id,
          question,
          answerId,
          phase: "waiting",
          steps: 0,
          expanded: false,
          stoppedWords: 0,
          run: 0,
          startedAt,
          thoughtSecs: 0,
          stepTimes: [],
        },
      ]);

      // Schedule the whole timeline up front; stop() clears it.
      let at = between(WAIT_MS);
      later(() => patch(id, { phase: "thinking" }), at);
      const stepTimes: string[] = [];
      for (let i = 1; i <= total; i++) {
        const gap = between(STEP_MS);
        at += gap;
        stepTimes.push(`${(gap / 1000).toFixed(1)}s`);
        later(
          () => patch(id, { steps: i, stepTimes: stepTimes.slice(0, i) }),
          at,
        );
      }
      at += between(HOLD_MS);
      later(
        () =>
          patch(id, {
            phase: "streaming",
            expanded: false,
            thoughtSecs: Math.max(
              1,
              Math.round((Date.now() - startedAt) / 1000),
            ),
          }),
        at,
      );
    },
    [turns, later, patch],
  );

  /** Called by the answer view when it has written the last word. */
  const finishStreaming = useCallback(
    (id: number) => patch(id, { phase: "done" }),
    [patch],
  );

  const stop = useCallback(() => {
    clearTimers();
    setTurns((prev) =>
      prev.map((t) =>
        isGenerating(t)
          ? {
              ...t,
              phase: "stopped",
              expanded: false,
              stoppedWords: t.phase === "streaming" ? streamedWords.current : 0,
            }
          : t,
      ),
    );
  }, [clearTimers]);

  const regenerate = useCallback(
    (id: number) => {
      if (turns.some(isGenerating)) return;
      streamedWords.current = 0;
      patch(id, {
        phase: "streaming",
        stoppedWords: 0,
        run: (turns.find((t) => t.id === id)?.run ?? 0) + 1,
      });
    },
    [turns, patch],
  );

  const toggleThought = useCallback((id: number) => {
    setTurns((prev) =>
      prev.map((t) => (t.id === id ? { ...t, expanded: !t.expanded } : t)),
    );
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setTurns([]);
  }, [clearTimers]);

  return {
    turns,
    generating,
    send,
    stop,
    regenerate,
    finishStreaming,
    toggleThought,
    reset,
    streamedWords,
  };
}
