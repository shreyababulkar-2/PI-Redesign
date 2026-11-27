import { useEffect } from "react";
import "./src/theme/scaledText";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAppFonts } from "./src/theme/useAppFonts";
import { StartScreen } from "./src/screens/StartScreen";
import { GridOverlay } from "./src/components/GridOverlay";
import { ScreenProvider, useScreen } from "./src/state/screen";
import { VdrScreen } from "./src/screens/VdrScreen";
import { AssistantScreen } from "./src/screens/AssistantScreen";
import { VdrScreen as VdrScreenV2 } from "./src/v2/VdrScreen";
import { AssistantScreen as AssistantScreenV2 } from "./src/v2/AssistantScreen";
import { ResearchNoteScreen } from "./src/screens/ResearchNoteScreen";
import { ResearchNoteScreen as ResearchNoteScreenArchive } from "./src/archive/dealScan/screens/ResearchNoteScreen";
import { AssistantOverlayProvider } from "./src/state/assistantOverlay";
import { SelectionContextProvider } from "./src/state/selectionContext";
import { ActiveTabProvider } from "./src/state/activeTab";
import { TextSizeProvider } from "./src/state/textSize";
import { DocumentViewerProvider } from "./src/state/documentViewer";
import { BenchmarkCitationProvider } from "./src/state/benchmarkCitation";
import { SourcesDrawerProvider } from "./src/state/sourcesDrawer";

function CurrentScreen() {
  const { screen } = useScreen();
  if (screen === "vdr") return <VdrScreen />;
  if (screen === "assistant") return <AssistantScreen />;
  if (screen === "vdr2") return <VdrScreenV2 />;
  if (screen === "assistant2") return <AssistantScreenV2 />;
  if (screen === "note") return <ResearchNoteScreen />;
  if (screen === "noteArchive") return <ResearchNoteScreenArchive />;
  return <StartScreen />;
}

export default function App() {
  const fontsReady = useAppFonts();
  // Web: crisper glyphs (macOS renders text heavier by default) and better kerning/ligatures.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const style = document.createElement("style");
    style.textContent =
      "body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-kerning:normal}::selection{background:#e0f8e7;color:inherit}::highlight(pi-context){background-color:#eef6ec}::highlight(pi-claim){background-color:#ffecc0}@keyframes pi-skeleton{0%{background-position:100% 0}100%{background-position:-100% 0}}@keyframes pi-dot-in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}@keyframes pi-appear{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}";
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  if (!fontsReady) return null;
  return (
    <>
      <StatusBar style="dark" />

      <TextSizeProvider>
        <AssistantOverlayProvider>
          <ActiveTabProvider>
            <SelectionContextProvider>
              <SourcesDrawerProvider>
                <DocumentViewerProvider>
                  <BenchmarkCitationProvider>
                    <ScreenProvider>
                      <CurrentScreen />
                      <GridOverlay />
                    </ScreenProvider>
                  </BenchmarkCitationProvider>
                </DocumentViewerProvider>
              </SourcesDrawerProvider>
            </SelectionContextProvider>
          </ActiveTabProvider>
        </AssistantOverlayProvider>
      </TextSizeProvider>
    </>
  );
}
