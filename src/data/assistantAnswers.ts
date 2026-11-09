/**
 * Prototype answers for the assistant. Each suggested question (and a few keywords) maps to a written
 * answer, optionally followed by a table or the revenue chart. Figures come from the Figma frames
 * (the Techfab thesis in "Smart assist" and the Benchmarking page) and from the research note itself.
 */
import { Block, Segment } from "./types";
import { assistant } from "./researchNote";

const t = (text: string, bold = false): Segment => ({ text, bold });
const p = (marginBottom: number, ...segments: Segment[]): Block => ({
  kind: "paragraph",
  marginBottom,
  segments,
});
const bullet = (label: string, text: string, marginBottom = 6): Block => ({
  kind: "bullet",
  marginBottom,
  segments: [t(`${label} `, true), t(text)],
});

export type AnswerTableSpec = {
  title: string;
  columns: string[];
  rows: string[][];
  /** Fixed pixel width per column, `null` for the one that takes the rest. */
  widths: (number | null)[];
  /** Columns shown in the lighter "remark" colour. */
  muted?: number[];
};

export type ThoughtStepSpec = { label: string; expandable?: boolean };

export type AnswerContent = {
  blocks: Block[];
  table?: AnswerTableSpec;
  chart?: boolean;
};

export type AnswerId =
  | "thesis"
  | "growth"
  | "risks"
  | "benchmark"
  | "changes"
  | "capex"
  | "general"
  | "compete"
  | "cash"
  | "exit"
  | "management"
  | "regulatory";

