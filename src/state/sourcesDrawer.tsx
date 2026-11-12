import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type Ctx = {
  /** The section whose sources drawer is open, or null. Drawers are per section. */
  openSectionId: string | null;
  open: (sectionId: string) => void;
  close: () => void;
};

const SourcesDrawerContext = createContext<Ctx | null>(null);

export function SourcesDrawerProvider({ children }: { children: ReactNode }) {
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const open = useCallback((id: string) => setOpenSectionId(id), []);
  const close = useCallback(() => setOpenSectionId(null), []);
  const value = useMemo(
    () => ({ openSectionId, open, close }),
    [openSectionId, open, close],
  );
  return (
    <SourcesDrawerContext.Provider value={value}>
      {children}
    </SourcesDrawerContext.Provider>
  );
}

export function useSourcesDrawer(): Ctx {
  const ctx = useContext(SourcesDrawerContext);
  if (!ctx)
    throw new Error(
      "useSourcesDrawer must be used inside <SourcesDrawerProvider>",
    );
  return ctx;
}
