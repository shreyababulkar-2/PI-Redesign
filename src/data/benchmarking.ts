import { companyLogos } from "../assets/images";

/** Static content for the Benchmarking page (Figma "Benchmarking - New", node 373:23715). Figures are examples. */

export const benchmarkAnalysis = {
  title: "Benchmarking analysis",
  counts: "2 Listed  •  20 Unlisted",
  link: "View full analysis",
  body: "The company boasts higher profit margins and a superior Return on Capital Employed (ROCE) compared to its peers, primarily due to the significant scale of its vaccine production. Despite these strengths, the company trails its peers on revenue growth and working capital efficiency.",
};

/** How a figure reads: red (down), green (up) or amber (flat). Shown as the figure's colour, with no arrow (Figma 829:2892). */
export type Trend = "down" | "up" | "flat";

export type Cell = { text: string; trend?: Trend };

/** Column groups, left to right (the company name column is separate and the actions column is fixed). */
export const benchmarkColumns = [
  {
    title: "Market cap",
    subs: [{ label: "As of 15th Mar \u201824", width: 111 }],
  },
  { title: "EV", subs: [{ label: "As of 15th Mar \u201824", width: 111 }] },
  {
    title: "Revenue",
    subs: [
      { label: "FY23", width: 74 },
      { label: "FY24", width: 74 },
    ],
  },
  {
    title: "Revenue CAGR",
    subs: [
      { label: "FY20-23", width: 74.7 },
      { label: "FY23-24", width: 74.7 },
      { label: "FY24-26E", width: 74.6 },
    ],
  },
  {
    title: "EBITDA margin",
    subs: [
      { label: "FY23", width: 74 },
      { label: "FY24", width: 74 },
    ],
  },
  {
    title: "ROCE",
    subs: [
      { label: "FY23", width: 74 },
      { label: "FY24", width: 74 },
    ],
  },
  {
    title: "Working capital",
    subs: [
      { label: "Debtor days", width: 88 },
      { label: "Inventory days", width: 96 },
    ],
  },
  {
    title: "Net debt / EBITDA",
    subs: [{ label: "As of FY24", width: 130 }],
  },
] as const;

export type Company = {
  name: string;
  /** Logo image and its corner radius in px (8 = a circle at the 16px size). */
  logo: { source: number; radius: number };
  /** One entry per leaf column, in order. */
  cells: Cell[];
};

const c = (text: string, trend?: Trend): Cell => ({ text, trend });

/**
 * Prototype figures for the comparison. Every company has its own set, in the same 14 columns as `benchmarkColumns`:
 * market cap and EV in ₹ Mn, then growth and margin percentages, working capital days and net debt / EBITDA. The
 * means and medians are worked out from the rows, so a column always adds up to what it says.
 */
type Raw = number[];
const RAW: Record<string, Raw> = {
  "Serum Institute Life": [1553, 1612, 8.1, 5.1, 8.4, 5.1, 7.6, 31.8, 32.9, 24.6, 26.1, 68, 112, 0.4],
  "Cipla": [2996, 2906, 11.4, 9.1, 13.2, 9.1, 10.5, 22.6, 24.3, 17.4, 18.9, 78, 134, 0.2],
  "Dabur India": [2263, 2285, 8.2, 6.5, 9.4, 6.5, 8.1, 19.8, 20.4, 22.1, 21.6, 38, 96, 0.1],
  "Zydus Wellness": [297, 311, 7.5, 12.3, 8.8, 12.3, 11.0, 17.2, 18.6, 9.4, 10.8, 29, 74, 0.5],
  "Marico": [1962, 1932, 9.1, 3.8, 10.4, 3.8, 7.2, 20.1, 20.8, 41.5, 43.2, 24, 63, 0.1],
  "Godrej Consumer Products": [3122, 3278, 10.6, 7.9, 11.8, 7.9, 9.6, 21.4, 22.6, 17.8, 19.3, 21, 55, 0.7],
  "Emami": [656, 646, 6.3, 9.8, 7.1, 9.8, 10.2, 27.6, 28.9, 29.7, 33.1, 31, 88, 0.2],
  "Gland Pharma": [857, 797, 14.5, 4.2, 16.3, 4.2, 9.8, 25.3, 22.7, 14.6, 12.1, 68, 171, 0.1],
  "Caplin Point Laboratories": [441, 401, 19.8, 15.6, 22.1, 15.6, 14.3, 28.4, 29.2, 23.5, 24.8, 95, 118, 0.1],
  "Venus Remedies": [48, 59, 5.2, 11.4, 6.8, 11.4, 12.5, 14.1, 15.3, 12.8, 14.2, 112, 143, 1.9],
};

