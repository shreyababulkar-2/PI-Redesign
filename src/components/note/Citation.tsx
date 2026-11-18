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
import { useDocumentViewer } from "../../state/documentViewer";
import type { NoteClaim } from "../../state/claimHighlight";
import { useAssistantOverlay } from "../../state/assistantOverlay";

const GREEN = "#22733e";
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
  const viewer = useDocumentViewer();
  const overlay = useAssistantOverlay();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [overCard, setOverCard] = useState(false);
  const [overText, setOverText] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef<ComponentRef<typeof Text>>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const open = (overText || overCard) && rect !== null;

  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    const close = () => {
      if (timer.current) clearTimeout(timer.current);
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
  /** A row in the card was chosen: close the card and open that source in the drawer, at this passage of the note. */
  const openSource = (n: number) => {
    const claim = claimAt(textRef.current, numbers);
    if (timer.current) clearTimeout(timer.current);
    setOverText(false);
    setOverCard(false);
    if (overlay.collapsed) overlay.setOpen(true);
    viewer.openViewer(n, claim);
  };
  const enterCard = () => {
    if (timer.current) clearTimeout(timer.current);
    setOverCard(true);
  };

  return (
    <>
      <Text
        ref={textRef}
        // Click opens the first cited source in the drawer (the others are one tap away in its header and chips).
        onPress={() => openSource(numbers[0])}
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
        <CitationMark numbers={numbers} />
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
            onOpen={openSource}
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
  onOpen,
  cardRef,
}: {
  numbers: number[];
  anchor: DOMRect;
  onEnter: () => void;
  onLeave: () => void;
  onOpen: (n: number) => void;
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
          onOpen={() => onOpen(n)}
        />
      ))}
    </div>
  );
}

