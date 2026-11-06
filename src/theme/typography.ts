import { TextStyle } from 'react-native';

/** Font family names registered by useAppFonts. */
export const fonts = {
  geistRegular: 'Geist_400Regular',
  geistMedium: 'Geist_500Medium',
  geistSemiBold: 'Geist_600SemiBold',
  spaceGroteskMedium: 'SpaceGrotesk_500Medium',
  monaSansRegular: 'MonaSans_400Regular',
  interRegular: 'Inter_400Regular',
} as const;

/** Type styles, values taken 1:1 from the Figma text nodes (size / line-height / tracking in px). */
export const type = {
  companyName: { fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 16, letterSpacing: 0.44 },
  noteTab: { fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 20, letterSpacing: 0.06 },
  noteTabActive: { fontFamily: fonts.geistMedium, fontSize: 12, lineHeight: 20, letterSpacing: 0.06 },
  floatingTitle: { fontFamily: fonts.spaceGroteskMedium, fontSize: 12, lineHeight: 20, letterSpacing: 0.03 },
  floatingChip: { fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 18 },
  sectionIndex: { fontFamily: fonts.spaceGroteskMedium, fontSize: 14, lineHeight: 24, letterSpacing: 0.035 },
  sectionTitle: { fontFamily: fonts.geistMedium, fontSize: 14, lineHeight: 20, letterSpacing: 0.035 },
  buttonSmall: { fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 16, letterSpacing: 0.12 },
  chipLg: { fontFamily: fonts.monaSansRegular, fontSize: 12, lineHeight: 18, letterSpacing: 0.06 },
  chip: { fontFamily: fonts.monaSansRegular, fontSize: 10, lineHeight: 16, letterSpacing: 0.05 },
  body: { fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 18, letterSpacing: 0.09 },
  bodyBold: { fontFamily: fonts.geistSemiBold, fontSize: 12, lineHeight: 18, letterSpacing: 0.09 },
  avatar: { fontFamily: fonts.geistMedium, fontSize: 14, lineHeight: 20, letterSpacing: -0.084 },
  assistantTitle: { fontFamily: fonts.spaceGroteskMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.144 },
  chatBubble: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 18, letterSpacing: 0.011 },
  thought: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 12, letterSpacing: 0.0825 },
  answer: { fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 18, letterSpacing: 0.012 },
  answerBold: { fontFamily: fonts.geistSemiBold, fontSize: 12, lineHeight: 18, letterSpacing: 0.012 },
  tableHead: { fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 16 },
  tableLabel: { fontFamily: fonts.geistSemiBold, fontSize: 11, lineHeight: 16 },
  tableValue: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 18 },
  tableRemark: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 16 },
  menuItemActive: { fontFamily: fonts.geistMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.144 },
  menuItem: { fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 16, letterSpacing: 0.144 },
  menuButton: { fontFamily: fonts.geistMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.144 },
  composer: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 18, letterSpacing: 0.0825 },
} satisfies Record<string, TextStyle>;
