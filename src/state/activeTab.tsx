import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Platform } from 'react-native';

/** Header tabs of the deal page, in order. Only the first and third have a page so far. */
export const TAB_KEYS = ['research', 'memo', 'benchmarking', 'checklist'] as const;
export type TabKey = (typeof TAB_KEYS)[number];

export const BENCHMARK_TABS = [
  'Trading comparables',
  'Financial comparables',
  'Transaction comparables',
  'Competitor list',
] as const;

type Ctx = {
  /** Index into the header tabs (see `noteTabs`). */
  tab: number;
  setTab: (index: number) => void;
  /** Index into `BENCHMARK_TABS`: the sub-tab shown on the Benchmarking page. */
  benchTab: number;
  setBenchTab: (index: number) => void;
};

const ActiveTabContext = createContext<Ctx | null>(null);

/** Initial tab from `?tab=benchmarking`, so a page can be linked straight to. */
function readInitialTab(): number {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 0;
  try {
    const key = new URLSearchParams(window.location.search).get('tab');
    const i = TAB_KEYS.indexOf(key as TabKey);
    return i >= 0 ? i : 0;
  } catch {
    return 0;
  }
}

export function ActiveTabProvider({ children }: { children: ReactNode }) {
  const [tab, setTabState] = useState(readInitialTab);
  const [benchTab, setBenchTab] = useState(0);

  const setTab = useCallback((index: number) => {
    setTabState(index);
    if (Platform.OS === 'web') {
      try {
        const url = new URL(window.location.href);
        if (index === 0) url.searchParams.delete('tab');
        else url.searchParams.set('tab', TAB_KEYS[index]);
        window.history.replaceState(null, '', url.toString());
      } catch {
        // ignore: the URL is only a convenience
      }
    }
  }, []);

  const value = useMemo(() => ({ tab, setTab, benchTab, setBenchTab }), [tab, setTab, benchTab]);
  return <ActiveTabContext.Provider value={value}>{children}</ActiveTabContext.Provider>;
}

export function useActiveTab(): Ctx {
  const ctx = useContext(ActiveTabContext);
  if (!ctx) throw new Error('useActiveTab must be used inside <ActiveTabProvider>');
  return ctx;
}
