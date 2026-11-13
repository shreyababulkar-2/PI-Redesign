import { companyLogos } from "../assets/images";

/** Static content for the Benchmarking page (Figma "Benchmarking - New", node 373:23715). Figures are examples. */

export const benchmarkAnalysis = {
  title: "Benchmarking analysis",
  counts: "2 Listed  •  20 Unlisted",
  link: "View full analysis",
  body: "The company boasts higher profit margins and a superior Return on Capital Employed (ROCE) compared to its peers, primarily due to the significant scale of its vaccine production. Despite these strengths, the company trails its peers on revenue growth and working capital efficiency.",
};

/** Trend marker beside a figure: red down arrow, green up arrow, amber "approximately". */
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

export const overallCompany: Company = {
  name: "Serum Institute Life",
  logo: { source: companyLogos.serum, radius: 8 },
  cells: [
    c("1,553", "down"),
    c("1,553", "down"),
    c("28.6%", "up"),
    c("9.0%", "up"),
    c("28.6%", "up"),
    c("9.0%", "up"),
    c("9.0%", "up"),
    c("31.4%", "up"),
    c("33.2%", "up"),
    c("24.8%", "up"),
    c("26.1%", "up"),
    c("62", "down"),
    c("118", "down"),
    c("0.4x", "down"),
  ],
};

export const overallStats = {
  mean: [
    "1,443",
    "2,083",
    "23.7%",
    "10.3%",
    "36.3%",
    "16.1%",
    "16.1%",
    "27.9%",
    "29.4%",
    "21.6%",
    "22.3%",
    "71",
    "126",
    "0.9x",
  ],
  median: [
    "1,763",
    "2,553",
    "24.9%",
    "9.4%",
    "37.8%",
    "15.3%",
    "15.3%",
    "28.6%",
    "30.1%",
    "22.4%",
    "23.0%",
    "68",
    "121",
    "0.8x",
  ],
};

/** Peer figures as drawn in Figma (499:16408): every peer row shows the same example values. */
const peerCells = [
  c("1,553", "down"),
  c("1,553", "down"),
  c("28.6%", "up"),
  c("9.0%", "up"),
  c("35.6%", "flat"),
  c("9.0%", "up"),
  c("35.6%", "flat"),
  c("26.8%", "up"),
  c("27.5%", "up"),
  c("19.2%", "flat"),
  c("20.4%", "up"),
  c("74", "down"),
  c("131", "down"),
  c("1.1x", "flat"),
];

const vita: Company = {
  name: "VitaGenix Biotech Corp",
  logo: { source: companyLogos.vitagenix, radius: 4 },
  cells: peerCells,
};
const cure: Company = {
  name: "CureTech Pharmaceuticals Inc",
  logo: { source: companyLogos.curetech, radius: 8 },
  cells: peerCells,
};
const next: Company = {
  name: "NextGen BioSolutions Ltd",
  logo: { source: companyLogos.nextgen, radius: 8 },
  cells: peerCells,
};

export const categoryGroups = [
  {
    title: "OTC, Nutra and Pharma focus",
    companies: [vita, cure, next],
    mean: [
      "1,443",
      "1,802",
      "28.6%",
      "9.0%",
      "35.6%",
      "9.1%",
      "30.4%",
      "26.8%",
      "27.5%",
      "19.2%",
      "20.4%",
      "74",
      "131",
      "1.1x",
    ],
    median: [
      "1,842",
      "2,473",
      "30.6%",
      "10.0%",
      "37.6%",
      "16.1%",
      "33.4%",
      "27.2%",
      "28.0%",
      "20.1%",
      "21.0%",
      "70",
      "126",
      "1.0x",
    ],
  },
  {
    title: "BPC and home care focus",
    companies: [vita, cure, next],
    mean: [
      "1,443",
      "1,802",
      "28.6%",
      "9.0%",
      "35.6%",
      "9.1%",
      "30.4%",
      "26.8%",
      "27.5%",
      "19.2%",
      "20.4%",
      "74",
      "131",
      "1.1x",
    ],
    median: [
      "1,842",
      "2,473",
      "30.6%",
      "10.0%",
      "37.6%",
      "16.1%",
      "33.4%",
      "27.2%",
      "28.0%",
      "20.1%",
      "21.0%",
      "70",
      "126",
      "1.0x",
    ],
  },
  {
    title: "Injectables focus",
    companies: [vita, cure, next],
    mean: [
      "1,443",
      "1,802",
      "28.6%",
      "9.0%",
      "35.6%",
      "9.1%",
      "30.4%",
      "26.8%",
      "27.5%",
      "19.2%",
      "20.4%",
      "74",
      "131",
      "1.1x",
    ],
    median: [
      "1,842",
      "2,473",
      "30.6%",
      "10.0%",
      "37.6%",
      "16.1%",
      "33.4%",
      "27.2%",
      "28.0%",
      "20.1%",
      "21.0%",
      "70",
      "126",
      "1.0x",
    ],
  },
];

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
