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
  sectionTitle: { fontFamily: fonts.geistMedium, fontSize: 14, lineHeight: 20, letterSpacing: 0.035 },
  buttonSmall: { fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 16, letterSpacing: 0.12 },
  chip: { fontFamily: fonts.monaSansRegular, fontSize: 11, lineHeight: 16, letterSpacing: 0.055 },
  body: { fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 18, letterSpacing: 0.09 },
  bodyBold: { fontFamily: fonts.geistSemiBold, fontSize: 12, lineHeight: 18, letterSpacing: 0.09 },
  avatar: { fontFamily: fonts.geistMedium, fontSize: 14, lineHeight: 20, letterSpacing: -0.084 },
  assistantTitle: { fontFamily: fonts.spaceGroteskMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.144 },
  chatBubble: { fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 18, letterSpacing: 0.09 },
  thought: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 12, letterSpacing: 0.09 },
  answer: { fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 19, letterSpacing: 0.09 },
  answerBold: { fontFamily: fonts.geistSemiBold, fontSize: 12, lineHeight: 19, letterSpacing: 0.09 },
  tableHead: { fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 16, letterSpacing: 0.06 },
  tableLabel: { fontFamily: fonts.geistSemiBold, fontSize: 11, lineHeight: 16, letterSpacing: 0.06 },
  // Tabular figures so numbers line up down the column.
  tableValue: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 18, letterSpacing: 0.06, fontVariant: ['tabular-nums'] },
  tableRemark: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 16, letterSpacing: 0.06 },
  menuItemActive: { fontFamily: fonts.geistMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.144 },
  menuItem: { fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 16, letterSpacing: 0.144 },
  menuButton: { fontFamily: fonts.geistMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.144 },
  composer: { fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 18, letterSpacing: 0.09 },
} satisfies Record<string, TextStyle>;
