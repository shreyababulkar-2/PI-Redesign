import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useWindowDimensions } from "react-native";

/** Below this window width the assistant and the note can't both fit, so the assistant collapses. */
export const ASSISTANT_COLLAPSE_BELOW = 1000;

type Ctx = {
  /** True when the window is too narrow for the assistant to sit beside the note. */
  collapsed: boolean;
  /** Whether the collapsed assistant is currently shown as an overlay. Always false when not collapsed. */
  open: boolean;
  setOpen: (open: boolean) => void;
};

const AssistantOverlayContext = createContext<Ctx | null>(null);

export function AssistantOverlayProvider({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const collapsed = width < ASSISTANT_COLLAPSE_BELOW;
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ collapsed, open: collapsed && open, setOpen }), [collapsed, open]);
  return <AssistantOverlayContext.Provider value={value}>{children}</AssistantOverlayContext.Provider>;
}

export function useAssistantOverlay(): Ctx {
  const ctx = useContext(AssistantOverlayContext);
  if (!ctx) throw new Error("useAssistantOverlay must be used inside <AssistantOverlayProvider>");
  return ctx;
}
