/** Static content for the Benchmarking page (Figma "Benchmarking - New", node 373:23715). Figures are examples. */

export const benchmarkAnalysis = {
  title: 'Benchmarking analysis',
  counts: '2 Listed  •  20 Unlisted',
  link: 'View full analysis',
  body: 'The company boasts higher profit margins and a superior Return on Capital Employed (ROCE) compared to its peers, primarily due to the significant scale of its vaccine production. Despite these strengths, the company trails its peers on revenue growth and working capital efficiency.',
};

/** Trend marker beside a figure: red down arrow, green up arrow, amber "approximately". */
export type Trend = 'down' | 'up' | 'flat';

export type Cell = { text: string; trend?: Trend };

/** Column groups, left to right (the company name column is separate and the actions column is fixed). */
export const benchmarkColumns = [
  { title: 'Market cap', subs: [{ label: 'As of 15th Mar \u201824', width: 111 }] },
  { title: 'EV', subs: [{ label: 'As of 15th Mar \u201824', width: 111 }] },
  {
    title: 'Revenue',
    subs: [
      { label: 'FY23', width: 74 },
      { label: 'FY24', width: 74 },
    ],
  },
  {
    title: 'Revenue CAGR',
    subs: [
      { label: 'FY20-23', width: 74.7 },
      { label: 'FY23-24', width: 74.7 },
      { label: 'FY24-26E', width: 74.6 },
    ],
  },
] as const;

export type Company = {
  name: string;
  /** Logo disc: background colour and a one-letter mark (the real logos are not in the prototype). */
  logo: { bg: string; fg: string; mark: string };
  /** One entry per leaf column, in order. */
  cells: Cell[];
  /** Shows the red "new note" dot on the notes icon. */
  note?: boolean;
};

const c = (text: string, trend?: Trend): Cell => ({ text, trend });

export const overallCompany: Company = {
  name: 'Serum Institute Life',
  logo: { bg: '#e8eefb', fg: '#3a5bbf', mark: 'S' },
  cells: [c('1,553', 'down'), c('1,553', 'down'), c('28.6%', 'up'), c('9.0%', 'up'), c('28.6%', 'up'), c('9.0%', 'up'), c('9.0%', 'up')],
};

export const overallStats = {
  mean: ['1,443', '2,083', '23.7%', '10.3%', '36.3%', '16.1%', '16.1%'],
  median: ['1,763', '2,553', '24.9%', '9.4%', '37.8%', '15.3%', '15.3%'],
};

const vita: Company = {
  name: 'VitaGenix Biotech Corp',
  logo: { bg: '#2fd4b4', fg: '#ffffff', mark: 'V' },
  cells: [c('1,553', 'down'), c('2,453', 'down'), c('26.4%', 'up'), c('9.0%', 'up'), c('35.6%', 'flat'), c('9.2%', 'up'), c('35.6%', 'flat')],
  note: true,
};
const cure: Company = {
  name: 'CureTech Pharmaceuticals Inc',
  logo: { bg: '#1e7cf2', fg: '#ffffff', mark: 'C' },
  cells: [c('2,543', 'down'), c('2,234', 'down'), c('28.6%', 'up'), c('9.5%', 'up'), c('32.3%', 'flat'), c('8.5%', 'up'), c('33.6%', 'flat')],
};
const next: Company = {
  name: 'NextGen BioSolutions Ltd',
  logo: { bg: '#8a6a4f', fg: '#ffffff', mark: 'N' },
  cells: [c('1,863', 'down'), c('1,563', 'down'), c('30.2%', 'up'), c('10.0%', 'up'), c('37.8%', 'flat'), c('10.0%', 'up'), c('34.7%', 'flat')],
  note: true,
};

export const categoryGroups = [
  {
    title: 'OTC, Nutra and Pharma focus',
    companies: [vita, cure, next],
    mean: ['1,443', '1,802', '28.6%', '9.0%', '35.6%', '9.1%', '30.4%'],
    median: ['1,842', '2,473', '30.6%', '10.0%', '37.6%', '16.1%', '33.4%'],
  },
  {
    title: 'BPC and home care focus',
    companies: [vita, cure, next].map((x) => ({ ...x, note: false })),
    mean: ['1,443', '1,802', '28.6%', '9.0%', '35.6%', '9.1%', '30.4%'],
    median: ['1,842', '2,473', '30.6%', '10.0%', '37.6%', '16.1%', '33.4%'],
  },
  {
    title: 'Injectables focus',
    companies: [vita, cure, next].map((x) => ({ ...x, note: false })),
    mean: ['1,443', '1,802', '28.6%', '9.0%', '35.6%', '9.1%', '30.4%'],
    median: ['1,842', '2,473', '30.6%', '10.0%', '37.6%', '16.1%', '33.4%'],
  },
];

/** Welcome content for the assistant while the Benchmarking tab is open (Figma 373:23805). */
export const benchmarkAssistant = {
  intro:
    'This is your benchmarking analysis, comparing performance against peers across key metrics, financial performance, operational efficiency, growth and market positioning.\n\nI can help you explore peer comparisons, identify performance gaps and surface insights from the benchmarking data.',
  heading: 'What would you like to explore first?',
  suggestions: [
    'Summarise the benchmarking results',
    'How do we compare with our peers?',
    'Where are the biggest performance gaps?',
    'Which peers lead on key metrics?',
    'Where can we improve performance?',
  ],
  placeholder: 'Ask a benchmarking question...',
};
