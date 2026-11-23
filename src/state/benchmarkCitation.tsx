import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

/** A value typed in by hand, with how it was checked. */
export type Overwrite = { value: string; note: string };

/** What the reader has done to one figure: a value typed over the sources', and which value is in use. */
export type Pick = {
  overwrite: Overwrite | null;
  /** "overwrite", or the value of the source option chosen; null leaves the figure's own value in use. */
  selected: string | null;
};

/** The `selected` of a Pick when the value typed in by hand is the one in use. */
export const OVERWRITE = "overwrite";

const NONE: Pick = { overwrite: null, selected: null };

/**
 * Which figure of the benchmarking tables has its citation drawer open (by the figure's id, see
 * `components/benchmarking/citationTargets.ts`), or none, and what the reader has chosen or typed for each figure
 * so far. The choices outlive the drawer: opening a figure again finds its chosen value in use.
 */
type Ctx = {
  openId: string | null;
  open: (id: string) => void;
  close: () => void;
  pickOf: (id: string) => Pick;
  setPick: (id: string, pick: Pick) => void;
};

const BenchmarkCitationContext = createContext<Ctx>({
  openId: null,
  open: () => {},
  close: () => {},
  pickOf: () => NONE,
  setPick: () => {},
});

export function BenchmarkCitationProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const close = useCallback(() => setOpenId(null), []);
  const pickOf = useCallback((id: string) => picks[id] ?? NONE, [picks]);
  const setPick = useCallback((id: string, pick: Pick) => setPicks((all) => ({ ...all, [id]: pick })), []);
  const value = useMemo(() => ({ openId, open: setOpenId, close, pickOf, setPick }), [openId, close, pickOf, setPick]);
  return <BenchmarkCitationContext.Provider value={value}>{children}</BenchmarkCitationContext.Provider>;
}

export const useBenchmarkCitation = () => useContext(BenchmarkCitationContext);
