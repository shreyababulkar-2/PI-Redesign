import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { Icon } from '../Icon';

type Props = {
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

/** Zoom stepper (Figma "Zoom controls": Default / Plus disabled / Minus disabled). */
export function ZoomControls({ canZoomIn, canZoomOut, onZoomIn, onZoomOut }: Props) {
  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Zoom in"
        accessibilityState={{ disabled: !canZoomIn }}
        disabled={!canZoomIn}
        onPress={onZoomIn}
        style={[styles.button, !canZoomIn && styles.disabled]}
      >
        <Icon name={canZoomIn ? 'plus' : 'plusDisabled'} size={18} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Zoom out"
        accessibilityState={{ disabled: !canZoomOut }}
        disabled={!canZoomOut}
        onPress={onZoomOut}
        style={[styles.button, !canZoomOut && styles.disabled]}
      >
        <Icon name={canZoomOut ? 'minus' : 'minusDisabled'} size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    right: -4,
    bottom: 8,
    backgroundColor: colors.white,
    borderRadius: 4,
    overflow: 'hidden',
    boxShadow: '0px 1px 2px rgba(0,0,0,0.04)',
  },
  button: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  disabled: { backgroundColor: colors.grey50 },
});
