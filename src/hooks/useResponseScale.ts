import { useTextSize } from "../state/textSize";

/** Scale factor for the assistant's message text: 1 at the 12px default, larger when the reader picks Medium or Large. */
export function useResponseScale(): number {
  return useTextSize().scale;
}
