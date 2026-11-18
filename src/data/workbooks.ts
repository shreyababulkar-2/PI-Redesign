/**
 * Dummy workbooks for the citation drawer (prototype only), shown as grids and also served as real files from
 * `public/docs`. Generated together with the PDFs; cells are already formatted for display.
 */
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
      {
        name: "Holdings",
        widths: [44, 420, 140, 110, 90, 80],
        rows: [
          [
            {
              v: "",
            },
            {
              v: "Romsons Group Private Limited",
              bold: true,
            },
            {
              v: "",
            },
            {
              v: "",
            },
            {
              v: "",
            },
            {
              v: "",
            },
          ],
          [
            {
              v: "",
            },
            {
              v: "Industry classification: Health Care Equipment & Supplies",
            },
            {
              v: "",
            },
            {
              v: "",
            },
            {
              v: "",
            },
            {
              v: "",
            },
          ],
          [
            {
              v: "",
            },
            {
              v: "Shareholding as on 30-Sep-2023",
            },
            {
              v: "",
            },
            {
              v: "",
            },
            {
              v: "",
            },
            {
              v: "",
            },
          ],
          [
            {
              v: "",
            },
            {
              v: "",
            },
            {
              v: "",
            },
            {
              v: "",
            },
            {
              v: "",
            },
            {
              v: "",
            },
          ],
          [
            {
              v: "Sr.",
              bold: true,
            },
            {
              v: "Shareholder",
              bold: true,
            },
            {
              v: "Category",
              bold: true,
            },
            {
              v: "Shares held",
              bold: true,
              align: "right",
            },
            {
              v: "% holding",
              bold: true,
              align: "right",
            },
            {
              v: "Pledged",
              bold: true,
              align: "right",
            },
          ],
          [
            {
              v: "1",
            },
            {
              v: "Romsons Family Holdings LLP",
            },
            {
              v: "Promoter group",
            },
            {
              v: "9,420,000",
              align: "right",
            },
            {
              v: "41.17%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "2",
            },
            {
              v: "Rajiv Sharma",
            },
            {
              v: "Promoter",
            },
            {
              v: "3,180,000",
              align: "right",
            },
            {
              v: "13.90%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "3",
            },
            {
              v: "Anita Sharma",
            },
            {
              v: "Promoter",
            },
            {
              v: "2,150,000",
              align: "right",
            },
            {
              v: "9.40%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "4",
            },
            {
              v: "Sharma Family Trust",
            },
            {
              v: "Promoter group",
            },
            {
              v: "1,840,000",
              align: "right",
            },
            {
              v: "8.04%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "5",
            },
            {
              v: "Jongsong Investments Pte. Ltd. (Temasek Holdings subsidiary)",
            },
            {
              v: "Investor, minority",
            },
            {
              v: "3,270,000",
              align: "right",
            },
            {
              v: "14.29%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "6",
            },
            {
              v: "Romsons ESOP Trust",
            },
            {
              v: "Employee trust",
            },
            {
              v: "760,000",
              align: "right",
            },
            {
              v: "3.32%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "7",
            },
            {
              v: "Bharat Growth Fund",
            },
            {
              v: "Institution",
            },
            {
              v: "38,647",
              align: "right",
            },
            {
              v: "0.17%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "8",
            },
            {
              v: "Rekha Desai",
            },
            {
              v: "Public",
            },
            {
              v: "39,516",
              align: "right",
            },
            {
              v: "0.17%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "9",
            },
            {
              v: "Suresh Pillai",
            },
            {
              v: "Public",
            },
            {
              v: "21,445",
              align: "right",
            },
            {
              v: "0.09%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "10",
            },
            {
              v: "Meera Pillai",
            },
            {
              v: "Public",
            },
            {
              v: "40,179",
              align: "right",
            },
            {
              v: "0.18%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "11",
            },
            {
              v: "Himalaya Equity LLP",
            },
            {
              v: "Institution",
            },
            {
              v: "21,201",
              align: "right",
            },
            {
              v: "0.09%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "12",
            },
            {
              v: "Ishaan Bhatia",
            },
            {
              v: "Public",
            },
            {
              v: "28,883",
              align: "right",
            },
            {
              v: "0.13%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "13",
            },
            {
              v: "Kabir Iyer",
            },
            {
              v: "Public",
            },
            {
              v: "11,744",
              align: "right",
            },
            {
              v: "0.05%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "14",
            },
            {
              v: "Manish Chopra",
            },
            {
              v: "Public",
            },
            {
              v: "38,687",
              align: "right",
            },
            {
              v: "0.17%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "15",
            },
            {
              v: "Deccan Capital Advisors",
            },
            {
              v: "Institution",
            },
            {
              v: "19,321",
              align: "right",
            },
            {
              v: "0.08%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "16",
            },
            {
              v: "Manish Gupta",
            },
            {
              v: "Public",
            },
            {
              v: "13,139",
              align: "right",
            },
            {
              v: "0.06%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "17",
            },
            {
              v: "Vivaan Mehta",
            },
            {
              v: "Public",
            },
            {
              v: "21,465",
              align: "right",
            },
            {
              v: "0.09%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "18",
            },
            {
              v: "Mohan Joshi",
            },
            {
              v: "Public",
            },
            {
              v: "10,971",
              align: "right",
            },
            {
              v: "0.05%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "19",
            },
            {
              v: "Lotus Mutual Fund",
            },
            {
              v: "Institution",
            },
            {
              v: "39,404",
              align: "right",
            },
            {
              v: "0.17%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "20",
            },
            {
              v: "Rohan Bhatia",
            },
            {
              v: "Public",
            },
            {
              v: "21,800",
              align: "right",
            },
            {
              v: "0.10%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "21",
            },
            {
              v: "Vikram Joshi",
            },
            {
              v: "Public",
            },
            {
              v: "28,277",
              align: "right",
            },
            {
              v: "0.12%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "22",
            },
            {
              v: "Ramesh Gupta",
            },
            {
              v: "Public",
            },
            {
              v: "14,569",
              align: "right",
            },
            {
              v: "0.06%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "23",
            },
            {
              v: "Sagar Investments",
            },
            {
              v: "Institution",
            },
            {
              v: "38,971",
              align: "right",
            },
            {
              v: "0.17%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "24",
            },
            {
              v: "Priya Kapoor",
            },
            {
              v: "Public",
            },
            {
              v: "35,658",
              align: "right",
            },
            {
              v: "0.16%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "25",
            },
            {
              v: "Sunita Iyer",
            },
            {
              v: "Public",
            },
            {
              v: "25,645",
              align: "right",
            },
            {
              v: "0.11%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "26",
            },
            {
              v: "Rohan Joshi",
            },
            {
              v: "Public",
            },
            {
              v: "27,942",
              align: "right",
            },
            {
              v: "0.12%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "27",
            },
            {
              v: "Orion Wealth Partners",
            },
            {
              v: "Institution",
            },
            {
              v: "10,949",
              align: "right",
            },
            {
              v: "0.05%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "28",
            },
            {
              v: "Aditya Shah",
            },
            {
              v: "Public",
            },
            {
              v: "16,073",
              align: "right",
            },
            {
              v: "0.07%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "29",
            },
            {
              v: "Neha Nair",
            },
            {
              v: "Public",
            },
            {
              v: "28,064",
              align: "right",
            },
            {
              v: "0.12%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "30",
            },
            {
              v: "Neha Iyer",
            },
            {
              v: "Public",
            },
            {
              v: "10,106",
              align: "right",
            },
            {
              v: "0.04%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "31",
            },
            {
              v: "Meridian India Opportunities",
            },
            {
              v: "Institution",
            },
            {
              v: "9,035",
              align: "right",
            },
            {
              v: "0.04%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "32",
            },
            {
              v: "Ananya Verma",
            },
            {
              v: "Public",
            },
            {
              v: "12,429",
              align: "right",
            },
            {
              v: "0.05%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "33",
            },
            {
              v: "Ramesh Chopra",
            },
            {
              v: "Public",
            },
            {
              v: "35,045",
              align: "right",
            },
            {
              v: "0.15%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "34",
            },
            {
              v: "Pooja Iyer",
            },
            {
              v: "Public",
            },
            {
              v: "22,008",
              align: "right",
            },
            {
              v: "0.10%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "35",
            },
            {
              v: "Kaveri Securities",
            },
            {
              v: "Institution",
            },
            {
              v: "26,680",
              align: "right",
            },
            {
              v: "0.12%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "36",
            },
            {
              v: "Rohan Iyer",
            },
            {
              v: "Public",
            },
            {
              v: "29,395",
              align: "right",
            },
            {
              v: "0.13%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "37",
            },
            {
              v: "Rohan Gupta",
            },
            {
              v: "Public",
            },
            {
              v: "35,873",
              align: "right",
            },
            {
              v: "0.16%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "38",
            },
            {
              v: "Kavita Nair",
            },
            {
              v: "Public",
            },
            {
              v: "17,820",
              align: "right",
            },
            {
              v: "0.08%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "39",
            },
            {
              v: "Ganga Holdings",
            },
            {
              v: "Institution",
            },
            {
              v: "25,147",
              align: "right",
            },
            {
              v: "0.11%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "40",
            },
            {
              v: "Tanvi Nair",
            },
            {
              v: "Public",
            },
            {
              v: "9,717",
              align: "right",
            },
            {
              v: "0.04%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "41",
            },
            {
              v: "Vivaan Bhatia",
            },
            {
              v: "Public",
            },
            {
              v: "40,904",
              align: "right",
            },
            {
              v: "0.18%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "42",
            },
            {
              v: "Meera Desai",
            },
            {
              v: "Public",
            },
            {
              v: "21,346",
              align: "right",
            },
            {
              v: "0.09%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "43",
            },
            {
              v: "Narmada Capital",
            },
            {
              v: "Institution",
            },
            {
              v: "38,322",
              align: "right",
            },
            {
              v: "0.17%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "44",
            },
            {
              v: "Vikram Verma",
            },
            {
              v: "Public",
            },
            {
              v: "17,583",
              align: "right",
            },
            {
              v: "0.08%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "45",
            },
            {
              v: "Pooja Chopra",
            },
            {
              v: "Public",
            },
            {
              v: "16,635",
              align: "right",
            },
            {
              v: "0.07%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "46",
            },
            {
              v: "Neha Saxena",
            },
            {
              v: "Public",
            },
            {
              v: "22,950",
              align: "right",
            },
            {
              v: "0.10%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "47",
            },
            {
              v: "Trident Family Office",
            },
            {
              v: "Institution",
            },
            {
              v: "9,030",
              align: "right",
            },
            {
              v: "0.04%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "48",
            },
            {
              v: "Riya Shah",
            },
            {
              v: "Public",
            },
            {
              v: "28,932",
              align: "right",
            },
            {
              v: "0.13%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "49",
            },
            {
              v: "Mohan Gupta",
            },
            {
              v: "Public",
            },
            {
              v: "22,809",
              align: "right",
            },
            {
              v: "0.10%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "50",
            },
            {
              v: "Meera Chopra",
            },
            {
              v: "Public",
            },
            {
              v: "15,575",
              align: "right",
            },
            {
              v: "0.07%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "51",
            },
            {
              v: "Cedar Ridge Fund",
            },
            {
              v: "Institution",
            },
            {
              v: "11,759",
              align: "right",
            },
            {
              v: "0.05%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "52",
            },
            {
              v: "Kabir Verma",
            },
            {
              v: "Public",
            },
            {
              v: "37,936",
              align: "right",
            },
            {
              v: "0.17%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "53",
            },
            {
              v: "Other shareholders (below 1%)",
            },
            {
              v: "Public",
            },
            {
              v: "1,150,414",
              align: "right",
            },
            {
              v: "5.03%",
              align: "right",
            },
            {
              v: "0",
              align: "right",
            },
          ],
          [
            {
              v: "",
            },
            {
              v: "Total",
              bold: true,
            },
            {
              v: "",
            },
            {
              v: "22,880,000",
              bold: true,
              align: "right",
            },
            {
              v: "100.00%",
              bold: true,
              align: "right",
            },
            {
              v: "0",
              bold: true,
              align: "right",
            },
          ],
        ],
        headerRow: 4,
        highlights: [
          {
            range: [1, 0, 1, 5],
            when: "classified",
          },
          {
            range: [9, 0, 9, 5],
            when: "Temasek",
          },
        ],
      },
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