export const answers: Record<AnswerId, AnswerContent> = {
  thesis: {
    blocks: assistant.answer,
    table: {
      title: assistant.tableTitle,
      columns: assistant.table.columns,
      rows: assistant.table.rows.map((r) => [r.metric, r.value, r.remark]),
      widths: [90, 80, null],
      muted: [2],
    },
  },

  growth: {
    blocks: [
      p(
        12,
        t(
          "Growth rests on three drivers. The revenue trend below uses illustrative data from the materials.",
        ),
      ),
      p(8, t("What drives it:", true)),
      bullet(
        "Capacity:",
        "the ₹200 crore capex is meant to double capacity, which is the main lever on volume.",
      ),
      bullet(
        "Market:",
        "a ~₹13,500 crore market growing ~9.0% a year, where Techfab is pitched as the #1 organised player.",
      ),
      bullet(
        "Organised share:",
        "the case assumes the market keeps shifting from unorganised to organised suppliers. The materials assert this but do not source it.",
        0,
      ),
    ],
    chart: true,
  },

  risks: {
    blocks: [
      p(
        12,
        t(
          "The main red flags are unsupported return figures and a margin gap to peers that the materials do not explain.",
        ),
      ),
      p(8, t("Where to look first:", true)),
      bullet(
        "Uncited returns:",
        "2.6x MOIC and 21% IRR carry no citation, so treat them as unverified.",
      ),
      bullet(
        "Margin gap:",
        "FY24 EBITDA margin of 16.1% sits below the 20–23% peer benchmark, which is itself uncited.",
      ),
      bullet(
        "Capex execution:",
        "doubling capacity for ₹200 crore assumes a utilisation level that is not shown.",
      ),
      bullet(
        "Valuation:",
        "entry at 15.0x is below Garware at 15.6x–23.5x, so the discount needs an explanation.",
        0,
      ),
    ],
    table: {
      title: "Red flags",
      columns: ["Area", "Issue", "Priority"],
      rows: [
        ["Returns", "No source for 2.6x MOIC / 21% IRR", "High"],
        ["Margins", "16.1% vs 20–23% peers (uncited)", "High"],
        ["Capex", "Utilisation assumption not stated", "Medium"],
        ["Valuation", "15.0x vs 15.6x–23.5x peers", "Medium"],
      ],
      widths: [74, null, 68],
      muted: [1],
    },
  },

  benchmark: {
    blocks: [
      p(
        12,
        t(
          "Against its listed peer set the company sits in the middle of the range rather than clearly ahead.",
        ),
      ),
      bullet(
        "Valuation:",
        "market cap of 1,553 is above the peer mean (1,443) but below the median (1,763). EV of 2,453 is above the mean (2,083) and just under the median (2,553).",
      ),
      bullet(
        "Growth:",
        "FY20–23 revenue CAGR of 35.6% is slightly below the mean (36.3%) and the median (37.8%), and FY23–24 growth of 9.0% trails the 10.3% mean.",
      ),
      bullet(
        "Caveat:",
        "figures are as of 15th Mar ‘24, and the peer set spans OTC / nutra and BPC / home care names, so read the medians with care.",
        0,
      ),
    ],
    table: {
      title: "Trading comparables",
      columns: ["Company", "Market cap", "EV", "Revenue CAGR\nFY20–23"],
      rows: [
        ["Serum Institute Life", "1,553", "2,453", "35.6%"],
        ["VitaGenix Biotech Corp", "1,553", "2,453", "35.6%"],
        ["CureTech Pharmaceuticals Inc", "2,543", "2,234", "32.3%"],
        ["NextGen BioSolutions Ltd", "1,863", "1,563", "37.8%"],
        ["All companies: Mean", "1,443", "2,083", "36.3%"],
        ["All companies: Median", "1,763", "2,553", "37.8%"],
      ],
      widths: [118, 66, 50, null],
    },
  },

  changes: {
    blocks: [
      p(
        12,
        t(
          "Five of the eleven sections are vetted. The rest are still open, and the version numbers show where the work has been.",
        ),
      ),
      bullet("Most revised:", "Company overview is on v10 and vetted."),
      bullet(
        "Still unvetted:",
        "Background checks (v4), Key risks (v2) and Financial analysis (v2) have been revised but not signed off.",
      ),
      bullet(
        "Newest sections:",
        "Benchmarking and Valuation and returns are on v1 and unvetted, so their figures should not be relied on yet.",
      ),
      bullet("Unchanged gap:", "2.6x MOIC / 21% IRR still has no citation.", 0),
    ],
  },

  capex: {
    blocks: [
      p(
        12,
        t(
          "The materials do not state the utilisation the ₹200 crore capex assumes. I could not find a figure in the three files I reviewed.",
        ),
      ),
      bullet(
        "What is stated:",
        "₹200 crore of capex, intended to double capacity.",
      ),
      bullet(
        "What is missing:",
        "the utilisation rate, the ramp-up timeline and how the spend is phased.",
      ),
      bullet(
        "Suggested follow-up:",
        "ask management for plant-level utilisation and the capex phasing, and tie the 2.6x MOIC case to them.",
        0,
      ),
    ],
  },

  general: {
    blocks: [
      p(
        12,
        t(
          "I could not find a direct answer to that in the three files and six sources I reviewed. This is what the materials do cover:",
        ),
      ),
      bullet(
        "Thesis:",
        "#1 organised player in a ~₹13,500 crore market growing ~9.0% CAGR.",
      ),
      bullet(
        "Financials:",
        "FY25 revenue ₹593 crore; FY24 EBITDA margin 16.1%.",
      ),
      bullet(
        "Open items:",
        "returns and the peer margin benchmark are uncited, and capex utilisation is not stated.",
        12,
      ),
      p(
        0,
        t(
          "You can also ask about growth drivers, key risks or the benchmarking analysis.",
        ),
      ),
    ],
  },

  // ── Dummy text-only replies for typed questions ─────────────────────────────────────────────────

  compete: {
    blocks: [
      p(
        12,
        t(
          "The materials position Techfab as the #1 organised player in a ~₹13,500 crore market, but they say little about how it wins against others.",
        ),
      ),
      bullet(
        "Position:",
        "the #1 claim is made for the organised segment only; share of the whole market is not given.",
      ),
      bullet(
        "Closest peer:",
        "Garware is the main listed comparison, used for valuation (15.6x–23.5x) rather than for market share.",
      ),
      bullet(
        "Gap:",
        "there is no pricing, customer-overlap or capacity comparison, so the competitive moat is asserted rather than shown.",
        0,
      ),
    ],
  },

  cash: {
    blocks: [
      p(
        12,
        t(
          "The materials do not include a cash-flow statement or working-capital days, so I cannot say how much EBITDA turns into cash.",
        ),
      ),
      bullet(
        "What is stated:",
        "FY25 revenue of ₹593 crore and an FY24 EBITDA margin of 16.1%.",
      ),
      bullet(
        "What is missing:",
        "receivable and inventory days, capex phasing and debt, all of which drive free cash flow.",
      ),
      bullet(
        "Why it matters:",
        "the ₹200 crore capex plan makes the cash profile central to the returns case.",
        0,
      ),
    ],
  },

  exit: {
    blocks: [
      p(
        12,
        t(
          "The case implies about 2.6x MOIC and a 21% IRR, but the materials do not describe an exit route or timeline.",
        ),
      ),
      bullet(
        "Returns:",
        "2.6x MOIC / 21% IRR are quoted without a source or the assumptions behind them.",
      ),
      bullet(
        "Exit:",
        "no IPO, strategic sale or secondary route is named, and the holding period is not stated.",
      ),
      bullet(
        "Next step:",
        "ask for the returns model so the multiple and the exit year can be checked against the 15.0x entry.",
        0,
      ),
    ],
  },

  management: {
    blocks: [
      p(
        12,
        t(
          "The materials say very little about the management team or governance, so there is not much to assess yet.",
        ),
      ),
      bullet(
        "Not covered:",
        "leadership backgrounds, tenure, promoter holding and board composition.",
      ),
      bullet(
        "Suggested checks:",
        "reference calls with senior executives, related-party transactions and key-person dependency.",
        0,
      ),
    ],
  },

  regulatory: {
    blocks: [
      p(
        12,
        t(
          "Regulatory and compliance matters are not covered in the files I reviewed.",
        ),
      ),
      bullet(
        "Not covered:",
        "licences and approvals, environmental or safety compliance, and any open notices or disputes.",
      ),
      bullet(
        "Suggested checks:",
        "plant inspection history, tax and litigation notices, and the status of the licences the capacity expansion depends on.",
        0,
      ),
    ],
  },
};

