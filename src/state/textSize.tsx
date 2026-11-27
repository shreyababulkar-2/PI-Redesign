import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

/**
 * Text size of the research note (Figma 1135:4206): A- is smaller, A the base as designed and A+ larger. `factor` is what
 * every piece of text in the note is multiplied by (sizes are rounded to whole pixels). Only text grows; containers,
 * spacing and icons keep their size (see `theme/scaledText`).
 */
export const TEXT_SIZES = [
  { key: "small", label: "A-", name: "Smaller text", factor: 0.9 },
  { key: "default", label: "A", name: "Default text size", factor: 1 },
  { key: "large", label: "A+", name: "Larger text", factor: 1.2 },
] as const;
export type TextSizeKey = (typeof TEXT_SIZES)[number]["key"];

const STORAGE_KEY = "pi-note-text-size";

function readSaved(): TextSizeKey {
  if (Platform.OS !== "web") return "default";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (TEXT_SIZES.some((s) => s.key === saved)) return saved as TextSizeKey;
  } catch {
    // Storage can be blocked; the default is fine.
  }
  return "default";
}

type Ctx = {
  size: TextSizeKey;
  setSize: (size: TextSizeKey) => void;
  /** Multiplier for every piece of text: 1, 1.1 at Medium, 1.25 at Large. */
  scale: number;
};

export const TextSizeContext = createContext<Ctx | null>(null);

/** App-wide the text keeps its designed size; only the research note opts in to a different one (`useNoteTextSize`). */
export function TextSizeProvider({ children }: { children: ReactNode }) {
  const value = useMemo<Ctx>(
    () => ({ size: "default", setSize: () => {}, scale: 1 }),
    [],
  );
  return (
    <TextSizeContext.Provider value={value}>
      {children}
    </TextSizeContext.Provider>
  );
}

/** The research note's chosen text size, remembered in the browser; its value is meant for a `TextSizeContext.Provider` around the note's text. */
export function useNoteTextSize(): Ctx {
  const [size, setSizeState] = useState<TextSizeKey>(readSaved);
  const setSize = useCallback((next: TextSizeKey) => {
    setSizeState(next);
    if (Platform.OS !== "web") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not saved; it still applies for this visit.
    }
  }, []);
  return useMemo(() => {
    const scale = TEXT_SIZES.find((s) => s.key === size)?.factor ?? 1;
    return { size, setSize, scale };
  }, [size, setSize]);
}

export function useTextSize(): Ctx {
  const ctx = useContext(TextSizeContext);
  if (!ctx)
    throw new Error("useTextSize must be used inside <TextSizeProvider>");
  return ctx;
}
