/**
 * The shareholder register behind source 8 (RP_HLDGPOSI_APIALL_Holding): the long, wide sheet a data provider's
 * shareholding export really is: ~140 holders with folio / DP id, voting rights, pledges and the date of the last
 * change. Prototype data, built deterministically so the grid is the same on every load. The first six holders and
 * the rows above them keep their positions, because the cited ranges point at them.
 */
import type { SheetCell, SheetData } from "./workbooks";

const TOTAL_SHARES = 22_880_000;

/** A small seeded generator, so the "random" holders never change between loads. */
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (n: number) => `${((n / TOTAL_SHARES) * 100).toFixed(2)}%`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Holder = { name: string; category: string; shares: number };

// The anchor holders, as in the original sheet.
const ANCHORS: Holder[] = [
  { name: "Romsons Family Holdings LLP", category: "Promoter group", shares: 9_420_000 },
  { name: "Rajiv Sharma", category: "Promoter", shares: 3_180_000 },
  { name: "Anita Sharma", category: "Promoter", shares: 2_150_000 },
  { name: "Sharma Family Trust", category: "Promoter group", shares: 1_840_000 },
  {
    name: "Jongsong Investments Pte. Ltd. (Temasek Holdings subsidiary)",
    category: "Investor, minority",
    shares: 3_270_000,
  },
  { name: "Romsons ESOP Trust", category: "Employee trust", shares: 760_000 },
];

const INSTITUTIONS = [
  "Bharat Growth Fund", "Himalaya Equity LLP", "Deccan Capital Advisors", "Konkan Opportunities Fund",
  "Narmada Value Partners", "Sahyadri Mutual Fund", "Gangetic Life Insurance", "Vindhya Pension Trust",
  "Malabar Healthcare Fund", "Aravali Small Cap Fund", "Kaveri Asset Management", "Nilgiri Equity Fund",
  "Tapi Securities Pvt. Ltd.", "Brahmaputra Investments", "Sutlej Wealth Partners", "Chambal Growth Trust",
  "Pinnacle Healthcare Opportunities", "Orchid Emerging Markets Fund", "Lotus Global Equity Fund",
  "Everest Capital (FPI)", "Saffron Insurance Co.", "Coromandel Family Office", "Zenith Staff Provident Fund",
  "Rann Value Fund", "Meghna Capital Advisors", "Yamuna Fixed Maturity Trust", "Hooghly Retail Fund",
  "Periyar Equity Savings Fund",
];
const FIRST = [
  "Rekha", "Suresh", "Meera", "Ishaan", "Kabir", "Manish", "Priya", "Arjun", "Neha", "Vikram", "Sunita", "Rahul",
  "Divya", "Amit", "Kavita", "Sanjay", "Pooja", "Rohan", "Anjali", "Deepak", "Shalini", "Naveen", "Lata", "Harish",
  "Tanvi", "Gaurav", "Swati", "Mohan", "Nisha", "Karthik",
];
const LAST = [
  "Desai", "Pillai", "Iyer", "Chopra", "Gupta", "Nair", "Mehta", "Reddy", "Joshi", "Kulkarni", "Bose", "Banerjee",
  "Menon", "Shetty", "Agarwal", "Kapoor", "Malhotra", "Bhatt", "Rao", "Sethi",
];

