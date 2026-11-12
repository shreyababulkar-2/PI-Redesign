import { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAppFonts } from "./src/theme/useAppFonts";
import { ResearchNoteScreen } from "./src/screens/ResearchNoteScreen";
import { AssistantOverlayProvider } from "./src/state/assistantOverlay";
import { SelectionContextProvider } from "./src/state/selectionContext";
import { ActiveTabProvider } from "./src/state/activeTab";
import { SourcesDrawerProvider } from "./src/state/sourcesDrawer";

export default function App() {
  const fontsReady = useAppFonts();
  // Web: crisper glyphs (macOS renders text heavier by default) and better kerning/ligatures.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const style = document.createElement("style");
    style.textContent =
      "body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-kerning:normal}::selection{background:#e0f8e7;color:inherit}::highlight(pi-context){background-color:#eef6ec}@keyframes pi-dot-in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}@keyframes pi-appear{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}";
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  if (!fontsReady) return null;
  return (
    <>
      <StatusBar style="dark" />
      <AssistantOverlayProvider>
        <ActiveTabProvider>
          <SelectionContextProvider>
            <SourcesDrawerProvider>
              <ResearchNoteScreen />
            </SourcesDrawerProvider>
          </SelectionContextProvider>
        </ActiveTabProvider>
      </AssistantOverlayProvider>
    </>
  );
}
