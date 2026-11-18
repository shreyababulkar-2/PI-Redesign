import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { NoteClaim } from "./claimHighlight";

type Open = {
  /** The one citation being shown, by its number. */
  active: number;
  /**
   * The passage of the note the reader clicked the citation at. Null after moving to another citation, when the
   * viewer picks the passage the source is mainly cited for.
   */
  claim: NoteClaim | null;
};

type Ctx = {
  /** The document viewer's current content, or null while the assistant is showing. It stays set while the drawer fades out. */
  open: Open | null;
  /**
   * Whether the drawer is meant to be on screen. It turns on a frame after `open` is set (so the drawer can animate in)
   * and off as soon as it is closed, while `open` is kept for the fade-out that follows.
   */
  visible: boolean;
  /** Opens one citation, optionally with the passage it was clicked at. */
  openViewer: (n: number, claim?: NoteClaim) => void;
  /** Moves to another citation; `keep` holds on to the same passage (a sibling source of one sentence). */
  setActive: (n: number, keep?: NoteClaim) => void;
  close: () => void;
};

/** How long the drawer takes to slide in, and the pane to widen for it. */
export const ENTER_MS = 320;

const DocumentViewerContext = createContext<Ctx | null>(null);

/** Whether a citation's document is open in the pane that normally holds the assistant. */
export function DocumentViewerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(null);
  const [visible, setVisible] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    },
    [],
  );
  const openViewer = useCallback((n: number, claim?: NoteClaim) => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
    setOpen({ active: n, claim: claim ?? null });
    // A frame later, so the drawer is first drawn hidden and then animates in.
    setTimeout(() => setVisible(true), 16);
  }, []);
  const setActive = useCallback(
    (n: number, keep?: NoteClaim) =>
      setOpen({ active: n, claim: keep ?? null }),
    [],
  );
  // Closing is immediate: the assistant is simply there again, with nothing cross-fading or morphing into it.
  const close = useCallback(() => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
    setVisible(false);
    setOpen(null);
  }, []);
  const value = useMemo(
    () => ({ open, visible, openViewer, setActive, close }),
    [open, visible, openViewer, setActive, close],
  );
  return (
    <DocumentViewerContext.Provider value={value}>
      {children}
    </DocumentViewerContext.Provider>
  );
}

export function useDocumentViewer(): Ctx {
  const ctx = useContext(DocumentViewerContext);
  if (!ctx)
    throw new Error(
      "useDocumentViewer must be used inside <DocumentViewerProvider>",
    );
  return ctx;
}
