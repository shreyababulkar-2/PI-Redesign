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
 * Design variants that can be flipped at runtime to compare them (review only; see `OptionsSwitcher`).
 * - `citations`: `simple` shows every source as a superscript number; `dataroom` keeps numbers for web sources and
 *   shows a small folder icon for data room sources (Figma 542:18175).
 */
export type CitationOption = "simple" | "dataroom";

export type DesignOptions = {
  citations: CitationOption;
};

type Ctx = DesignOptions & {
  setOption: <K extends keyof DesignOptions>(
    key: K,
    value: DesignOptions[K],
  ) => void;
};

const DEFAULTS: DesignOptions = { citations: "simple" };
const STORAGE_KEY = "pi-redesign:design-options";

/** Allowed values per option, which also drives the switcher and the URL/storage parsing. */
export const OPTION_VALUES: {
  [K in keyof DesignOptions]: readonly DesignOptions[K][];
} = {
  citations: ["simple", "dataroom"],
};

/** URL parameter for each option, e.g. `?citations=dataroom`. */
export const OPTION_PARAMS: { [K in keyof DesignOptions]: string } = {
  citations: "citations",
};

/** Initial values: URL parameters win, then the last choices, then the defaults. */
function readInitial(): DesignOptions {
  const result: DesignOptions = { ...DEFAULTS };
  if (Platform.OS !== "web" || typeof window === "undefined") return result;
  let saved: Partial<Record<keyof DesignOptions, unknown>> = {};
  let params: URLSearchParams | null = null;
  try {
    saved =
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") ?? {};
    params = new URLSearchParams(window.location.search);
  } catch {
    // Storage or the address is unavailable: use the defaults.
  }
  for (const key of Object.keys(OPTION_VALUES) as (keyof DesignOptions)[]) {
    const allowed = OPTION_VALUES[key] as readonly unknown[];
    const fromUrl = params?.get(OPTION_PARAMS[key]);
    const value = allowed.includes(fromUrl)
      ? fromUrl
      : allowed.includes(saved[key])
        ? saved[key]
        : undefined;
    if (value !== undefined) (result as Record<string, unknown>)[key] = value;
  }
  return result;
}

const DesignOptionsContext = createContext<Ctx | null>(null);

export function DesignOptionsProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<DesignOptions>(readInitial);

  const setOption = useCallback<Ctx["setOption"]>((key, value) => {
    setOptions((prev) => {
      const next = { ...prev, [key]: value };
      if (Platform.OS === "web") {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Not saved; it still applies for this visit.
        }
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ ...options, setOption }),
    [options, setOption],
  );
  return (
    <DesignOptionsContext.Provider value={value}>
      {children}
    </DesignOptionsContext.Provider>
  );
}

export function useDesignOptions(): Ctx {
  const ctx = useContext(DesignOptionsContext);
  if (!ctx)
    throw new Error(
      "useDesignOptions must be used inside <DesignOptionsProvider>",
    );
  return ctx;
}