/** Which answer a question gets: a suggested question, or the nearest topic by keyword. */
export function answerIdFor(question: string): AnswerId {
  const q = question.toLowerCase();
  if (/capex|utilis|utiliz/.test(q)) return "capex";
  if (/risk|red flag|concern|worr/.test(q)) return "risks";
  if (/growth|driver|trend|revenue/.test(q)) return "growth";
  if (/benchmark|valuation multiple/.test(q)) return "benchmark";
  if (/compet|market share|moat|rival/.test(q)) return "compete";
  if (/cash|working capital|receivable|debt|leverage/.test(q)) return "cash";
  if (/exit|moic|irr|return|ipo/.test(q)) return "exit";
  if (/manage|governance|promoter|board|team/.test(q)) return "management";
  if (/regulat|esg|compliance|licen|litigation/.test(q)) return "regulatory";
  if (/chang|updat|version|material/.test(q)) return "changes";
  if (/summar|thesis|opportunity|numbers|overview/.test(q)) return "thesis";
  // Anything else gets one of the dummy replies, picked from the text so the same question always gets
  // the same answer but different questions vary.
  const pool: AnswerId[] = [
    "general",
    "compete",
    "cash",
    "exit",
    "management",
    "regulatory",
  ];
  let hash = 0;
  for (const ch of q) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[hash % pool.length];
}

/** What the assistant "did" before answering, shown in the thinking steps. */
export type Thinking = {
  steps: ThoughtStepSpec[];
  files: number;
  sources: number;
};

const read = (): ThoughtStepSpec => ({ label: "Reading your question" });
const step = (label: string, expandable = false): ThoughtStepSpec => ({
  label,
  expandable,
});

export const thinking: Record<AnswerId, Thinking> = {
  thesis: {
    files: 3,
    sources: 6,
    steps: [
      read(),
      step("Opening Investment thesis.pdf"),
      step("Pulling market size, revenue and margin figures"),
      step("Checking the figures against the research note", true),
      step("Drafting a summary around the numbers that matter"),
    ],
  },
  growth: {
    files: 2,
    sources: 5,
    steps: [
      read(),
      step("Reviewing revenue from FY20 to FY25"),
      step("Looking through the capacity and capex plans", true),
      step("Searching the web for market growth data", true),
      step("Ranking the growth drivers"),
    ],
  },
  risks: {
    files: 3,
    sources: 4,
    steps: [
      read(),
      step("Scanning the thesis for unsupported claims"),
      step("Checking returns and margins for citations"),
      step("Comparing the entry multiple with listed peers", true),
      step("Ranking the red flags by priority"),
    ],
  },
  benchmark: {
    files: 2,
    sources: 3,
    steps: [
      read(),
      step("Opening the Benchmarking page"),
      step("Comparing market cap, EV and revenue CAGR with peers", true),
      step("Working out the mean and median for the peer set"),
      step("Writing up how the company compares"),
    ],
  },
  changes: {
    files: 1,
    sources: 1,
    steps: [
      read(),
      step("Listing every section of the research note"),
      step("Checking the vetting status and version of each"),
      step("Comparing versions across sections"),
      step("Summarising what is still open"),
    ],
  },
  capex: {
    files: 3,
    sources: 2,
    steps: [
      read(),
      step("Searching the filings for capex utilisation"),
      step("Looking through all the deal’s materials", true),
      step("No utilisation figure found"),
      step("Working out what to ask management"),
    ],
  },
  general: {
    files: 3,
    sources: 6,
    steps: [
      read(),
      step("Searching the deal materials for a direct answer", true),
      step("Checking the research note sections"),
      step("Finding the closest related figures"),
      step("Putting together what the materials do cover"),
    ],
  },
  compete: {
    files: 2,
    sources: 4,
    steps: [
      read(),
      step("Looking for market share and positioning data"),
      step("Searching the web for the competitive landscape", true),
      step("Comparing with the closest listed peer"),
      step("Noting what the materials leave out"),
    ],
  },
  cash: {
    files: 3,
    sources: 2,
    steps: [
      read(),
      step("Looking for cash flow and working capital data"),
      step("Checking the financial statements in the data room", true),
      step("Pulling the revenue and margin figures that are given"),
      step("Listing what is missing"),
    ],
  },
  exit: {
    files: 2,
    sources: 3,
    steps: [
      read(),
      step("Reading the returns section"),
      step("Checking where the 2.6x MOIC and 21% IRR come from"),
      step("Looking for an exit route or timeline", true),
      step("Drafting the next steps"),
    ],
  },
  management: {
    files: 3,
    sources: 3,
    steps: [
      read(),
      step("Searching the materials for management and governance"),
      step("Looking through all the deal’s materials", true),
      step("Noting what is not covered"),
      step("Suggesting diligence checks"),
    ],
  },
  regulatory: {
    files: 3,
    sources: 3,
    steps: [
      read(),
      step("Searching the materials for licences and compliance"),
      step("Checking the filings for notices or disputes", true),
      step("Noting what is not covered"),
      step("Suggesting diligence checks"),
    ],
  },
};
