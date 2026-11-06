/** Static content for the "Research note" screen. Sections live in ./sections. */
import { Block, Segment } from './types';

export type { Segment, Block, SectionStatus, SectionGroup, NoteSection } from './types';
export { sections } from './sections';

const t = (text: string, bold = false): Segment => ({ text, bold });

export const company = {
  name: 'Romsons Group Private Limited',
  /** Shown in the floating (scrolled) header. */
  shortName: 'Romsons Group',
};

export const noteTabs = ['Research note', 'IC memo', 'Benchmarking', 'Checklist'] as const;

export const assistant = {
  userMessage:
    'Summarise investment thesis: what it says, the numbers that matter, and what it rests on.',
  thought: ['Thought for 16 secs', '3 files', '6 sources'],
  answer: [
    {
      kind: 'paragraph',
      segments: [
        t(
          'Techfab is pitched as #1 organised player in a ~₹13,500 crore market growing ~9.0%, with FY25 revenue ₹593 crore and FY24 EBITDA margin 16.1%, and a ₹200 crore capex to double capacity.',
        ),
      ],
    },
    { kind: 'spacer' },
    { kind: 'paragraph', segments: [t('Here is what was found before the stop:', true)] },
    { kind: 'spacer' },
    {
      kind: 'bullet',
      segments: [
        t(
          'Thesis: #1 organised player in ~₹13,500 crore geosynthetics market growing ~9.0% CAGR; FY25 revenue ₹593 crore, FY24 EBITDA margin 16.1%; ₹200 crore capex to double capacity.',
        ),
      ],
    },
    { kind: 'spacer' },
    {
      kind: 'bullet',
      segments: [
        t(
          '2.6x MOIC / 21% IRR and peer margin benchmark of 20-23% carry no citation; entry 15.0x vs Garware 15.6x-23.5x.',
        ),
      ],
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
};
