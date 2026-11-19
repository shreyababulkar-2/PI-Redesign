import { SheetCell } from "./workbooks";
import { IcWorkbook } from "./financialModel";

/**
 * The "Investment analysis" workbook (prototype only), shown in the artefact drawer as an Excel grid like the financial model:
 * four years of Actuals, IC case and Variation per line, with a green or red arrow on the variation.
 */

const YEARS = ["FY - 2025", "FY - 2024", "FY - 2023", "FY - 2022"];
type Cell = { actual: string; ic: string; delta: string; up: boolean };
type Row = { label: string; child?: boolean; truncated?: boolean; cells: Cell[] };

const c = (actual: string, ic: string, delta: string, up: boolean): Cell => ({ actual, ic, delta, up });
const NUM = ["92,585", "94,346"];
const NUM2 = ["1,08,884", "1,17,113"];
const PCT = ["12%", "11%"];
const U = "1.9%";
const D = "7.0%";
const u2 = "1.2%";

/** A parent row: the same totals each year, with its own variation direction per year. */
const parent = (label: string, dirs: boolean[], nums: string[][] = [NUM, NUM2, NUM, NUM2]): Row => ({
  label,
  cells: dirs.map((up, i) => c(nums[i][0], nums[i][1], up ? U : D, up)),
});
/** A child row: percentages (or amounts) with a variation per year. */
const child = (label: string, dirs: boolean[], nums: string[][] = [PCT, PCT, PCT, PCT], extra?: Partial<Row>): Row => ({
  label,
  child: true,
  ...extra,
  cells: dirs.map((up, i) => c(nums[i][0], nums[i][1], up ? u2 : D, up)),
});

/** Blocks of rows; a divider is drawn between blocks. */
const BLOCKS: Row[][] = [
  [
    parent("Gross Written Premium (GWP)", [true, false, true, false]),
    child("YoY growth (%)", [true, false, false, false]),
    child("Reinsurance ceded", [false, false, false, false], [NUM, NUM2, NUM, NUM2]),
    child("Reinsurance ceded (%)", [true, false, false, false]),
  ],
  [
    parent("Net Written Premium (NWP)", [true, true, true, true], [NUM, NUM2, NUM2, NUM2]),
    child("Retention rate (%)", [false, false, false, false]),
  ],
  [parent("Net Earned Premium (NEP)", [true, true, true, true]), child("YoY growth (%)", [false, false, false, false])],
  [parent("Net claims incurred", [true, true, true, true]), child("Loss ratio (on NEP) (%)", [true, false, false, false])],
  [
    parent("Net Commission", [true, true, true, true]),
    child("Net Commission (%) NWP", [false, false, false, false]),
    child("Net Commission (%) NEP", [true, false, false, false]),
  ],
  [
    parent("Operating Expenses", [true, true, true, true]),
    child("Opex (%) GWP - Total", [true, false, false, false]),
    child("Opex (%) NEP - Total", [false, false, false, false]),
  ],
  [
    parent("Total Costs (Claims + Expenses)", [true, true, true, true]),
    child("COR (%) (of NEP)", [true, false, false, false]),
  ],
  [
    parent("Underwriting Profit / Loss", [true, false, false, false]),
    child("Investment income", [false, false, true, true], [NUM, NUM2, NUM, NUM2]),
  ],
  [parent("Profit after tax", [true, true, true, true]), child("PAT Margin (% of NEP)", [true, false, false, false])],
];


const UP = "#1a7f4b";
const DOWN = "#d02533";

const text = (v: string, bold = false): SheetCell => ({ v, bold });
const num = (v: string, bold = false): SheetCell => ({ v, bold, align: "right" });

