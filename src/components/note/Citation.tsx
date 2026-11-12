import { ComponentRef, useEffect, useRef, useState } from "react";
import { Platform, Text, TextStyle } from "react-native";
import { createPortal } from "react-dom";
import { colors, fonts } from "../../theme";
import { formatCitations, sourceFor } from "../../data/citations";

const GREEN = "#22733e";
const PINE_800 = "#205b34";
const CLOSE_DELAY_MS = 120;

/** Closes whichever sources card is open, so opening another one never leaves two showing. */
let closeOpenCitation: (() => void) | null = null;

type Props = {
  /** The citation numbers at this spot, sorted and unique. */
  numbers: number[];
  style?: TextStyle;
};

/**
 * Inline citation, e.g. `[1-3,8]` (Figma 501:7918): the numbers sit in the text at its size and colour them green,
 * with several in a row merged into one. Hovering lights it and opens a sources card under it that stays
 * open while the pointer moves into it; clicking pins the card open. It closes on a click anywhere else, on Escape,
 * on scroll, or when another citation opens. Web only; on native it is just the green text.
 */
export function Citation({ numbers, style }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [overCard, setOverCard] = useState(false);
  const [overText, setOverText] = useState(false);
  const [pinned, setPinned] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef<ComponentRef<typeof Text>>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const open = (pinned || overText || overCard) && rect !== null;

  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    const close = () => {
      if (timer.current) clearTimeout(timer.current);
      setPinned(false);
      setOverText(false);
      setOverCard(false);
    };
    closeOpenCitation?.();
    closeOpenCitation = close;
    // A press anywhere that isn't this citation or its card closes it (and still reaches what was pressed).
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target;
      const text = textRef.current as unknown as HTMLElement | null;
      if (
        t instanceof Node &&
        (text?.contains(t) || cardRef.current?.contains(t))
      )
        return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // The card is anchored to text that moves when the page scrolls, so scrolling closes it too.
    const moves = ["scroll", "wheel", "touchmove"];
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    moves.forEach((ev) =>
      document.addEventListener(ev, close, { capture: true, passive: true }),
    );
    return () => {
      if (closeOpenCitation === close) closeOpenCitation = null;
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
      moves.forEach((ev) => document.removeEventListener(ev, close, true));
    };
  }, [open]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const enterText = (e: { currentTarget: unknown }) => {
    if (timer.current) clearTimeout(timer.current);
    setRect((e.currentTarget as HTMLElement).getBoundingClientRect());
    setOverText(true);
  };
  const leave = (set: (v: boolean) => void) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => set(false), CLOSE_DELAY_MS);
  };
  const enterCard = () => {
    if (timer.current) clearTimeout(timer.current);
    setOverCard(true);
  };

  return (
    <>
      <Text
        ref={textRef}
        onPress={(e) => {
          setRect(
            (e.currentTarget as unknown as HTMLElement).getBoundingClientRect(),
          );
          // Click pins the card open; clicking the citation again unpins and closes it.
          if (pinned) {
            setPinned(false);
            setOverText(false);
            setOverCard(false);
          } else {
            setPinned(true);
          }
        }}
        {...({
          onPointerEnter: enterText,
          onPointerLeave: () => leave(setOverText),
        } as object)}
        style={[
          style,
          {
            color: GREEN,
            borderRadius: 2,
            cursor: "pointer",
            backgroundColor: open ? "#e0f8e7" : "transparent",
          } as TextStyle,
        ]}
      >
        {formatCitations(numbers)}
      </Text>
      {Platform.OS === "web" &&
        open &&
        rect &&
        createPortal(
          <SourcesCard
            numbers={numbers}
            anchor={rect}
            onEnter={enterCard}
            onLeave={() => leave(setOverCard)}
            cardRef={cardRef}
          />,
          document.body,
        )}
    </>
  );
}