/** Columns where a lower figure is the better one: working capital days and leverage. */
const LOWER_IS_BETTER = new Set([11, 12, 13]);

function format(col: number, v: number): string {
  if (col < 2 || col === 11 || col === 12) return Math.round(v).toLocaleString("en-US");
  if (col === 13) return `${v.toFixed(1)}x`;
  return `${v.toFixed(1)}%`;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** Each column's mean and median over a set of companies, formatted as the table shows them. */
function stats(names: string[]) {
  const cols = RAW["Serum Institute Life"].map((_, col) => names.map((n) => RAW[n][col]));
  return { mean: cols.map((xs, col) => format(col, mean(xs))), median: cols.map((xs, col) => format(col, median(xs))) };
}

/** A figure is green when it beats the set's mean by a margin, red when it trails by one, amber in between. */
function cellsOf(name: string, among: string[]): Cell[] {
  return RAW[name].map((v, col) => {
    const m = mean(among.map((n) => RAW[n][col]));
    const gap = (v - m) / Math.abs(m || 1);
    const good = LOWER_IS_BETTER.has(col) ? -gap : gap;
    return c(format(col, v), good > 0.04 ? "up" : good < -0.04 ? "down" : "flat");
  });
}

const PEERS = {
  otc: ["Cipla", "Dabur India", "Zydus Wellness"],
  bpc: ["Marico", "Godrej Consumer Products", "Emami"],
  injectables: ["Gland Pharma", "Caplin Point Laboratories", "Venus Remedies"],
};
const ALL_PEERS = [...PEERS.otc, ...PEERS.bpc, ...PEERS.injectables];

/** Placeholder logos: the design's three dummy company marks, handed round the peers in turn. */
const DUMMY_LOGOS = [
  { source: companyLogos.vitagenix, radius: 4 },
  { source: companyLogos.curetech, radius: 8 },
  { source: companyLogos.nextgen, radius: 8 },
];
const peer = (name: string, among: string[]): Company => ({
  name,
  logo: DUMMY_LOGOS[ALL_PEERS.indexOf(name) % DUMMY_LOGOS.length],
  cells: cellsOf(name, among),
});

/** The company the page is about, in the overall table, measured against every peer. */
export const overallCompany: Company = {
  name: "Serum Institute Life",
  logo: { source: companyLogos.serum, radius: 4 },
  cells: cellsOf("Serum Institute Life", ALL_PEERS),
};

export const overallStats = stats(ALL_PEERS);

export const categoryGroups = [
  { title: "OTC, Nutra and Pharma focus", names: PEERS.otc },
  { title: "BPC and home care focus", names: PEERS.bpc },
  { title: "Injectables focus", names: PEERS.injectables },
].map((g) => ({
  title: g.title,
  companies: g.names.map((n) => peer(n, g.names)),
  ...stats(g.names),
}));

/** Welcome content for the assistant while the Benchmarking tab is open (Figma 373:23805). */
export const benchmarkAssistant = {
  intro:
    "This is your benchmarking analysis, comparing performance against peers across key metrics, financial performance, operational efficiency, growth and market positioning.\n\nI can help you explore peer comparisons, identify performance gaps and surface insights from the benchmarking data.",
  heading: "What would you like to explore first?",
  suggestions: [
    "Summarise the benchmarking results",
    "How do we compare with our peers?",
    "Where are the biggest performance gaps?",
    "Which peers lead on key metrics?",
    "Where can we improve performance?",
  ],
  placeholder: "Ask a benchmarking question...",
};

/* ------------------------------------------------------------------ citations */

/**
 * Where a figure comes from (Figma "Benchmarking" with the Citations toggle on, 829:6550 / 829:8429 / 829:10779).
 * Every sourced cell carries a corner flag and, on hover, a card listing its sources. There are two cases:
 *  - the sources agree: the card says "Derived from N sources" and lists them (amber flag);
 *  - the sources disagree: each source reports its own figure and the card lists them side by side (red flag).
 * Sources are numbered like the note's citations (see `sourceFor`); these are all data room files. The assignment of
 * sources to cells is made up for the prototype.
 */
export type CellSource = {
  /** Citation number, which opens that source in the document viewer. */
  n: number;
  /** In the conflicting case, the figure this source gives. */
  value?: string;
};
export type CellCitation = { sources: CellSource[]; conflict: boolean };

export type TableId = "overall" | "category";
export type RowKind = "company" | "mean" | "median";

/** Data room files the benchmark figures are drawn from (numbers in `citations.ts`). */
const SOURCE_POOL = [2, 4, 8, 11, 18, 5];

/** A stable number from a few small integers, so the same cell always gets the same answer. */
const mix = (...xs: number[]) => xs.reduce((h, x) => (h * 31 + x * 17 + 7) % 997, 11);

/** The figures other sources report for the same cell: nearby values in the same format. */
function otherReadings(text: string, count: number): string[] {
  const m = text.match(/^([\d,]*\.?\d+)(.*)$/);
  if (!m) return Array.from({ length: count }, () => text);
  const base = parseFloat(m[1].replace(/,/g, ""));
  const decimals = (m[1].split(".")[1] ?? "").length;
  const fmt = (v: number) =>
    v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + m[2];
  const steps = [0.4, -0.3, 0.7];
  return Array.from({ length: count }, (_, i) => {
    const scale = Math.abs(base) >= 100 ? 0.012 : 1;       // large figures move by about 1%, percentages by tenths
    return fmt(base + (Math.abs(base) >= 100 ? base * scale * steps[i % 3] : steps[i % 3]));
  });
}

/** Cells whose sources disagree (kept to a few so the red flags stay rare, as in the design). */
const CONFLICTS: Record<TableId, (kind: RowKind, rowIndex: number, col: number) => boolean> = {
  overall: (kind, _r, col) => (kind === "mean" && col === 3) || (kind === "median" && col === 4),
  category: (kind, r, col) => (kind === "median" && r === 2 && col === 5) || (kind === "mean" && r === 3 && col === 8),
};

/**
 * The citation for one metric cell, or undefined when the figure is not sourced. Almost every cell is sourced;
 * about one in ten is left bare so the flags read as real data, not decoration.
 * `rowIndex` counts the table's rows from the first company or stat row (header and group titles excluded).
 */
export function cellCitation(
  table: TableId,
  kind: RowKind,
  rowIndex: number,
  col: number,
  text: string,
): CellCitation | undefined {
  const h = mix(table === "overall" ? 1 : 2, rowIndex, col);
  if (h % 10 === 0) return undefined;
  const conflict = CONFLICTS[table](kind, rowIndex, col);
  // A conflict is either two sources giving two figures (Figma 829:18458) or five giving three (Figma 889:4552).
  const three = conflict && h % 2 === 1;
  const count = conflict ? (three ? 5 : 2) : 2 + (h % 3);   // 2 to 4 sources, or 2 or 5 when they disagree
  const start = h % SOURCE_POOL.length;
  const numbers = Array.from({ length: count }, (_, i) => SOURCE_POOL[(start + i) % SOURCE_POOL.length]);
  if (!conflict) return { sources: numbers.map((n) => ({ n })), conflict: false };
  // The figure shown, and one or two others; with three figures the sources are spread so some have several.
  const figures = [text, ...otherReadings(text, three ? 2 : 1)];
  const spread = three ? [0, 1, 0, 2, 1] : [0, 1];
  return { sources: numbers.map((n, i) => ({ n, value: figures[spread[i]] })), conflict: true };
}

/** The sources behind a whole row (the flag on its row number), or undefined for a row nobody sourced. */
export function rowCitation(table: TableId, rowIndex: number): CellSource[] | undefined {
  const h = mix(table === "overall" ? 3 : 4, rowIndex);
  // Roughly one row in three, with the first company row of each table always sourced.
  if (rowIndex !== 0 && h % 3 !== 0) return undefined;
  const count = 3 + (h % 2);                                // 3 or 4 sources
  return Array.from({ length: count }, (_, i) => ({ n: SOURCE_POOL[(h + i) % SOURCE_POOL.length] }));
}
