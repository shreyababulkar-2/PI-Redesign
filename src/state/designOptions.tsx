import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Platform } from 'react-native';

/** Design variants that can be flipped at runtime to compare them side by side. */
export type HeaderOption = 'a' | 'b';

type DesignOptions = { scrolledHeader: HeaderOption };

type Ctx = DesignOptions & { setScrolledHeader: (o: HeaderOption) => void };

const DEFAULTS: DesignOptions = { scrolledHeader: 'a' };
const STORAGE_KEY = 'pi-redesign:design-options';

/** Initial value: `?header=b` in the URL wins, then the last choice, then the default. */
function readInitial(): DesignOptions {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return DEFAULTS;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('header');
    if (fromUrl === 'a' || fromUrl === 'b') return { scrolledHeader: fromUrl };
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved?.scrolledHeader === 'a' || saved?.scrolledHeader === 'b') return { scrolledHeader: saved.scrolledHeader };
  } catch {
    // storage unavailable: fall through to defaults
  }
  return DEFAULTS;
}

const DesignOptionsContext = createContext<Ctx | null>(null);

export function DesignOptionsProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<DesignOptions>(readInitial);

  const setScrolledHeader = useCallback((scrolledHeader: HeaderOption) => {
    const next = { scrolledHeader };
    setOptions(next);
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
  }, []);

  const value = useMemo(() => ({ ...options, setScrolledHeader }), [options, setScrolledHeader]);
  return <DesignOptionsContext.Provider value={value}>{children}</DesignOptionsContext.Provider>;
}

export function useDesignOptions(): Ctx {
  const ctx = useContext(DesignOptionsContext);
  if (!ctx) throw new Error('useDesignOptions must be used inside <DesignOptionsProvider>');
  return ctx;
}
