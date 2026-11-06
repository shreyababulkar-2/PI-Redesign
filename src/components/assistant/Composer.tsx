import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../../theme';
import { assistant } from '../../data/researchNote';
import { Icon } from '../Icon';
import { Stroke } from '../Stroke';

/** Prompt area. Static for now — input behavior is pending confirmation. */
export function Composer() {
  return (
    <View style={styles.wrap}>
      <View style={styles.composer}>
        <Text style={[type.composer, { color: colors.slate500 }]}>{assistant.composerPlaceholder}</Text>
        <View style={styles.actions}>
          <View style={styles.attach}>
            <View style={styles.attachButton}>
              <Icon name="upload" size={16} />
            </View>
            <View style={styles.attachButton}>
              <Icon name="dataRoom" size={16} />
            </View>
          </View>
          <Icon name="send" size={22} />
        </View>
        <Stroke color={colors.slate100} radius={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingHorizontal: 16 },
  composer: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
  },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  attach: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  attachButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: colors.slate50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
