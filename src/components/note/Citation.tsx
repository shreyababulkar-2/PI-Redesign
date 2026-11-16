import {
  ComponentRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Platform, Text, TextStyle } from "react-native";
import { createPortal } from "react-dom";
import { colors, fonts } from "../../theme";
import { formatCitations, sourceFor } from "../../data/citations";
import { useDesignOptions } from "../../state/designOptions";

const GREEN = "#22733e";
const PINE_800 = "#205b34";
const CLOSE_DELAY_MS = 120;

/** Web-only CSS (em units and `vertical-align`) that React Native's types don't know about. */
const SUPERSCRIPT = {
  fontSize: "0.72em",
  lineHeight: 0,
  verticalAlign: "super",
} as unknown as TextStyle;

/** Closes whichever sources card is open, so opening another one never leaves two showing. */
let closeOpenCitation: (() => void) | null = null;

type Props = {
  /** The citation numbers at this spot, sorted and unique. */
  numbers: number[];
  style?: TextStyle;
};

/**
 * Inline citation, e.g. `[1-3,8]` (Figma 501:7918): the numbers sit as a green superscript after the text,
 * with several in a row merged into one. Hovering lights it and opens a sources card under it that stays
 * open while the pointer moves into it; clicking pins the card open. It closes on a click anywhere else, on Escape,
 * on scroll, or when another citation opens. Web only; on native it is just the green text.
 */
export function Citation({ numbers, style }: Props) {
  const { citations } = useDesignOptions();
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
            // Superscript: smaller than the sentence and raised, without making the line taller. Relative units
            // so it follows the reader's text size.
            ...SUPERSCRIPT,
            borderRadius: 2,
            cursor: "pointer",
            backgroundColor: open ? "#e0f8e7" : "transparent",
          } as TextStyle,
        ]}
      >
        <CitationMark
          numbers={numbers}
          withDataRoom={citations === "dataroom"}
        />
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
  // Open below the citation, or above it when the card wouldn't fit under it in the window (measured before paint).
  const [place, setPlace] = useState<{
    above: boolean;
    maxHeight?: number;
    height: number;
  }>({ above: false, height: 0 });
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const gap = 6;
    const margin = 8;
    const full = el.scrollHeight + 2; // content plus the 1px borders
    const below = window.innerHeight - anchor.bottom - gap - margin;
    const above = anchor.top - gap - margin;
    if (full <= below) setPlace({ above: false, height: full });
    else if (full <= above) setPlace({ above: true, height: full });
    else {
      // Neither side has room for the whole card: use the roomier one and let the card scroll.
      const room = Math.max(below, above);
      setPlace({ above: above > below, maxHeight: room, height: room });
    }
  }, [anchor, numbers, cardRef]);
  const top = place.above ? anchor.top - 6 - place.height : anchor.bottom + 6;
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
        top,
        maxHeight: place.maxHeight,
        overflowY: place.maxHeight ? "auto" : undefined,
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
        transform: `translateY(${shown ? 0 : place.above ? 4 : -4}px)`,
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
        gap: 0,
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

/**
 * What is shown in the text for a citation. Simple: all the numbers. With data room: only the web sources keep their
 * numbers, and a folder icon stands for the data room sources (Figma 542:18175), after a comma when both are present.
 */
function CitationMark({
  numbers,
  withDataRoom,
}: {
  numbers: number[];
  withDataRoom: boolean;
}) {
  if (!withDataRoom) return <>{formatCitations(numbers)}</>;
  const web = numbers.filter((n) => sourceFor(n).kind === "web");
  const hasDataRoom = web.length < numbers.length;
  return (
    <>
      {web.length > 0 && formatCitations(web)}
      {web.length > 0 && hasDataRoom && ","}
      {hasDataRoom && <MarkFolder />}
    </>
  );
}

/** The small data room folder set in the line like a superscript glyph (it follows the text colour and size). */
function MarkFolder() {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 8 8"
      fill="none"
      role="img"
      aria-label="Data room"
      style={{
        width: "0.95em",
        height: "0.95em",
        marginLeft: "0.1em",
        verticalAlign: "baseline",
      }}
    >
      <path
        d="M1.04547 4.22727V4C1.04547 3.81917 1.11731 3.64575 1.24517 3.51788C1.37304 3.39002 1.54646 3.31818 1.72729 3.31818H6.27274C6.45357 3.31818 6.627 3.39002 6.75486 3.51788C6.88273 3.64575 6.95456 3.81917 6.95456 4V4.22727M4.32123 2.27576L3.6788 1.63333C3.6366 1.59108 3.58648 1.55755 3.53132 1.53467C3.47615 1.51179 3.41701 1.50001 3.35729 1.5H1.72729C1.54646 1.5 1.37304 1.57183 1.24517 1.6997C1.11731 1.82757 1.04547 2.00099 1.04547 2.18182V5.81818C1.04547 5.99901 1.11731 6.17243 1.24517 6.3003C1.37304 6.42817 1.54646 6.5 1.72729 6.5H6.27274C6.45357 6.5 6.627 6.42817 6.75486 6.3003C6.88273 6.17243 6.95456 5.99901 6.95456 5.81818V3.09091C6.95456 2.91008 6.88273 2.73666 6.75486 2.60879C6.627 2.48093 6.45357 2.40909 6.27274 2.40909H4.64274C4.52223 2.40898 4.40639 2.36103 4.32123 2.27576Z"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The "opens a web page" arrow beside a host name (Figma 501:7948, 12px). */
function ExternalIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M5.3125 2.56256L3.71875 2.5625C3.44525 2.5625 3.05794 2.67115 2.86455 2.86455C2.67115 3.05794 2.5625 3.32025 2.5625 3.59375V8.40625C2.5625 8.67975 2.67115 8.94206 2.86455 9.13545C3.05794 9.32885 3.32025 9.4375 3.59375 9.4375H8.40625C8.67975 9.4375 8.94206 9.32885 9.13545 9.13545C9.32885 8.94206 9.4375 8.67975 9.4375 8.40625V6.69141M6.1875 5.8125L9.4375 2.5625M9.4375 4.96875V2.5625H7.03125"
        stroke={color}
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The Data Room folder beside "Data Room" (Figma 501:7948, 12px). */
function FolderIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill={color} aria-hidden>
      <path d="M9.33331 10C9.68693 10 10.0261 9.85952 10.2761 9.60948C10.5262 9.35943 10.6666 9.02029 10.6666 8.66667V6.66667C10.6666 6.31304 10.5262 5.97391 10.2761 5.72386C10.0261 5.47381 9.68693 5.33333 9.33331 5.33333H2.66665C2.31302 5.33333 1.97389 5.47381 1.72384 5.72386C1.47379 5.97391 1.33331 6.31304 1.33331 6.66667V8.66667C1.33331 9.02029 1.47379 9.35943 1.72384 9.60948C1.97389 9.85952 2.31302 10 2.66665 10H9.33331ZM1.33331 5.176V3.33333C1.33331 2.97971 1.47379 2.64057 1.72384 2.39052C1.97389 2.14048 2.31302 2 2.66665 2H5.05731C5.32238 2.00012 5.57655 2.10546 5.76398 2.29289L6.70709 3.23556C6.76931 3.29822 6.8542 3.33333 6.94265 3.33333H9.33331C9.68693 3.33333 10.0261 3.47381 10.2761 3.72386C10.5262 3.97391 10.6666 4.31304 10.6666 4.66667V5.176C10.3003 4.84739 9.8254 4.66597 9.33331 4.66667H2.66665C2.17455 4.66597 1.69961 4.84739 1.33331 5.176Z" />
    </svg>
  );
}
