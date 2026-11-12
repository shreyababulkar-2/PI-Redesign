import { useWindowDimensions } from "react-native";

/** Wider than this, the assistant's response text steps up from 12px to 14px. */
export const RESPONSE_WIDE_BREAKPOINT = 1440;
const BASE_PX = 12;
const WIDE_PX = 14;

/** Scale factor for assistant response text: 1 (12px) normally, 14/12 on viewports wider than 1440px. */
export function useResponseScale(): number {
  const { width } = useWindowDimensions();
  return width > RESPONSE_WIDE_BREAKPOINT ? WIDE_PX / BASE_PX : 1;
}
