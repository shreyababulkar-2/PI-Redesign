import { useFonts } from 'expo-font';
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { MonaSans_400Regular } from '@expo-google-fonts/mona-sans';
import { Inter_400Regular } from '@expo-google-fonts/inter';

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    MonaSans_400Regular,
    Inter_400Regular,
  });
  return loaded || !!error;
}
