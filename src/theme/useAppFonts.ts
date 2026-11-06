import { useFonts } from 'expo-font';
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk';
import { MonaSans_400Regular } from '@expo-google-fonts/mona-sans';
import { Inter_400Regular } from '@expo-google-fonts/inter';

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    SpaceGrotesk_500Medium,
    MonaSans_400Regular,
    Inter_400Regular,
  });
  return loaded || !!error;
}
