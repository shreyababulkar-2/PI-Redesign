/** Static content for the "Research note" screen. Sections live in ./sections. */
import { Block, Segment } from './types';

export type { Segment, Block, SectionStatus, SectionGroup, NoteSection } from './types';
export { sections } from './sections';

const t = (text: string, bold = false): Segment => ({ text, bold });

export const company = {
  name: 'Romsons Group Private Limited',
  /** Shown in the floating (scrolled) header. */
  shortName: 'Romsons Group',
  /** Deal stage, shown as a chip next to the name. */
  stage: 'Stage 2',
};

export const noteTabs = ['Research note', 'IC memo', 'Benchmarking', 'Checklist', 'Data Room'] as const;

export const assistant = {
  userMessage:
    'Summarise investment thesis: what it says, the numbers that matter, and what it rests on.',
  thought: ['Thought for 16 secs', '3 files', '6 sources'],
  answer: [
    {
      kind: 'paragraph',
      marginBottom: 16,
      segments: [
        t('Techfab is pitched as '),
        t('#1 organised player', true),
        t(' in a '),
        t('~₹13,500 crore', true),
        t(' market growing '),
        t('~9.0%', true),
        t(', with FY25 revenue '),
        t('₹593 crore', true),
        t(', FY24 EBITDA margin '),
        t('16.1%', true),
        t(', and a '),
        t('₹200 crore', true),
        t(' capex to double capacity.'),
      ],
    },
    { kind: 'paragraph', marginBottom: 8, segments: [t('Here is what was found before the stop:', true)] },
    {
      kind: 'bullet',
      marginBottom: 6,
      segments: [t('Thesis: ', true), t('#1 organised player in a ~₹13,500 crore geosynthetics market, growing ~9.0% CAGR.')],
    },
    {
      kind: 'bullet',
      marginBottom: 6,
      segments: [t('Financials: ', true), t('FY25 revenue ₹593 crore; FY24 EBITDA margin 16.1%.')],
    },
    {
      kind: 'bullet',
      marginBottom: 6,
      segments: [t('Capex: ', true), t('₹200 crore to double capacity.')],
    },
    {
      kind: 'bullet',
      marginBottom: 6,
      segments: [t('Uncited: ', true), t('2.6x MOIC / 21% IRR and the peer margin benchmark of 20–23% carry no citation.')],
    },
    {
      kind: 'bullet',
      segments: [t('Valuation: ', true), t('entry at 15.0x vs Garware at 15.6x–23.5x.')],
    },
  ] satisfies Block[],
  tableTitle: 'Investment analysis',
  table: {
    columns: ['Metric', 'Value', 'Remark'],
    rows: [
      { metric: 'Market size', value: '₹13,500 cr', remark: '~9.0% CAGR;\n#1 organised player' },
      { metric: 'FY25 revenue', value: '₹593 cr', remark: '—' },
      { metric: 'FY24 EBITDA\nmargin', value: '16.1%', remark: 'Peer 20–23% (uncited)' },
      { metric: 'Capex', value: '₹200 cr', remark: 'To double capacity' },
      { metric: 'Returns', value: '~2.6x MOIC', remark: '—' },
    ],
  },
  composerPlaceholder: 'Ask a follow up question...',
  /** Empty state (Figma "Smart assist - default"). */
  welcome: {
    intro:
      'This is your Investment Committee (IC) Research Note, comprising 12 sections covering the investment opportunity, market landscape, financial performance, growth outlook, benchmarking and key risks.\n\nI\'ve reviewed the materials and can help you navigate the research, surface key insights and answer questions across the note.',
    heading: 'What would you like to explore first?',
    suggestions: [
      'Summarise the investment opportunity',
      'What are the key growth drivers?',
      'Highlight the key risks and red flags',
      'What does the benchmarking analysis reveal?',
      'What has changed across the deal materials…',
    ],
  },
  /** Steps shown while the answer is being worked out (Figma "Answer generating"). */
  thoughtSteps: [
    { label: 'Reading your question', time: '23s' },
    { label: 'Reading investment thesis', time: '23s' },
    { label: 'Searched the web', time: '21s', expandable: true },
    { label: 'Looking through all the deal\u2019s materials', time: '53s', expandable: true },
    { label: 'Assessed the deal materials thoroughly', time: '23s' },
  ],
  /** Files the "data room" button attaches in this prototype (Figma shows the first plus "+2 files"). */
  dataRoomFiles: ['Investment thesis.pdf', 'Cap table.xlsx', 'Management deck.pdf'],
  chart: {
    title: 'Revenue trend analysis',
    cardTitle: 'Annual revenue trend',
    subtitle: 'Illustrative example data \u2014 FY20 to FY24 (\u20b9 crore)',
    legend: 'Revenue',
    footnote: 'All figures are illustrative and not attributed to any real company.',
    points: [
      { label: 'FY20', value: 320 },
      { label: 'FY21', value: 397 },
      { label: 'FY22', value: 492 },
      { label: 'FY23', value: 558 },
      { label: 'FY24', value: 680 },
    ],
  },
};
