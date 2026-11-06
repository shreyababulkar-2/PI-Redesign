import { StatusBar } from 'expo-status-bar';
import { useAppFonts } from './src/theme/useAppFonts';
import { ResearchNoteScreen } from './src/screens/ResearchNoteScreen';

export default function App() {
  const fontsReady = useAppFonts();
  if (!fontsReady) return null;
  return (
    <>
      <StatusBar style="dark" />
      <ResearchNoteScreen />
    </>
  );
}
