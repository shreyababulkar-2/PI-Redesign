import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { Platform } from "react-native";

/** The prototype's top-level screens: the empty start page, then either the research note or the VDR assistant. */
export type ScreenKey = "start" | "note" | "vdr" | "assistant" | "vdr2" | "assistant2";

type ScreenState = {
  screen: ScreenKey;
  go: (screen: ScreenKey) => void;
  /** Back button in the side nav: an assistant view returns to its VDR page, everything else to the start page. */
  back: () => void;
  /** The question sent from the VDR composer, shown as the first message of the full assistant view. */
  question: string;
  /** Send from the VDR composer: opens the full assistant view with this question. */
  openAssistant: (question: string) => void;
};

const ScreenContext = createContext<ScreenState>({
  screen: "start",
  go: () => {},
  back: () => {},
  question: "",
  openAssistant: () => {},
});

/** The prototype starts on the empty page; `?screen=note|vdr|assistant` jumps straight to a screen while developing. */
function initialScreen(): ScreenKey {
  if (Platform.OS !== "web" || typeof window === "undefined") return "start";
  const param = new URLSearchParams(window.location.search).get("screen");
  if (param === "note") return "note";
  if (param === "vdr") return "vdr";
  if (param === "assistant") return "assistant";
  if (param === "vdr2") return "vdr2";
  if (param === "assistant2") return "assistant2";
  return "start";
}

export function ScreenProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<ScreenKey>(initialScreen);
  const [question, setQuestion] = useState("");
  const value = useMemo<ScreenState>(
    () => ({
      screen,
      go: setScreen,
      back: () => setScreen(screen === "assistant" ? "vdr" : screen === "assistant2" ? "vdr2" : "start"),
      question,
      openAssistant: (q: string) => {
        setQuestion(q);
        // Each VDR version opens its own assistant view.
        setScreen(screen === "vdr2" ? "assistant2" : "assistant");
      },
    }),
    [screen, question],
  );
  return (
    <ScreenContext.Provider value={value}>{children}</ScreenContext.Provider>
  );
}

export const useScreen = () => useContext(ScreenContext);