function build(): Holder[] {
  const rnd = lcg(2023);
  const rest: Holder[] = [];
  INSTITUTIONS.forEach((name, i) => {
    const category = /Insurance|Pension|Provident/.test(name)
      ? "Insurance / pension"
      : /Mutual|Fund|Trust/.test(name) && !/Family/.test(name)
        ? "Institution"
        : /\(FPI\)|Global|Emerging/.test(name)
          ? "Foreign portfolio investor"
          : "Institution";
    rest.push({ name, category, shares: 0 });
    void i;
  });
  const people = 112;
  for (let i = 0; i < people; i++) {
    const name = `${FIRST[Math.floor(rnd() * FIRST.length)]} ${LAST[Math.floor(rnd() * LAST.length)]}`;
    rest.push({ name, category: "Public", shares: 0 });
  }
  // Institutions hold much bigger lines than individuals; scale the weights to fill what the anchors leave.
  const weights = rest.map((h, i) => (i < INSTITUTIONS.length ? 8 + rnd() * 40 : 1 + rnd() * 3));
  const remainder = TOTAL_SHARES - ANCHORS.reduce((s, h) => s + h.shares, 0);
  const sum = weights.reduce((s, w) => s + w, 0);
  let used = 0;
  rest.forEach((h, i) => {
    h.shares = i === rest.length - 1 ? remainder - used : Math.max(500, Math.round((weights[i] / sum) * remainder / 100) * 100);
    used += h.shares;
  });
  // Rounding can leave the last line odd or negative; fold any difference back into the largest institution.
  const drift = remainder - rest.reduce((s, h) => s + h.shares, 0);
  rest[0].shares += drift;
  const inst = rest.filter((h) => h.category !== "Public").sort((a, b) => b.shares - a.shares);
  const pub = rest.filter((h) => h.category === "Public").sort((a, b) => b.shares - a.shares);
  return [...ANCHORS, ...inst, ...pub];
}

const cell = (v: string, extra: Partial<SheetCell> = {}): SheetCell => ({ v, ...extra });
const right = (v: string, bold = false): SheetCell => ({ v, align: "right", bold: bold || undefined });

function buildSheet(): SheetData {
  const holders = build();
  const rnd = lcg(77);
  const blank = (n: number) => Array.from({ length: n }, () => cell(""));
  const COLS = 10;
  const rows: SheetCell[][] = [
    [cell(""), cell("Romsons Group Private Limited", { bold: true }), ...blank(COLS - 2)],
    [cell(""), cell("Industry classification: Health Care Equipment & Supplies"), ...blank(COLS - 2)],
    [cell(""), cell("Shareholding as on 30-Sep-2023"), ...blank(COLS - 2)],
    blank(COLS),
    [
      cell("Sr."),
      cell("Shareholder"),
      cell("Category"),
      cell("Folio / DP ID"),
      right("Shares held"),
      right("% holding"),
      right("Voting rights"),
      right("Shares pledged"),
      right("% pledged"),
      cell("Last change"),
    ],
  ];
  holders.forEach((h, i) => {
    const dp = `IN30${String(Math.floor(rnd() * 1e8)).padStart(8, "0")}`;
    const day = 1 + Math.floor(rnd() * 28);
    const month = MONTHS[Math.floor(rnd() * 12)];
    const year = i < ANCHORS.length ? 2021 : 2022 + Math.floor(rnd() * 2);
    const voting = h.category === "Employee trust" ? "0.00%" : pct(h.shares);
    rows.push([
      cell(String(i + 1)),
      cell(h.name),
      cell(h.category),
      cell(dp),
      right(fmt(h.shares)),
      right(pct(h.shares)),
      right(voting),
      right("0"),
      right("0.00%"),
      cell(`${String(day).padStart(2, "0")}-${month}-${year}`),
    ]);
  });
  rows.push([
    cell(""),
    cell("Total", { bold: true }),
    cell(""),
    cell(""),
    right(fmt(TOTAL_SHARES), true),
    right("100.00%", true),
    right("96.68%", true),
    right("0", true),
    right("0.00%", true),
    cell(""),
  ]);
  return {
    name: "Holdings",
    widths: [44, 410, 200, 130, 110, 90, 110, 125, 100, 110],
    rows,
    headerRow: 4,
    highlights: [
      { range: [1, 0, 1, COLS - 1], when: "classified" },
      { range: [9, 0, 9, COLS - 1], when: "Temasek" },
    ],
  };
}

export const HOLDINGS_SHEET: SheetData = buildSheet();
