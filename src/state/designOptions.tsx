import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Platform } from 'react-native';

/** Design variants that can be flipped at runtime to compare them side by side. */
export type HeaderOption = 'a' | 'b';
export type Tone = 'white' | 'green';

export type DesignOptions = {
  /** Floating header layout once the page is scrolled. */
  scrolledHeader: HeaderOption;
  /** Colour of the top side-nav pod. */
  sideNavTop: Tone;
  /** Colour of the bottom side-nav pod. */
  sideNavBottom: Tone;
  /** Colour of the floating header's navigation pill. */
  floatingNav: Tone;
};

type Ctx = DesignOptions & {
  setOption: <K extends keyof DesignOptions>(key: K, value: DesignOptions[K]) => void;
};

const DEFAULTS: DesignOptions = { scrolledHeader: 'a', sideNavTop: 'white', sideNavBottom: 'white', floatingNav: 'white' };
const STORAGE_KEY = 'pi-redesign:design-options';

/** Allowed values per option, which also drives the switcher and the URL/storage parsing. */
export const OPTION_VALUES: { [K in keyof DesignOptions]: readonly DesignOptions[K][] } = {
  scrolledHeader: ['a', 'b'],
  sideNavTop: ['white', 'green'],
  sideNavBottom: ['white', 'green'],
  floatingNav: ['white', 'green'],
};

/** URL parameter for each option, e.g. `?header=b&navTop=green&navBottom=white&pill=green`. */
export const OPTION_PARAMS: { [K in keyof DesignOptions]: string } = {
  scrolledHeader: 'header',
  sideNavTop: 'navTop',
  sideNavBottom: 'navBottom',
  floatingNav: 'pill',
};

/** Initial values: URL parameters win, then the last choices, then the defaults. */
function readInitial(): DesignOptions {
  const result: DesignOptions = { ...DEFAULTS };
  if (Platform.OS !== 'web' || typeof window === 'undefined') return result;
  let saved: Partial<Record<keyof DesignOptions, unknown>> = {};
  let params: URLSearchParams | null = null;
  try {
    saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') ?? {};
    params = new URLSearchParams(window.location.search);
  } catch {
    // storage or URL unavailable: use defaults
  }
  for (const key of Object.keys(OPTION_VALUES) as (keyof DesignOptions)[]) {
    const allowed = OPTION_VALUES[key] as readonly unknown[];
    const fromUrl = params?.get(OPTION_PARAMS[key]);
    const value = allowed.includes(fromUrl) ? fromUrl : allowed.includes(saved[key]) ? saved[key] : undefined;
    if (value !== undefined) (result as Record<string, unknown>)[key] = value;
  }
  return result;
}

const DesignOptionsContext = createContext<Ctx | null>(null);

export function DesignOptionsProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<DesignOptions>(readInitial);

  const setOption = useCallback<Ctx['setOption']>((key, value) => {
    setOptions((prev) => {
      const next = { ...prev, [key]: value };
      if (Platform.OS === 'web') {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ ...options, setOption }), [options, setOption]);
  return <DesignOptionsContext.Provider value={value}>{children}</DesignOptionsContext.Provider>;
}

export function useDesignOptions(): Ctx {
  const ctx = useContext(DesignOptionsContext);
  if (!ctx) throw new Error('useDesignOptions must be used inside <DesignOptionsProvider>');
  return ctx;
}
