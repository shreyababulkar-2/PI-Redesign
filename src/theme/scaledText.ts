import { useContext } from "react";
import { StyleSheet, Text } from "react-native";
import type { StyleProp, TextProps, TextStyle } from "react-native";
import { TextSizeContext } from "../state/textSize";

type Render = (props: TextProps, ref: unknown) => unknown;

/**
 * Makes every piece of text follow the reader's text size. All text goes through one component, so it is wrapped
 * once here instead of touching each screen: pixel font sizes (with their line heights and letter spacing) are
 * multiplied by the chosen scale and rounded to whole pixels; line height grows by the same number of pixels. Nothing else changes: widths, heights, spacing and icons stay as designed. Sizes
 * given as strings (like the citation's "0.72em") already follow their parent.
 */
const textType = Text as unknown as { render?: Render; __scaled?: boolean };

if (textType.render && !textType.__scaled) {
  const original = textType.render;
  textType.__scaled = true;
  textType.render = function ScaledTextRender(props, ref) {
    const scale = useContext(TextSizeContext)?.scale ?? 1;
    if (scale === 1) return original(props, ref);
    const flat = StyleSheet.flatten(props.style as StyleProp<TextStyle>);
    if (!flat || typeof flat.fontSize !== "number") return original(props, ref);
    const fontSize = Math.round(flat.fontSize * scale);
    const scaled: { -readonly [K in keyof TextStyle]: TextStyle[K] } = {
      fontSize,
    };
    // Line height grows by the same pixels as the text, not by the same percentage, so the leading stays about
    // what it was designed as and rows and blocks don't get much taller.
    if (typeof flat.lineHeight === "number")
      scaled.lineHeight = flat.lineHeight + (fontSize - flat.fontSize);
    if (typeof flat.letterSpacing === "number")
      scaled.letterSpacing = flat.letterSpacing * scale;
    return original({ ...props, style: [flat, scaled] }, ref);
  };
}
