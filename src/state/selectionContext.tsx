import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

/** The element id of the note's scrolling area (kept for scrolling and navigation code). */
export const NOTE_CONTENT_ID = "note-content";

/**
 * Only the note's own content can become assistant context: section titles and section text. Those elements carry
 * this attribute (`dataSet={{ contextSource: "true" }}`); the company name, tabs, buttons and menus around them do
 * not, so selecting them is never offered to the assistant.
 */
export const CONTEXT_SOURCE_SELECTOR = "[data-context-source]";

/** Spread onto a View or Text to mark it as note content (web `data-context-source`). */
export const CONTEXT_SOURCE = { dataSet: { contextSource: "true" } } as object;

/** The element a selection endpoint sits in, if that is inside note content. */
function sourceOf(node: Node | null): Element | null {
  const el = node instanceof Element ? node : node?.parentElement;
  return el?.closest(CONTEXT_SOURCE_SELECTOR) ?? null;
}

/** True when the selection both starts and ends inside note content (so dragging in from the header doesn't count). */
function inNoteContent(sel: Selection): boolean {
  return !!sourceOf(sel.anchorNode) && !!sourceOf(sel.focusNode);
}

type Ctx = {
  /** The text the user has selected in the note, shown in the assistant as context; null when there is none. */
  text: string | null;
  clear: () => void;
};

const SelectionContext = createContext<Ctx | null>(null);

const HIGHLIGHT_NAME = "pi-context";

type HighlightApi = {
  highlights?: {
    set: (name: string, h: unknown) => void;
    delete: (name: string) => void;
  };
};

/**
 * Keeps the context text highlighted in the note after the browser's own selection is gone (CSS Custom Highlight
 * API; styled by `::highlight(pi-context)` in App.tsx). Browsers without it simply show no persistent highlight.
 */
function setContextHighlight(range: Range | null) {
  const cssApi = (typeof CSS !== "undefined" ? CSS : undefined) as unknown as
    HighlightApi | undefined;
  const Highlight = (
    window as unknown as { Highlight?: new (...r: Range[]) => unknown }
  ).Highlight;
  if (!cssApi?.highlights || !Highlight) return;
  if (range) cssApi.highlights.set(HIGHLIGHT_NAME, new Highlight(range));
  else cssApi.highlights.delete(HIGHLIGHT_NAME);
}

/** Selected text as one line, so a selection across paragraphs reads as a single excerpt. */
function tidy(raw: string) {
  return raw.replace(/\s+/g, " ").trim();
}

/**
 * Web: selecting text in the note makes it the assistant's context, and selecting something else replaces it.
 * It is read when the pointer or keyboard finishes a selection (not on every change while dragging), and
 * a selection made elsewhere, such as inside the assistant, is ignored so the context survives clicking into
 * the composer. It stays until the user removes it.
 */
export function SelectionContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const read = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      if (!inNoteContent(sel)) return;
      const value = tidy(sel.toString());
      if (value) {
        setText(value);
        setContextHighlight(sel.getRangeAt(0).cloneRange());
      }
    };
    // Let the browser finalise the selection (e.g. double-click word selection) before reading it.
    const onUp = () => setTimeout(read, 0);
    // As soon as a new selection forms in the note (while still dragging), the previous highlight is dropped, so it
    // never lingers beside the new one. A plain click collapses the selection instead and leaves it alone.
    const onChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      if (inNoteContent(sel)) setContextHighlight(null);
    };
    document.addEventListener("selectionchange", onChange);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("keyup", onUp);
    return () => {
      document.removeEventListener("selectionchange", onChange);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("keyup", onUp);
    };
  }, []);

  const clear = useCallback(() => {
    setText(null);
    if (Platform.OS === "web") {
      window.getSelection()?.removeAllRanges();
      setContextHighlight(null);
    }
  }, []);

  const value = useMemo(() => ({ text, clear }), [text, clear]);
  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelectionContext(): Ctx {
  const ctx = useContext(SelectionContext);
  if (!ctx)
    throw new Error(
      "useSelectionContext must be used inside <SelectionContextProvider>",
    );
  return ctx;
}
