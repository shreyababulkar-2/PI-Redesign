import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

/** The element id of the note's scrolling area: only text selected inside it becomes assistant context. */
export const NOTE_CONTENT_ID = "note-content";

type Ctx = {
  /** The text the user has selected in the note, shown in the assistant as context; null when there is none. */
  text: string | null;
  clear: () => void;
};

const SelectionContext = createContext<Ctx | null>(null);

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
export function SelectionContextProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const read = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const anchor = sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode?.parentElement;
      if (!anchor?.closest(`#${NOTE_CONTENT_ID}`)) return;
      const value = tidy(sel.toString());
      if (value) setText(value);
    };
    // Let the browser finalise the selection (e.g. double-click word selection) before reading it.
    const onUp = () => setTimeout(read, 0);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("keyup", onUp);
    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("keyup", onUp);
    };
  }, []);

  const clear = useCallback(() => {
    setText(null);
    if (Platform.OS === "web") window.getSelection()?.removeAllRanges();
  }, []);

  const value = useMemo(() => ({ text, clear }), [text, clear]);
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelectionContext(): Ctx {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelectionContext must be used inside <SelectionContextProvider>");
  return ctx;
}
