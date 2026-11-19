import { Platform } from "react-native";

/** The passages of the note that a source backs, as the viewer drawer knows them. */
export type NoteClaim = {
  sectionId: string;
  text: string;
  /** Every source cited at the end of this passage, so the viewer can offer each of them. */
  numbers?: number[];
};

const ACTIVE = "pi-claim";
const OTHERS = "pi-claim-other";

type HighlightApi = {
  highlights?: {
    set: (name: string, h: unknown) => void;
    delete: (name: string) => void;
  };
};

function api() {
  const css = (typeof CSS !== "undefined" ? CSS : undefined) as unknown as
    HighlightApi | undefined;
  const Highlight = (
    window as unknown as { Highlight?: new (...r: Range[]) => unknown }
  ).Highlight;
  return css?.highlights && Highlight
    ? { highlights: css.highlights, Highlight }
    : null;
}

/** The text of `claim` as a range inside its section of the note, or null when it can't be found. */
function rangeFor(claim: NoteClaim): Range | null {
  const root =
    document.querySelector(`[data-section-id="${claim.sectionId}"]`) ??
    document.getElementById("note-content");
  if (!root) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const at = (node.nodeValue ?? "").indexOf(claim.text);
    if (at < 0) continue;
    const range = document.createRange();
    range.setStart(node, at);
    range.setEnd(node, at + claim.text.length);
    return range;
  }
  return null;
}

/**
 * Marks, in the note, the passage the drawer is showing (strong) and the other passages the same source backs (light),
 * and scrolls the strong one into view. Uses the CSS Custom Highlight API, so the note's text is left untouched; styled
 * by `::highlight(pi-claim)` and `::highlight(pi-claim-other)` in App.tsx. Web only.
 */
export function showClaims(claims: NoteClaim[], activeIndex: number) {
  if (Platform.OS !== "web") return;
  const h = api();
  if (!h) return;
  const active = claims[activeIndex];
  const activeRange = active ? rangeFor(active) : null;
  if (activeRange) h.highlights.set(ACTIVE, new h.Highlight(activeRange));
  else h.highlights.delete(ACTIVE);
  const others = claims
    .filter((_, i) => i !== activeIndex)
    .map(rangeFor)
    .filter((r): r is Range => r !== null);
  if (others.length) h.highlights.set(OTHERS, new h.Highlight(...others));
  else h.highlights.delete(OTHERS);
  activeRange?.startContainer.parentElement?.scrollIntoView({
    block: "center",
    behavior: "smooth",
  });
}

/** Scrolls the note back to a passage (the one the drawer is showing), wherever the reader has scrolled to. */
export function revealClaim(claim: NoteClaim) {
  if (Platform.OS !== "web") return;
  rangeFor(claim)?.startContainer.parentElement?.scrollIntoView({
    block: "center",
    behavior: "smooth",
  });
}

export function clearClaims() {
  if (Platform.OS !== "web") return;
  const h = api();
  h?.highlights.delete(ACTIVE);
  h?.highlights.delete(OTHERS);
}
