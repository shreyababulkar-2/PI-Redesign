import { StyleSheet, Text, TextStyle, View } from 'react-native';
import { Block } from '../../data/researchNote';

type Props = {
  blocks: Block[];
  regular: TextStyle;
  bold: TextStyle;
  color: string;
  /** Zoom factor applied to type and spacing (1 = design size). */
  scale?: number;
};

function scaleText(style: TextStyle, scale: number): TextStyle {
  if (scale === 1) return style;
  return {
    ...style,
    fontSize: style.fontSize !== undefined ? style.fontSize * scale : undefined,
    lineHeight: style.lineHeight !== undefined ? style.lineHeight * scale : undefined,
    letterSpacing: style.letterSpacing !== undefined ? style.letterSpacing * scale : undefined,
  };
}

/** Marker column: text is indented 18px, the disc sits 6px in (matches the design's list-disc). */
const BULLET_INDENT = 18;
const BULLET_SIZE = 4;

export function RichText({ blocks, regular: baseRegular, bold: baseBold, color, scale = 1 }: Props) {
  const regular = scaleText(baseRegular, scale);
  const bold = scaleText(baseBold, scale);
  return (
    <View style={styles.root}>
      {blocks.map((block, i) => {
        if (block.kind === 'spacer') {
          return <View key={i} style={{ height: regular.lineHeight }} />;
        }
        const content = (
          <Text style={[regular, { color }]}>
            {block.segments.map((s, j) => (
              <Text key={j} style={s.bold ? bold : undefined}>
                {s.text}
              </Text>
            ))}
          </Text>
        );
        if (block.kind === 'bullet') {
          return (
            <View key={i} style={[styles.bulletRow, { marginBottom: (block.marginBottom ?? 0) * scale }]}>
              <View style={[styles.bulletMarker, { height: regular.lineHeight, width: BULLET_INDENT * scale, paddingLeft: 6 * scale }]}>
                <View style={[styles.dot, { backgroundColor: color }]} />
              </View>
              <View style={styles.bulletText}>{content}</View>
            </View>
          );
        }
        return (
          <View key={i} style={{ marginBottom: (block.marginBottom ?? 0) * scale }}>
            {content}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
  bulletRow: { flexDirection: 'row' },
  bulletMarker: { width: BULLET_INDENT, justifyContent: 'center', paddingLeft: 6 },
  dot: { width: BULLET_SIZE, height: BULLET_SIZE, borderRadius: BULLET_SIZE / 2 },
  bulletText: { flex: 1 },
});