const titleRow = (): SheetCell[] => [
  text("Particulars", true),
  ...YEARS.flatMap((y) => [text(y, true), text("", true), text("", true)]),
];
const subRow = (): SheetCell[] => [
  text("", true),
  ...YEARS.flatMap(() => [num("Actuals", true), num("IC case", true), num("Variation", true)]),
];
const dataRow = (row: Row): SheetCell[] => [
  text(row.child ? `    ${row.label}` : row.label, !row.child),
  ...row.cells.flatMap((cell) => [
    num(cell.actual, !row.child),
    num(cell.ic, !row.child),
    { v: `${cell.up ? "▲" : "▼"} ${cell.delta}`, bold: !row.child, align: "right" as const, color: cell.up ? UP : DOWN },
  ]),
];

export const INVESTMENT_ANALYSIS: IcWorkbook = {
  file: "Investment_Analysis_v2.xlsx",
  sheets: [
    {
      name: "Investment analysis",
      widths: [230, ...YEARS.flatMap(() => [78, 78, 92])],
      headerRows: [0, 1],
      rows: [titleRow(), subRow(), ...BLOCKS.flat().map(dataRow)],
    },
    {
      name: "Key ratios",
      widths: [240, 100, 100, 100, 100, 130],
      headerRows: [0],
      rows: [
        [text("Ratio", true), ...["FY - 2025", "FY - 2024", "FY - 2023", "FY - 2022", "Industry average"].map((h) => num(h, true))],
        ...(
          [
            ["Combined ratio (COR)", "102.4%", "103.1%", "104.6%", "106.2%", "104.0%"],
            ["Loss ratio (on NEP)", "71.8%", "72.6%", "74.0%", "75.9%", "73.5%"],
            ["Expense ratio (on GWP)", "30.6%", "30.5%", "30.6%", "30.3%", "30.5%"],
            ["Net commission ratio (on NWP)", "6.2%", "6.0%", "5.7%", "5.4%", "6.0%"],
            ["Retention rate", "79.4%", "78.8%", "77.9%", "77.1%", "76.5%"],
            ["Reinsurance ceded (on GWP)", "20.6%", "21.2%", "22.1%", "22.9%", "23.5%"],
            ["Investment yield", "7.9%", "7.6%", "7.2%", "6.8%", "7.4%"],
            ["Return on equity", "12.8%", "11.9%", "10.4%", "8.7%", "11.0%"],
            ["PAT margin (on NEP)", "6.4%", "5.8%", "4.9%", "3.7%", "5.2%"],
            ["Solvency ratio", "2.31x", "2.24x", "2.18x", "2.10x", "2.05x"],
            ["Claims settlement ratio", "96.8%", "96.2%", "95.7%", "95.1%", "95.5%"],
            ["13-month persistency", "84.0%", "83.2%", "82.6%", "81.9%", "82.0%"],
          ] as string[][]
        ).map(([label, ...v]) => [text(label), ...v.map((x) => num(x))]),
      ],
    },
    {
      name: "Assumptions",
      widths: [240, 110, 110, 330],
      headerRows: [0],
      rows: [
        [text("Assumption", true), num("IC case", true), num("Actuals", true), text("Basis", true)],
        ...(
          [
            ["GWP growth (YoY)", "11.0%", "12.0%", "Motor and health lead; commercial lines flat"],
            ["Reinsurance ceded (on GWP)", "21.0%", "20.6%", "Treaty renewed at the same terms"],
            ["Retention rate", "78.0%", "79.4%", "Higher retention on health"],
            ["Loss ratio (on NEP)", "72.5%", "71.8%", "Three-year average, adjusted for the new pricing"],
            ["Net commission (on NWP)", "6.0%", "6.2%", "Distribution mix moves to direct"],
            ["Operating expenses (on GWP)", "30.5%", "30.6%", "Headcount flat, tech spend up 8%"],
            ["Investment yield", "7.5%", "7.9%", "Government securities and AAA corporate debt"],
            ["Tax rate", "25.2%", "25.2%", "New regime"],
            ["Solvency ratio (minimum)", "2.00x", "2.31x", "Regulatory floor is 1.50x"],
          ] as string[][]
        ).map(([label, ic, act, basis]) => [text(label), num(ic), num(act), text(basis)]),
      ],
    },
  ],
};
