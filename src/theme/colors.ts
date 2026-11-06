/** Design tokens pulled from Figma variables (get_variable_defs, node 288:16159). */
export const colors = {
  white: '#ffffff',
  white10: 'rgba(255,255,255,0.1)',

  pine100: '#e0f8e7',
  pine950: '#0a2916',
  pine900: '#1c4b2e',
  pine800: '#205b34',
  pine700: '#22733e',

  dew100: '#ddedda',
  dew75: '#eef6ec',

  shark50: '#f8f7f8',

  grey50: '#f7f7f7',
  slate50: '#f5f7fa',
  slate100: '#f2f5f8',
  slate200: '#e1e4ea',
  slate300: '#cacfd8',
  slate500: '#717784',
  slate600: '#525866',
  slate700: '#2b303b',
  slate800: '#222530',
  slate900: '#181b25',
  grey700: '#333333',

  neutralChipBg: '#ffefcc', // Indicative/Neutral/100
  neutralChipText: '#624c18', // Indicative/Neutral/950

  // One-off values used literally in the design (not bound to variables).
  tableRemark: '#616673',
  floatingShadow: 'rgba(15,23,41,0.08)',
  floatingShadowSoft: 'rgba(15,23,41,0.04)',
  cardBorder: 'rgba(225,228,234,0.4)',
  tableBorder: 'rgba(225,228,234,0.5)',
} as const;
