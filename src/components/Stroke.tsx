import { StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  color: string;
  width?: number;
  radius?: number;
  /** Draw only one edge (e.g. a divider along the left side). Defaults to all four. */
  side?: 'left' | 'bottom';
};

/**
 * Figma "inside" stroke: painted over the frame's edge without adding to its layout size,
 * so children keep the exact coordinates reported by Figma (CSS borders would shift them).
 */
export function Stroke({ color, width = 1, radius, side }: Props) {
  const border: ViewStyle =
    side === 'left'
      ? { borderLeftWidth: width }
      : side === 'bottom'
        ? { borderBottomWidth: width }
        : { borderWidth: width };
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, border, { borderColor: color, borderRadius: radius }]}
    />
  );
}