/** The hover card: one row per citation (numbered when there are several), each with its host or "Data Room" in green. */
function SourcesCard({
  numbers,
  anchor,
  onEnter,
  onLeave,
  cardRef,
}: {
  numbers: number[];
  anchor: DOMRect;
  onEnter: () => void;
  onLeave: () => void;
  cardRef: { current: HTMLDivElement | null };
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const width = 240;
  const left = Math.max(
    8,
    Math.min(anchor.left, window.innerWidth - width - 8),
  );
  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-label="Sources"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      style={{
        position: "fixed",
        left,
        top: anchor.bottom + 6,
        width,
        boxSizing: "border-box",
        // 4px all round: the row highlights below sit 4px in from the card edge, and carry their own text inset.
        padding: 4,
        background: colors.white,
        border: "1px solid #f2f5f8",
        borderRadius: 8,
        boxShadow:
          "0 8px 24px rgba(24,27,37,0.1), 0 1px 3px rgba(24,27,37,0.05)",
        zIndex: 100000,
        opacity: shown ? 1 : 0,
        transform: `translateY(${shown ? 0 : -4}px)`,
        transition:
          "opacity 140ms cubic-bezier(0.2,0,0,1), transform 140ms cubic-bezier(0.2,0,0,1)",
        fontFamily: fonts.geistRegular,
      }}
    >
      {numbers.map((n, i) => (
        <SourceRow
          key={n}
          n={n}
          first={i === 0}
          showNumber={numbers.length > 1}
        />
      ))}
    </div>
  );
}

function SourceRow({
  n,
  first,
  showNumber,
}: {
  n: number;
  first: boolean;
  /** Rows are numbered only when the card lists more than one source. */
  showNumber: boolean;
}) {
  const [hover, setHover] = useState(false);
  const s = sourceFor(n);
  return (
    <div
      style={{
        // The hairline between rows is inset to line up with the text; Figma draws it at 50% opacity (501:7948).
        borderTop: first ? "none" : "1px solid rgba(225,228,234,0.5)",
        margin: first ? 0 : "2px 10px 0",
        paddingTop: first ? 0 : 2,
      }}
    >
      <div
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        style={{
          padding: "8px 10px",
          margin: first ? 0 : "0 -10px",
          borderRadius: 6,
          background: hover ? "#f2f5f8" : "transparent",
          cursor: "pointer",
          transition: "background-color 150ms cubic-bezier(0.2,0,0,1)",
        }}
      >
        <div
          style={{
            fontFamily: fonts.geistMedium,
            fontSize: 11,
            lineHeight: "18px",
            color: "#181b25",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {showNumber ? `${n}. ` : ""}
          {s.title}
        </div>
        <HostLink host={s.host} kind={s.kind} />
      </div>
    </div>
  );
}

/** The host / "Data Room" link: darkens to pine 800 and underlines on hover (the icon follows the colour). */
function HostLink({ host, kind }: { host: string; kind: "web" | "dataroom" }) {
  const [hover, setHover] = useState(false);
  const color = hover ? PINE_800 : GREEN;
  return (
    <div
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        lineHeight: "14px",
        color,
        cursor: "pointer",
        transition: "color 150ms cubic-bezier(0.2,0,0,1)",
      }}
    >
      <span
        style={{
          textDecoration: hover ? "underline" : "none",
          textUnderlineOffset: 2,
        }}
      >
        {host}
      </span>
      {kind === "web" ? (
        <ExternalIcon color={color} />
      ) : (
        <FolderIcon color={color} />
      )}
    </div>
  );
}

function ExternalIcon({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M4 2H2.5A.5.5 0 0 0 2 2.5v5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5V6M6 2h2v2M8 2 4.5 5.5"
        stroke={color}
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderIcon({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill={color} aria-hidden>
      <path d="M1.5 2.5A.5.5 0 0 1 2 2h2l1 1h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-5Z" />
    </svg>
  );
}
