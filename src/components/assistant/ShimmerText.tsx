import { ReactNode } from "react";
import { Platform, StyleProp, Text, TextStyle } from "react-native";
import { Pulse } from "./Pulse";

const KEYFRAMES_ID = "pi-shimmer-keyframes";

/** Web: add the sweep keyframes once. */
function ensureKeyframes() {
  if (
    Platform.OS !== "web" ||
    typeof document === "undefined" ||
    document.getElementById(KEYFRAMES_ID)
  )
    return;
  const style = document.createElement("style");
  style.id = KEYFRAMES_ID;
  style.textContent =
    "@keyframes pi-shimmer { from { background-position: 120% 0; } to { background-position: -20% 0; } }";
  document.head.appendChild(style);
}

type Props = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  /** The resting colour of the text. */
  base: string;
  /** The colour of the passing highlight. */
  shine: string;
};

/**
 * Text with a highlight that sweeps across it, the usual "still working" shimmer. It is drawn with a
 * CSS gradient clipped to the glyphs, so on web only; elsewhere the text just pulses.
 */
export function ShimmerText({ children, style, base, shine }: Props) {
  if (Platform.OS !== "web") {
    return (
      <Pulse>
        <Text style={[style, { color: base }]}>{children}</Text>
      </Pulse>
    );
  }
  ensureKeyframes();
  const web = {
    color: "transparent",
    WebkitTextFillColor: "transparent",
    backgroundImage: `linear-gradient(100deg, ${base} 0%, ${base} 38%, ${shine} 50%, ${base} 62%, ${base} 100%)`,
    backgroundSize: "260% 100%",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    animation: "pi-shimmer 1.9s linear infinite",
  } as TextStyle;
  return <Text style={[style, web]}>{children}</Text>;
}
