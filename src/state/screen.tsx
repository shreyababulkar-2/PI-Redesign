import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { Platform } from "react-native";

/** The prototype's top-level screens: the empty start page, then either the research note or the VDR assistant. */
export type ScreenKey = "start" | "note" | "vdr";

type ScreenState = {
  screen: ScreenKey;
  go: (screen: ScreenKey) => void;
  /** Back button in the side nav: returns to the start page. */
  back: () => void;
};

const ScreenContext = createContext<ScreenState>({
  screen: "start",
  go: () => {},
  back: () => {},
});

/** The prototype starts on the empty page; `?screen=note|vdr` jumps straight to a screen while developing. */
function initialScreen(): ScreenKey {
  if (Platform.OS !== "web" || typeof window === "undefined") return "start";
  const param = new URLSearchParams(window.location.search).get("screen");
  if (param === "note") return "note";
  if (param === "vdr" || param === "assistant") return "vdr";
  return "start";
}

export function ScreenProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<ScreenKey>(initialScreen);
  const value = useMemo<ScreenState>(
    () => ({
      screen,
      go: setScreen,
      back: () => setScreen("start"),
    }),
    [screen],
  );
  return (
    <ScreenContext.Provider value={value}>{children}</ScreenContext.Provider>
  );
}

export const useScreen = () => useContext(ScreenContext);
