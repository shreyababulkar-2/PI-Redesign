import {
  benchmarkColumns,
  CellSource,
  categoryGroups,
  cellCitation,
  overallCompany,
  overallStats,
  RowKind,
  TableId,
} from "../../data/benchmarking";
import type { TableItem } from "./BenchmarkTable";

/** The rows of the two tables, as the page draws them. */
export const OVERALL_ITEMS: TableItem[] = [
  { type: "header" },
  { type: "company", company: overallCompany },
  { type: "stat", label: "All companies: Mean", values: overallStats.mean },
  { type: "stat", label: "All companies: Median", values: overallStats.median },
];

export const CATEGORY_ITEMS: TableItem[] = [
  { type: "header" },
  ...categoryGroups.flatMap((g): TableItem[] => [
    { type: "title", text: g.title },
    ...g.companies.map((company): TableItem => ({ type: "company", company })),
    { type: "stat", label: "All companies: Mean", values: g.mean },
    { type: "stat", label: "All companies: Median", values: g.median },
  ]),
];

/** The number of the first row of the category table: it carries on from the overall one. */
export const CATEGORY_ROW_START = OVERALL_ITEMS.filter((i) => i.type !== "header").length + 1;

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LEAVES = benchmarkColumns.flatMap((g) => g.subs.map((sub) => ({ metric: g.title, detail: sub.label })));

/** One sourced figure, as the citation drawer shows it. */
export type CitationTarget = {
  /** `table:row:column`, the same id the table gives the cell. */
  id: string;
  /** The row's name. */
  row: string;
  /** Where it sits in the sheet, e.g. "B1". */
  cell: string;
  metric: string;
  /** The column's sub heading: a period or "As of …". */
  detail: string;
  /** The figure as the table shows it. */
  value: string;
  sources: CellSource[];
  conflict: boolean;
};

export const cellId = (table: TableId, row: number, col: number) => `${table}:${row}:${col}`;

function targetsOf(table: TableId, items: TableItem[], rowStart: number): CitationTarget[] {
  const out: CitationTarget[] = [];
  let number = rowStart;
  let dataRow = 0;
  for (const item of items) {
    if (item.type === "header") continue;
    const num = number++;
    if (item.type === "title") continue;
    const di = dataRow++;
    const kind: RowKind =
      item.type === "company" ? "company" : /median/i.test(item.label) ? "median" : "mean";
    const texts = item.type === "company" ? item.company.cells.map((c) => c.text) : item.values;
    texts.forEach((text, col) => {
      const citation = cellCitation(table, kind, di, col, text);
      if (!citation) return;
      out.push({
        id: cellId(table, di, col),
        row: item.type === "company" ? item.company.name : item.label,
        cell: `${LETTERS[col + 1]}${num}`,
        metric: LEAVES[col].metric,
        detail: LEAVES[col].detail,
        value: text,
        sources: citation.sources,
        conflict: citation.conflict,
      });
    });
  }
  return out;
}

/** Every sourced figure, in reading order across both tables: what the drawer's ‹ › step through. */
export const CITATION_TARGETS: CitationTarget[] = [
  ...targetsOf("overall", OVERALL_ITEMS, 1),
  ...targetsOf("category", CATEGORY_ITEMS, CATEGORY_ROW_START),
];
