import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppFonts } from './src/theme/useAppFonts';
import { ResearchNoteScreen } from './src/screens/ResearchNoteScreen';
import { DesignOptionsProvider } from './src/state/designOptions';
import { AssistantOverlayProvider } from './src/state/assistantOverlay';

export default function App() {
  const fontsReady = useAppFonts();
  // Web: crisper glyphs (macOS renders text heavier by default) and better kerning/ligatures.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent =
      'body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-kerning:normal}';
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  if (!fontsReady) return null;
  return (
    <>
      <StatusBar style="dark" />
      <DesignOptionsProvider>
        <AssistantOverlayProvider>
          <ResearchNoteScreen />
        </AssistantOverlayProvider>
      </DesignOptionsProvider>
    </>
  );
}
