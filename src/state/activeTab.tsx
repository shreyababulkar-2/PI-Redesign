import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { enableAppear } from '../theme/motion';

/** Header tabs of the deal page, in order. Only the first and third have a page so far. */
export const TAB_KEYS = ['research', 'memo', 'benchmarking', 'checklist', 'dataroom'] as const;
export type TabKey = (typeof TAB_KEYS)[number];

export const BENCHMARK_TABS = [
  'Trading comparables',
  'Financial comparables',
  'Transaction comparables',
  'Competitor list',
] as const;

type Ctx = {
  /** Index into the header tabs (see `noteTabs`): the selected one, updated immediately on click. */
  tab: number;
  /** The tab whose page is on screen. Trails `tab` by a beat while the old page fades out. */
  pageTab: number;
  setTab: (index: number) => void;
  /** How long (ms) the old page takes to fade out before the next is shown; the screen raises it when scrolled. */
  setSwitchDelay: (ms: number) => void;
  /** True for the moment the current page is fading out before the next tab's page replaces it. */
  switching: boolean;
  /** Index into `BENCHMARK_TABS`: the sub-tab shown on the Benchmarking page. */
  benchTab: number;
  setBenchTab: (index: number) => void;
};

const SWITCH_OUT_MS = 90;

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
  // `tab` follows the click at once (the header's selected pill moves immediately); `pageTab` is the page that is
  // actually shown, which changes a beat later once the old page has faded out.
  const [initial] = useState(readInitialTab);
  const [tab, setTabState] = useState(initial);
  const [pageTab, setPageTab] = useState(initial);
  const [benchTab, setBenchTabState] = useState(0);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const switchDelayRef = useRef(SWITCH_OUT_MS);
  const setSwitchDelay = useCallback((ms: number) => {
    switchDelayRef.current = ms;
  }, []);
  const setBenchTab = useCallback((index: number) => {
    enableAppear();
    setBenchTabState(index);
  }, []);

  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );

  const setTab = useCallback((index: number) => {
    setTabState(index);
    enableAppear();
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(() => {
      pending.current = null;
      setPageTab(index);
    }, switchDelayRef.current);
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

  const switching = tab !== pageTab;
  const value = useMemo(
    () => ({ tab, pageTab, setTab, switching, setSwitchDelay, benchTab, setBenchTab }),
    [tab, pageTab, setTab, switching, setSwitchDelay, benchTab, setBenchTab],
  );
  return <ActiveTabContext.Provider value={value}>{children}</ActiveTabContext.Provider>;
}

export function useActiveTab(): Ctx {
  const ctx = useContext(ActiveTabContext);
  if (!ctx) throw new Error('useActiveTab must be used inside <ActiveTabProvider>');
  return ctx;
}
