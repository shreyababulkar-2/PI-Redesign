import { StyleSheet, Text, TextStyle, View } from "react-native";
import { Block } from "../../data/researchNote";
import { CITATION_GROUP, citationNumbers } from "../../data/citations";
import { Citation } from "./Citation";
import { CONTEXT_SOURCE } from "../../state/selectionContext";

type Props = {
  blocks: Block[];
  regular: TextStyle;
  bold: TextStyle;
  color: string;
  /** Zoom factor applied to type and spacing (1 = design size). */
  scale?: number;
  /** Note text (not the assistant's own replies) can be picked as assistant context; see selectionContext. */
  contextSource?: boolean;
};

/** Web: balance line breaks so a paragraph doesn't end on a lone word. Ignored on native. */
const prettyWrap = { textWrap: "pretty" } as TextStyle;

function scaleText(style: TextStyle, scale: number): TextStyle {
  if (scale === 1) return { ...style, ...prettyWrap };
  return {
    ...style,
    ...prettyWrap,
    fontSize: style.fontSize !== undefined ? style.fontSize * scale : undefined,
    lineHeight:
      style.lineHeight !== undefined ? style.lineHeight * scale : undefined,
    letterSpacing:
      style.letterSpacing !== undefined
        ? style.letterSpacing * scale
        : undefined,
  };
}

/** Splits copy into plain text and citation groups; adjacent markers like `[7][9]` become one group. */
function splitCitations(text: string): { text: string; numbers?: number[] }[] {
  return text
    .split(CITATION_GROUP)
    .filter(Boolean)
    .map((part, i) =>
      i % 2 === 1
        ? { text: part, numbers: citationNumbers(part) }
        : { text: part },
    );
}

/** Marker column: text is indented 18px, the disc sits 6px in (matches the design's list-disc). */
const BULLET_INDENT = 18;
const BULLET_SIZE = 4;

export function RichText({
  blocks,
  regular: baseRegular,
  bold: baseBold,
  color,
  scale = 1,
  contextSource = false,
}: Props) {
  const regular = scaleText(baseRegular, scale);
  const bold = scaleText(baseBold, scale);
  return (
    <View style={styles.root} {...(contextSource ? CONTEXT_SOURCE : null)}>
      {blocks.map((block, i) => {
        if (block.kind === "spacer") {
          return <View key={i} style={{ height: regular.lineHeight }} />;
        }
        const content = (
          <Text style={[regular, { color }]}>
            {block.segments.map((s, j) => (
              <Text key={j} style={s.bold ? bold : undefined}>
                {splitCitations(s.text).map((part, k) =>
                  part.numbers ? (
                    <Citation key={k} numbers={part.numbers} />
                  ) : (
                    part.text
                  ),
                )}
              </Text>
            ))}
          </Text>
        );
        if (block.kind === "bullet") {
          return (
            <View
              key={i}
              style={[
                styles.bulletRow,
                { marginBottom: (block.marginBottom ?? 0) * scale },
              ]}
            >
              <View
                style={[
                  styles.bulletMarker,
                  {
                    height: regular.lineHeight,
                    width: BULLET_INDENT * scale,
                    paddingLeft: 6 * scale,
                  },
                ]}
              >
                <View style={[styles.dot, { backgroundColor: color }]} />
              </View>
              <View style={styles.bulletText}>{content}</View>
            </View>
          );
        }
        return (
          <View
            key={i}
            style={{ marginBottom: (block.marginBottom ?? 0) * scale }}
          >
            {content}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%" },
  bulletRow: { flexDirection: "row" },
  bulletMarker: {
    width: BULLET_INDENT,
    justifyContent: "center",
    paddingLeft: 6,
  },
  dot: {
    width: BULLET_SIZE,
    height: BULLET_SIZE,
    borderRadius: BULLET_SIZE / 2,
  },
  bulletText: { flex: 1 },
});
