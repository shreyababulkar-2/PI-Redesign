import { SheetCell } from "./workbooks";

/**
 * The "Financial model" workbook (prototype only): a dummy Excel file shown in the artefact drawer as a grid, the same way the
 * citation drawer shows spreadsheets. Cells are already formatted for display (₹ crore unless stated).
 */
export type IcSheet = {
  name: string;
  widths: number[];
  rows: SheetCell[][];
  /** The rows that carry the column titles (tinted and bold). */
  headerRows: number[];
};
export type IcWorkbook = { file: string; sheets: IcSheet[] };

const t = (v: string, extra: Partial<SheetCell> = {}): SheetCell => ({ v, ...extra });
const b = (v: string, extra: Partial<SheetCell> = {}): SheetCell => ({ v, bold: true, ...extra });
const n = (v: string, extra: Partial<SheetCell> = {}): SheetCell => ({ v, align: "right", ...extra });
const blank = (): SheetCell => ({ v: "" });

/** A line of the P&L: label plus one figure per year. */
const line = (label: string, vals: string[], bold = false): SheetCell[] => [
  bold ? b(label) : t(label),
  ...vals.map((v) => (bold ? n(v, { bold: true }) : n(v))),
];

export const FINANCIAL_MODEL: IcWorkbook = {
  file: "Juspay_Financial_Model_v2.xlsx",
  sheets: [
    {
      name: "IC summary",
      widths: [260, 150, 300],
      headerRows: [2],
      rows: [
        [b("Juspay Technologies Private Limited"), blank(), blank()],
        [t("Investment committee summary · Stage 3"), blank(), blank()],
        [b("Particulars"), b("Value", { align: "right" }), b("Comment")],
        [t("Round size"), n("₹242.2 Cr"), t("Primary and secondary, closing in Q4")],
        [t("Equity value at entry"), n("₹2,050 – 2,250 Cr"), t("Range from the pricing band")],
        [t("Ownership post-money"), n("10.7%"), t("Fully diluted")],
        [t("Entry EV / EBITDA"), n("7.4x"), t("On FY25 actuals")],
        [t("Entry EV / Revenue"), n("3.6x"), t("On FY25 actuals")],
        [t("Revenue (FY25)"), n("₹593.1 Cr"), t("Up 14.56% on FY24")],
        [t("EBITDA margin (FY25)"), n("25.4%"), t("Ahead of the IC case by 1.9 pts")],
        [t("Net debt"), n("₹(38.4) Cr"), t("Net cash position")],
        [t("Base case MOIC / IRR"), n("2.6x / 21%"), t("5-year hold")],
        [t("Downside MOIC / IRR"), n("1.4x / 7%"), t("Revenue growth halves")],
        [t("Open items before sign-off"), n("4"), t("Legal, tax, customer calls, ESOP")],
        [blank(), blank(), blank()],
        [b("Use of proceeds"), b("₹ Cr", { align: "right" }), b("Comment")],
        [t("Growth capital"), n("120.0"), t("Product and new markets")],
        [t("Secondary to existing holders"), n("82.2"), t("Two early investors partially exit")],
        [t("General corporate purposes"), n("36.0"), t("Working capital and hiring")],
        [t("Fees and expenses"), n("4.0"), t("Deal costs, borne by the company")],
        [b("Total"), n("242.2", { bold: true }), t("Matches round size")],
        [blank(), blank(), blank()],
        [b("Cap table post-money"), b("% held", { align: "right" }), b("Comment")],
        [t("Founders and management"), n("41.3%"), t("Four-year vesting on new grants")],
        [t("Existing institutional investors"), n("33.5%"), t("Three funds, none above 15%")],
        [t("New investor (this round)"), n("10.7%"), t("Board observer seat")],
        [t("ESOP pool"), n("8.0%"), t("Topped up by 2.0 pts")],
        [t("Others"), n("6.5%"), t("Angels and strategic holders")],
      ],
    },
    {
      name: "Financials",
      widths: [220, 100, 100, 100, 100, 100, 100],
      headerRows: [1],
      rows: [
        [b("₹ Cr"), blank(), blank(), blank(), blank(), blank(), blank()],
        [b("Particulars"), ...["FY22", "FY23", "FY24", "FY25", "FY26E", "FY27E"].map((y) => b(y, { align: "right" }))],
        line("Revenue from operations", ["412.6", "466.8", "517.7", "593.1", "671.4", "758.0"], true),
        line("  Growth", ["–", "13.1%", "10.9%", "14.6%", "13.2%", "12.9%"]),
        line("Cost of services", ["(168.2)", "(186.4)", "(201.9)", "(226.8)", "(255.1)", "(284.3)"]),
        line("Gross profit", ["244.4", "280.4", "315.8", "366.3", "416.3", "473.7"], true),
        line("  Gross margin", ["59.2%", "60.1%", "61.0%", "61.8%", "62.0%", "62.5%"]),
        line("Employee costs", ["(98.4)", "(108.2)", "(121.5)", "(138.9)", "(157.2)", "(176.8)"]),
        line("Other operating costs", ["(52.1)", "(57.6)", "(62.4)", "(76.7)", "(84.9)", "(94.1)"]),
        line("EBITDA", ["93.9", "114.6", "131.9", "150.7", "174.2", "202.8"], true),
        line("  EBITDA margin", ["22.8%", "24.5%", "25.5%", "25.4%", "25.9%", "26.8%"]),
        line("Depreciation and amortisation", ["(21.3)", "(24.0)", "(27.8)", "(31.2)", "(34.6)", "(38.0)"]),
        line("Finance costs", ["(6.8)", "(6.1)", "(5.2)", "(4.4)", "(3.5)", "(2.7)"]),
        line("Profit before tax", ["65.8", "84.5", "98.9", "115.1", "136.1", "162.1"], true),
        line("Tax", ["(17.1)", "(21.9)", "(25.7)", "(29.9)", "(35.4)", "(42.1)"]),
        line("Profit after tax", ["48.7", "62.6", "73.2", "85.2", "100.7", "120.0"], true),
        [blank(), blank(), blank(), blank(), blank(), blank(), blank()],
        [b("Balance sheet and cash flow"), ...["FY22", "FY23", "FY24", "FY25", "FY26E", "FY27E"].map((y) => b(y, { align: "right" }))],
        line("Net worth", ["310.4", "372.8", "446.0", "531.2", "631.9", "751.9"]),
        line("Total debt", ["88.0", "76.5", "66.1", "57.8", "46.0", "34.0"]),
        line("Cash and equivalents", ["71.3", "90.2", "118.9", "96.2", "122.0", "158.0"]),
        line("Net debt / (net cash)", ["16.7", "(13.7)", "(52.8)", "(38.4)", "(76.0)", "(124.0)"], true),
        line("Operating cash flow", ["74.2", "91.0", "108.5", "118.3", "139.0", "163.4"]),
        line("Capex", ["(28.4)", "(31.0)", "(36.2)", "(42.5)", "(48.0)", "(54.0)"]),
        line("Free cash flow", ["45.8", "60.0", "72.3", "75.8", "91.0", "109.4"], true),
        line("Net debt / EBITDA", ["0.2x", "(0.1x)", "(0.4x)", "(0.3x)", "(0.4x)", "(0.6x)"]),
      ],
    },
    {
      name: "Returns",
      widths: [200, 120, 120, 100, 100, 220],
      headerRows: [1],
      rows: [
        [b("Returns by scenario · 5-year hold"), blank(), blank(), blank(), blank(), blank()],
        [
          b("Scenario"),
          b("Entry EV (₹ Cr)", { align: "right" }),
          b("Exit EV (₹ Cr)", { align: "right" }),
          b("MOIC", { align: "right" }),
          b("IRR", { align: "right" }),
          b("Key assumption"),
        ],
        [t("Upside"), n("2,050"), n("6,840"), n("3.3x"), n("27%"), t("Revenue CAGR 18%, margin 29%")],
        [b("Base"), n("2,150", { bold: true }), n("5,590", { bold: true }), n("2.6x", { bold: true }), n("21%", { bold: true }), t("Revenue CAGR 13%, margin 27%")],
        [t("Downside"), n("2,250"), n("3,150"), n("1.4x"), n("7%"), t("Revenue CAGR 7%, margin 24%")],
        [t("Stress"), n("2,250"), n("2,360"), n("1.0x"), n("1%"), t("Top client lost, margin 21%")],
        [blank(), blank(), blank(), blank(), blank(), blank()],
        [b("Base case MOIC by exit multiple"), ...["Year 3", "Year 4", "Year 5", "Year 6"].map((y) => b(y, { align: "right" })), b("Comment")],
        [t("6x EV / EBITDA"), n("1.3x"), n("1.6x"), n("1.9x"), n("2.1x"), t("Below the entry multiple")],
        [t("8x EV / EBITDA"), n("1.7x"), n("2.1x"), n("2.6x", { bold: true }), n("3.0x"), t("Base case: year 5")],
        [t("10x EV / EBITDA"), n("2.1x"), n("2.7x"), n("3.3x"), n("3.8x"), t("Peer median")],
        [t("12x EV / EBITDA"), n("2.5x"), n("3.2x"), n("3.9x"), n("4.6x"), blank()],
        [t("14x EV / EBITDA"), n("2.9x"), n("3.7x"), n("4.6x"), n("5.3x"), t("Top of the peer range")],
        [blank(), blank(), blank(), blank(), blank(), blank()],
        [b("Base case IRR by exit multiple"), ...["Year 3", "Year 4", "Year 5", "Year 6"].map((y) => b(y, { align: "right" })), b("Comment")],
        [t("6x EV / EBITDA"), n("9%"), n("12%"), n("14%"), n("13%"), blank()],
        [t("8x EV / EBITDA"), n("19%"), n("20%"), n("21%", { bold: true }), n("20%"), t("Base case: year 5")],
        [t("10x EV / EBITDA"), n("28%"), n("28%"), n("27%"), n("25%"), blank()],
        [t("12x EV / EBITDA"), n("36%"), n("34%"), n("31%"), n("29%"), blank()],
        [t("14x EV / EBITDA"), n("43%"), n("39%"), n("36%"), n("32%"), blank()],
      ],
    },
  ],
};
