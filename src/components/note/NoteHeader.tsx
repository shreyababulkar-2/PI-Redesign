import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { companyLogo } from '../../assets/images';
import { colors, type } from '../../theme';
import { HEADER_TOP } from '../../theme/layout';
import { company, noteTabs } from '../../data/researchNote';
import { Icon } from '../Icon';
import { NoteTab } from './NoteTab';
import { pointer } from '../../theme/cursor';

type Props = { activeTab: number };

/** Default (unscrolled) header: a white card with the company, note tabs and page actions. */
export function NoteHeader({ activeTab }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.left}>
        <View style={styles.company}>
          <View style={styles.logoOuter}>
            <Image source={companyLogo} contentFit="cover" style={styles.logo} />
          </View>
          <Text style={[type.companyName, styles.companyName]}>{company.name}</Text>
        </View>
        <View style={styles.tabs}>
          {noteTabs.map((label, i) => (
            <NoteTab key={label} label={label} active={i === activeTab} />
          ))}
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.dataRoom}>
          <Icon name="headerDataRoom" size={16} />
          <Text style={[type.buttonSmall, { color: colors.pine800 }]} numberOfLines={1}>
            Data Room
          </Text>
        </View>
        <Icon name="topbarDownload" size={28} style={pointer} />
        <Icon name="topbarMore" size={28} style={pointer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: HEADER_TOP,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 8,
  },
  left: { gap: 12 },
  company: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  companyName: { color: colors.slate600, textTransform: 'uppercase' },
  logoOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 16, height: 16, borderRadius: 8 },
  tabs: { flexDirection: 'row', gap: 8 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dataRoom: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.dew75,
    borderRadius: 8,
    overflow: 'hidden',
    ...pointer,
  },
});
