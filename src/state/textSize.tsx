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
 * Text size is an accessibility setting (Figma 519:2733): the base as designed, Medium 1.1x and Large 1.25x. `px` is
 * what 12px text becomes (sizes are rounded to whole pixels). Only text grows; containers, spacing and icons keep their size (see `theme/scaledText`).
 */
export const TEXT_SIZES = [
  { key: "default", label: "Default", factor: 1, px: 12 },
  { key: "medium", label: "Medium", factor: 1.1, px: 13 },
  { key: "large", label: "Large", factor: 1.25, px: 15 },
] as const;
export type TextSizeKey = (typeof TEXT_SIZES)[number]["key"];

const STORAGE_KEY = "pi-text-size";

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

/** The reader's chosen text size, remembered in the browser. */
export function TextSizeProvider({ children }: { children: ReactNode }) {
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
  const value = useMemo(() => {
    const scale = TEXT_SIZES.find((s) => s.key === size)?.factor ?? 1;
    return { size, setSize, scale };
  }, [size, setSize]);
  return (
    <TextSizeContext.Provider value={value}>
      {children}
    </TextSizeContext.Provider>
  );
}

export function useTextSize(): Ctx {
  const ctx = useContext(TextSizeContext);
  if (!ctx)
    throw new Error("useTextSize must be used inside <TextSizeProvider>");
  return ctx;
}
