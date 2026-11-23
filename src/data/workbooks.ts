/**
 * Dummy workbooks for the citation drawer (prototype only), shown as grids and also served as real files from
 * `public/docs`. Generated together with the PDFs; cells are already formatted for display.
 */
import { HOLDINGS_SHEET } from "./holdingsSheet";

export type SheetCell = {
  v: string;
  bold?: boolean;
  align?: "left" | "right" | "center";
  color?: string;
};
/** A cited range as [firstRow, firstCol, lastRow, lastCol], zero-based; `when` is a word of the note passage it backs. */
export type SheetHighlight = {
  range: [number, number, number, number];
  when?: string;
};
export type SheetData = {
  name: string;
  widths: number[];
  rows: SheetCell[][];
  headerRow: number;
  highlights: SheetHighlight[];
};
export type WorkbookData = { file: string; sheets: SheetData[] };

export const WORKBOOKS: Record<number, WorkbookData> = {
  "8": {
    file: "RP_HLDGPOSI_APIALL_Holding.xlsx",
    sheets: [
      HOLDINGS_SHEET,
      {
        name: "Summary",
        widths: [300, 160],
        rows: [
          [
            {
              v: "Item",
              bold: true,
            },
            {
              v: "Value",
              bold: true,
            },
          ],
          [
            {
              v: "As on date",
            },
            {
              v: "30-Sep-2023",
            },
          ],
          [
            {
              v: "Total shares",
            },
            {
              v: "22,880,000",
              align: "right",
            },
          ],
          [
            {
              v: "Promoter and promoter group",
            },
            {
              v: "72.5%",
              align: "right",
            },
          ],
          [
            {
              v: "Foreign institutional investor (Temasek subsidiary)",
            },
            {
              v: "14.3%",
              align: "right",
            },
          ],
          [
            {
              v: "Pledged shares",
            },
            {
              v: "Nil",
              align: "right",
            },
          ],
        ],
        headerRow: 0,
        highlights: [],
      },
      {
        name: "Notes",
        widths: [50, 520],
        rows: [
          [
            {
              v: "Note",
              bold: true,
            },
            {
              v: "Detail",
              bold: true,
            },
          ],
          [
            {
              v: "1",
            },
            {
              v: "Shareholding as filed with the registrar for the quarter ended 30 September 2023.",
            },
          ],
          [
            {
              v: "2",
            },
            {
              v: "Jongsong Investments Pte. Ltd. subscribed to CCPS and equity, approved by the CCI.",
            },
          ],
          [
            {
              v: "3",
            },
            {
              v: "Percentages may not add up due to rounding.",
            },
          ],
        ],
        headerRow: 0,
        highlights: [],
      },
    ],
  },
  "18": {
    file: "Peer_Benchmark_Model_v3.xlsx",
    sheets: [
      {
        name: "Peers",
        widths: [260, 190, 130, 110, 130, 100],
        rows: [
          [
            {
              v: "Company",
              bold: true,
            },
            {
              v: "Status",
              bold: true,
            },
            {
              v: "Revenue FY24 (₹ cr)",
              bold: true,
              align: "right",
            },
            {
              v: "EBITDA margin",
              bold: true,
              align: "right",
            },
            {
              v: "Net debt / EBITDA",
              bold: true,
              align: "right",
            },
            {
              v: "EV / EBITDA",
              bold: true,
              align: "right",
            },
          ],
          [
            {
              v: "Romsons Group (target)",
            },
            {
              v: "Unlisted",
            },
            {
              v: "584",
              align: "right",
            },
            {
              v: "16.1%",
              align: "right",
            },
            {
              v: "0.4x",
              align: "right",
            },
            {
              v: "—",
              align: "right",
            },
          ],
          [
            {
              v: "Poly Medicure",
            },
            {
              v: "Listed",
            },
            {
              v: "1,170",
              align: "right",
            },
            {
              v: "22.3%",
              align: "right",
            },
            {
              v: "-0.2x",
              align: "right",
            },
            {
              v: "36.4x",
              align: "right",
            },
          ],
          [
            {
              v: "Healthium Medtech",
            },
            {
              v: "Draft offer document filed",
            },
            {
              v: "1,320",
              align: "right",
            },
            {
              v: "23.5%",
              align: "right",
            },
            {
              v: "1.1x",
              align: "right",
            },
            {
              v: "28.9x",
              align: "right",
            },
          ],
          [
            {
              v: "Hindustan Syringes & Medical Devices",
            },
            {
              v: "Unlisted",
            },
            {
              v: "1,460",
              align: "right",
            },
            {
              v: "18.7%",
              align: "right",
            },
            {
              v: "0.6x",
              align: "right",
            },
            {
              v: "19.5x",
              align: "right",
            },
          ],
          [
            {
              v: "Meril Life Sciences",
            },
            {
              v: "Unlisted",
            },
            {
              v: "3,150",
              align: "right",
            },
            {
              v: "21.2%",
              align: "right",
            },
            {
              v: "0.8x",
              align: "right",
            },
            {
              v: "31.0x",
              align: "right",
            },
          ],
          [
            {
              v: "Translumina Therapeutics",
            },
            {
              v: "Unlisted",
            },
            {
              v: "610",
              align: "right",
            },
            {
              v: "24.9%",
              align: "right",
            },
            {
              v: "0.3x",
              align: "right",
            },
            {
              v: "27.4x",
              align: "right",
            },
          ],
          [
            {
              v: "Sahajanand Medical Technologies",
            },
            {
              v: "Draft offer document filed",
            },
            {
              v: "405",
              align: "right",
            },
            {
              v: "26.4%",
              align: "right",
            },
            {
              v: "0.9x",
              align: "right",
            },
            {
              v: "30.2x",
              align: "right",
            },
          ],
          [
            {
              v: "Tynor Orthotics",
            },
            {
              v: "Listed",
            },
            {
              v: "260",
              align: "right",
            },
            {
              v: "15.8%",
              align: "right",
            },
            {
              v: "0.2x",
              align: "right",
            },
            {
              v: "17.9x",
              align: "right",
            },
          ],
          [
            {
              v: "Iscon Surgicals",
            },
            {
              v: "Listed",
            },
            {
              v: "92",
              align: "right",
            },
            {
              v: "13.6%",
              align: "right",
            },
            {
              v: "0.5x",
              align: "right",
            },
            {
              v: "14.8x",
              align: "right",
            },
          ],
          [
            {
              v: "Encompass Health Devices",
            },
            {
              v: "Unlisted",
            },
            {
              v: "340",
              align: "right",
            },
            {
              v: "17.2%",
              align: "right",
            },
            {
              v: "0.7x",
              align: "right",
            },
            {
              v: "16.4x",
              align: "right",
            },
          ],
          [
            {
              v: "Nipro India",
            },
            {
              v: "Unlisted",
            },
            {
              v: "1,220",
              align: "right",
            },
            {
              v: "16.9%",
              align: "right",
            },
            {
              v: "0.1x",
              align: "right",
            },
            {
              v: "18.8x",
              align: "right",
            },
          ],
          [
            {
              v: "B. Braun Medical India",
            },
            {
              v: "Unlisted",
            },
            {
              v: "2,380",
              align: "right",
            },
            {
              v: "14.7%",
              align: "right",
            },
            {
              v: "-0.3x",
              align: "right",
            },
            {
              v: "22.5x",
              align: "right",
            },
          ],
          [
            {
              v: "Appasamy Associates",
            },
            {
              v: "Unlisted",
            },
            {
              v: "520",
              align: "right",
            },
            {
              v: "19.8%",
              align: "right",
            },
            {
              v: "0.4x",
              align: "right",
            },
            {
              v: "20.7x",
              align: "right",
            },
          ],
          [
            {
              v: "Becton Dickinson India",
            },
            {
              v: "Unlisted",
            },
            {
              v: "2,950",
              align: "right",
            },
            {
              v: "20.5%",
              align: "right",
            },
            {
              v: "-0.5x",
              align: "right",
            },
            {
              v: "25.9x",
              align: "right",
            },
          ],
          [
            {
              v: "Terumo Penpol",
            },
            {
              v: "Unlisted",
            },
            {
              v: "410",
              align: "right",
            },
            {
              v: "18.1%",
              align: "right",
            },
            {
              v: "0.2x",
              align: "right",
            },
            {
              v: "19.9x",
              align: "right",
            },
          ],
          [
            {
              v: "Smith & Nephew India",
            },
            {
              v: "Unlisted",
            },
            {
              v: "1,780",
              align: "right",
            },
            {
              v: "17.6%",
              align: "right",
            },
            {
              v: "-0.1x",
              align: "right",
            },
            {
              v: "23.3x",
              align: "right",
            },
          ],
          [
            {
              v: "Medtronic India",
            },
            {
              v: "Unlisted",
            },
            {
              v: "5,200",
              align: "right",
            },
            {
              v: "19.3%",
              align: "right",
            },
            {
              v: "-0.6x",
              align: "right",
            },
            {
              v: "27.0x",
              align: "right",
            },
          ],
          [
            {
              v: "Skanray Technologies",
            },
            {
              v: "Unlisted",
            },
            {
              v: "210",
              align: "right",
            },
            {
              v: "12.9%",
              align: "right",
            },
            {
              v: "0.6x",
              align: "right",
            },
            {
              v: "13.5x",
              align: "right",
            },
          ],
          [
            {
              v: "Opto Circuits India",
            },
            {
              v: "Listed",
            },
            {
              v: "180",
              align: "right",
            },
            {
              v: "10.4%",
              align: "right",
            },
            {
              v: "1.3x",
              align: "right",
            },
            {
              v: "11.2x",
              align: "right",
            },
          ],
          [
            {
              v: "Lord's Mark Industries",
            },
            {
              v: "Listed",
            },
            {
              v: "70",
              align: "right",
            },
            {
              v: "11.7%",
              align: "right",
            },
            {
              v: "0.4x",
              align: "right",
            },
            {
              v: "12.8x",
              align: "right",
            },
          ],
          [
            {
              v: "Allied Medical",
            },
            {
              v: "Listed",
            },
            {
              v: "105",
              align: "right",
            },
            {
              v: "16.0%",
              align: "right",
            },
            {
              v: "0.2x",
              align: "right",
            },
            {
              v: "15.1x",
              align: "right",
            },
          ],
          [
            {
              v: "Alkem Medical Devices",
            },
            {
              v: "Unlisted",
            },
            {
              v: "640",
              align: "right",
            },
            {
              v: "15.2%",
              align: "right",
            },
            {
              v: "0.5x",
              align: "right",
            },
            {
              v: "17.0x",
              align: "right",
            },
          ],
          [
            {
              v: "Biorad Medisys",
            },
            {
              v: "Unlisted",
            },
            {
              v: "230",
              align: "right",
            },
            {
              v: "21.7%",
              align: "right",
            },
            {
              v: "0.1x",
              align: "right",
            },
            {
              v: "21.9x",
              align: "right",
            },
          ],
          [
            {
              v: "Hindustan Latex Devices",
            },
            {
              v: "Unlisted",
            },
            {
              v: "880",
              align: "right",
            },
            {
              v: "13.8%",
              align: "right",
            },
            {
              v: "0.7x",
              align: "right",
            },
            {
              v: "14.2x",
              align: "right",
            },
          ],
          [
            {
              v: "Peer median",
              bold: true,
            },
            {
              v: "",
            },
            {
              v: "610",
              bold: true,
              align: "right",
            },
            {
              v: "17.6%",
              bold: true,
              align: "right",
            },
            {
              v: "0.4x",
              bold: true,
              align: "right",
            },
            {
              v: "19.9x",
              bold: true,
              align: "right",
            },
          ],
        ],
        headerRow: 0,
        highlights: [
          {
            range: [3, 0, 3, 5],
          },
        ],
      },
      {
        name: "Assumptions",
        widths: [300, 300],
        rows: [
          [
            {
              v: "Assumption",
              bold: true,
            },
            {
              v: "Value",
              bold: true,
            },
          ],
          [
            {
              v: "Valuation date",
            },
            {
              v: "31-Mar-2024",
            },
          ],
          [
            {
              v: "Multiple basis",
            },
            {
              v: "EV / EBITDA (FY24)",
            },
          ],
          [
            {
              v: "Discount for lack of marketability",
            },
            {
              v: "15%",
              align: "right",
            },
          ],
          [
            {
              v: "Source of peer data",
            },
            {
              v: "Company filings and draft offer documents",
            },
          ],
        ],
        headerRow: 0,
        highlights: [],
      },
    ],
  },
};
