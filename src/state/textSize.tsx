import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

/** Reading sizes for the content (Figma 519:2733): the 12px default, Medium 14px and Large 16px. */
export const TEXT_SIZES = [
  { key: "default", label: "Default", px: 12 },
  { key: "medium", label: "Medium", px: 14 },
  { key: "large", label: "Large", px: 16 },
] as const;
export type TextSizeKey = (typeof TEXT_SIZES)[number]["key"];

const BASE_PX = 12;
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
  /** Multiplier for content text: 1 at 12px, 14/12 at Medium, 16/12 at Large. */
  scale: number;
};

const TextSizeContext = createContext<Ctx | null>(null);

/**
 * The reader's chosen text size. It scales only the reading content (the research note body and the assistant's
 * messages), never the interface around it.
 */
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
    const px = TEXT_SIZES.find((s) => s.key === size)?.px ?? BASE_PX;
    return { size, setSize, scale: px / BASE_PX };
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