function SourceRow({
  n,
  first,
  showNumber,
  onOpen,
}: {
  n: number;
  first: boolean;
  /** Rows are numbered only when the card lists more than one source. */
  showNumber: boolean;
  onOpen: () => void;
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
        role="button"
        tabIndex={0}
        aria-label={`Open source ${n}: ${s.title}`}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          margin: first ? 0 : "0 -10px",
          borderRadius: 6,
          background: hover ? "#f2f5f8" : "transparent",
          cursor: "pointer",
          transition: "background-color 150ms cubic-bezier(0.2,0,0,1)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
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
          <SourceMeta host={s.host} kind={s.kind} />
        </div>
        {/* Opens the source in the drawer (Figma 600:1662): the chevron nudges right on hover. */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          style={{
            flexShrink: 0,
            transform: `translateX(${hover ? 2 : 0}px)`,
            transition: "transform 150ms cubic-bezier(0.2,0,0,1)",
          }}
        >
          <path
            d="M4.125 2.25L7.875 6L4.125 9.75"
            stroke="#181b25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

/** Where a source is from: a globe and its host, or the data room folder (Figma 600:2209). */
function SourceMeta({
  host,
  kind,
}: {
  host: string;
  kind: "web" | "dataroom";
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        lineHeight: "14px",
        color: GREEN,
      }}
    >
      {kind === "web" ? <GlobeIcon /> : <FolderMini />}
      <span>{host}</span>
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M9.98771 6.30934C10.0433 5.60097 9.90951 4.89055 9.60006 4.25134C9.08785 4.73936 8.48238 5.1183 7.82015 5.36528C7.8734 6.0207 7.8439 6.68025 7.73237 7.32826C8.53822 7.12474 9.30178 6.77978 9.98771 6.30934ZM7.08054 7.4603C7.21156 6.83217 7.25737 6.18917 7.21673 5.54874C6.82621 5.64212 6.41887 5.69148 6.00004 5.69148C5.58122 5.69148 5.17388 5.64212 4.78335 5.54874C4.74366 6.18917 4.78947 6.83204 4.91954 7.4603C5.63569 7.57038 6.36439 7.57038 7.08054 7.4603ZM5.08609 8.10572C5.69327 8.17775 6.30681 8.17775 6.91399 8.10572C6.70531 8.77934 6.39725 9.41784 6.00004 10C5.60283 9.41785 5.29476 8.77934 5.08609 8.10572ZM4.26772 7.32867C4.15558 6.68045 4.12608 6.02056 4.17993 5.36487C3.51756 5.11794 2.91193 4.73901 2.39961 4.25093C2.09024 4.89031 1.95656 5.60087 2.01237 6.30934C2.6983 6.77978 3.46187 7.12515 4.26772 7.32867ZM9.83799 7.13204C9.63087 7.83584 9.23546 8.46931 8.69467 8.96366C8.15388 9.45802 7.48839 9.79438 6.77042 9.93624C7.12998 9.33001 7.4044 8.67693 7.58592 7.99547C8.37742 7.82912 9.13757 7.53782 9.83799 7.13246V7.13204ZM2.1621 7.13204C2.85208 7.53147 3.61015 7.82641 4.41416 7.99547C4.59569 8.67693 4.87011 9.33001 5.22966 9.93624C4.51175 9.79442 3.84628 9.45812 3.3055 8.96384C2.76472 8.46955 2.36928 7.83618 2.1621 7.13246V7.13204ZM6.77042 2.06335C7.78681 2.26368 8.68614 2.85143 9.27928 3.703C8.84144 4.1466 8.31878 4.49695 7.74262 4.73303C7.58739 3.79013 7.25765 2.88467 6.77042 2.06335ZM6.00004 2C6.59871 2.87705 6.99205 3.87839 7.15069 4.92925C6.78273 5.02386 6.39713 5.07445 6.00004 5.07445C5.60296 5.07445 5.21736 5.02427 4.8494 4.92925C5.00802 3.87838 5.40136 2.87704 6.00004 2ZM5.22966 2.06335C4.74243 2.88467 4.41269 3.79013 4.25746 4.73303C3.6813 4.49696 3.15863 4.14661 2.72081 3.703C3.31399 2.85156 4.21332 2.26354 5.22966 2.06335Z"
        fill={GREEN}
      />
    </svg>
  );
}

function FolderMini() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M9.33337 10C9.687 10 10.0261 9.85952 10.2762 9.60948C10.5262 9.35943 10.6667 9.02029 10.6667 8.66667V6.66667C10.6667 6.31304 10.5262 5.97391 10.2762 5.72386C10.0261 5.47381 9.687 5.33333 9.33337 5.33333H2.66671C2.31309 5.33333 1.97395 5.47381 1.7239 5.72386C1.47385 5.97391 1.33337 6.31304 1.33337 6.66667V8.66667C1.33337 9.02029 1.47385 9.35943 1.7239 9.60948C1.97395 9.85952 2.31309 10 2.66671 10H9.33337ZM1.33337 5.176V3.33333C1.33337 2.97971 1.47385 2.64057 1.7239 2.39052C1.97395 2.14048 2.31309 2 2.66671 2H5.05737C5.32244 2.00012 5.57661 2.10546 5.76404 2.29289L6.70715 3.23556C6.76937 3.29822 6.85426 3.33333 6.94271 3.33333H9.33337C9.687 3.33333 10.0261 3.47381 10.2762 3.72386C10.5262 3.97391 10.6667 4.31304 10.6667 4.66667V5.176C10.3004 4.84739 9.82547 4.66597 9.33337 4.66667H2.66671C2.17462 4.66597 1.69967 4.84739 1.33337 5.176Z"
        fill={GREEN}
      />
    </svg>
  );
}

/**
 * The passage of the note a citation was clicked at: the sentence just before it, read from the text next to the
 * marker, with the section it sits in. Undefined when it can't be read (the viewer then uses the source's main passage).
 */
function claimAt(el: unknown, numbers: number[]): NoteClaim | undefined {
  const node = el as HTMLElement | null;
  const before = node?.previousSibling?.nodeValue ?? "";
  const text = before
    .split(/(?<=[.!?])\s+/)
    .pop()
    ?.replace(/^[\s.,;:]+/, "")
    .trim();
  const sectionId = node
    ?.closest("[data-section-id]")
    ?.getAttribute("data-section-id");
  return text && sectionId ? { sectionId, text, numbers } : undefined;
}

/**
 * What is shown in the text for a citation (Figma 600:1662): web sources keep their numbers, and a folder icon stands
 * for the data room sources, after a comma when both are present.
 */
function CitationMark({ numbers }: { numbers: number[] }) {
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
