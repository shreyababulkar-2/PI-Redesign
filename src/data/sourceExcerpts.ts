/**
 * Sample text for the citation drawer (prototype only): what each source says around the passage the note relies on.
 * Web sources get an excerpt (`before` + `match` + `after`, with `match` highlighted); data room files get where the
 * file opens (`page` or `sheet`) and the phrase to find there. All of it is illustrative.
 */
export type WebExcerpt = {
  /** Page title as it would read at the top of the original. */
  heading: string;
  before: string;
  match: string;
  after: string;
  /** When the source is cited for several claims, a word from the one this excerpt backs (it opens on that claim). */
  supports?: string;
};

export type FileTarget = {
  /** Where the embedded viewer opens: a page for documents, a sheet and cell range for spreadsheets. */
  opensAt: string;
  /** The phrase the viewer is asked to find. */
  find: string;
  /** Documents: the page it opens at, and how many pages the file has. */
  page?: number;
  pages?: number;
  /** Spreadsheets: the sheet it opens on. */
  sheet?: string;
  /** The dummy file in `public/docs` that the drawer embeds or downloads. */
  src: string;
  /** A word from the note passage this file backs (it opens on that passage when moved to with the arrows). */
  supports?: string;
};

export const WEB_EXCERPTS: Record<number, WebExcerpt> = {
  1: {
    heading: "Romsons Group Pvt Ltd: company profile and trade summary",
    before:
      "Romsons Group Private Limited is an India-based exporter of medical disposables, with trade records going back to 2012. ",
    match:
      "The company is classified within Health Care Equipment & Supplies and manufactures disposable devices including urology catheters and surgical consumables.",
    after:
      " Shipment data shows exports to more than 60 destination countries over the last twelve months.",
  },
  3: {
    supports: "Temasek",
    heading:
      "CCI approves proposed combination involving Jongsong Investments and Romsons Group",
    before:
      "The Competition Commission of India (CCI) today approved the proposed combination. ",
    match:
      "The proposed combination involves subscription to certain compulsorily convertible preference shares and acquisition of certain equity share capital of Romsons Group by Jongsong Investments Pte. Ltd.",
    after:
      " Romsons Group is engaged in the manufacture and sale of medical devices and consumables in India and overseas.",
  },
  6: {
    heading: "Romsons International: employee reviews and ratings",
    before:
      "Rated 3.1 out of 5 from 142 reviews. Reviewers praise product quality and job stability. ",
    match:
      "Several recent reviews mention delayed salaries and pending bonuses, and say higher-level officials do not prioritise timely work completion.",
    after:
      " Reviews from the last six months are noticeably more negative than earlier ones.",
  },
  7: {
    heading: "Romsons Group Private Limited: company profile and directors",
    before:
      "Romsons Group Private Limited is a private company limited by shares. ",
    match:
      "The company was incorporated on 28 November 1977 and operates from Uttar Pradesh, with warehouses and a distribution network across Indian state capitals and exports to 65 to 75 countries.",
    after:
      " Authorised and paid-up capital figures are listed in the filings section.",
  },
  9: {
    supports: "Formalised",
    heading:
      "Master data: Romsons Group Private Limited (CIN U24236UP1977PTC004511)",
    before: "Company status: Active. Class of company: Private. ",
    match:
      "Date of incorporation: 28 November 1977. Principal business activity: manufacture of medical and surgical equipment and consumables.",
    after:
      " Registered office: Uttar Pradesh. Last annual return filed for the most recent financial year.",
  },
  10: {
    heading: "Romsons Group: export shipment records, FY2023",
    before:
      "Top destinations by shipment count include the Middle East, Africa and South-East Asia. ",
    match:
      "Records show shipments to between 65 and 75 destination countries in FY2023, with urology and surgical consumables the most frequent product groups.",
    after: " Shipment counts are indicative and based on customs filings.",
  },
  12: {
    heading: "Romsons Group: rating rationale and financial summary",
    before:
      "The rating reflects an established market position and healthy export mix. ",
    match:
      "Operating revenue for FY2023 is shown at over ₹500 crore on a standalone basis; the company reports a wider group turnover of about ₹1,400 crore.",
    after:
      " Working capital intensity remains moderate, with inventory days the main driver.",
  },
  13: {
    heading: "Temasek arm picks up minority stake in Romsons Group",
    before:
      "Singapore state investor Temasek has made a new investment in the Indian medical devices maker. ",
    match:
      "A Temasek subsidiary has taken a minority stake in Romsons Group as a long-term partner to support its global expansion plans.",
    after:
      " The company said the capital will fund capacity additions and deeper export reach.",
  },
  14: {
    heading:
      "Indian medical devices industry: market size, segments and growth outlook",
    before:
      "Single-use devices are the fastest growing segment of the market. ",
    match:
      "Stricter infection-control norms are shifting hospitals from reusable to disposable catheters, syringes and surgical consumables.",
    after:
      " Rising bed capacity and insurance coverage are expected to lift procedure volumes further.",
  },
  15: {
    heading:
      "Production Linked Incentive scheme for promotion of medical devices manufacturing",
    before:
      "India currently imports a large share of its medical device requirement. ",
    match:
      "The scheme offers production-linked incentives and domestic-manufacturing preference in public procurement to build local capacity.",
    after:
      " Eligible categories include implants, consumables and diagnostic equipment.",
  },
  16: {
    heading: "Romsons Group: key financials and peer comparison",
    before: "Figures are standalone and in ₹ crore unless stated. ",
    match:
      "One aggregator lists FY2023 operating revenue as over ₹500 crore, while another source cites an annual turnover of about ₹1,400 crore.",
    after: " Peer multiples are shown alongside for context.",
  },
  17: {
    heading: "Poly Medicure: annual report FY2024-25",
    before:
      "Poly Medicure is a listed manufacturer of infusion, blood management, urology and surgical disposables. ",
    match:
      "Exports contribute a large share of revenue, making it the closest listed comparable by product mix.",
    after: " EBITDA margin and export mix are disclosed in the segment note.",
  },
};

export const FILE_TARGETS: Record<number, FileTarget> = {
  2: {
    opensAt: "page 14",
    find: "classified within",
    page: 14,
    pages: 24,
    src: "/docs/S3055_NAV_Report_FY2023_Q3.pdf",
    supports: "classified",
  },
  4: {
    opensAt: "page 6",
    find: "breast pumps",
    page: 6,
    pages: 12,
    src: "/docs/Romsons_Product_Catalogue_2024.pdf",
    supports: "breast pumps",
  },
  5: {
    opensAt: "page 22",
    find: "warehouses in every state capital",
    page: 22,
    pages: 30,
    src: "/docs/Romsons_Annual_Report_FY2023-24.pdf",
    supports: "warehousing",
  },
  8: {
    opensAt: "sheet “Holdings”, row 6",
    find: "Jongsong",
    sheet: "Holdings",
    src: "/docs/RP_HLDGPOSI_APIALL_Holding.xlsx",
    supports: "Temasek",
  },
  11: {
    opensAt: "page 3",
    find: "reliability of third-party data",
    page: 3,
    pages: 8,
    src: "/docs/IC_Discussion_Notes_Romsons_Oct26.pdf",
    supports: "Third-party sources disagree",
  },
  18: {
    opensAt: "sheet “Peers”, row 4",
    find: "Healthium",
    sheet: "Peers",
    src: "/docs/Peer_Benchmark_Model_v3.xlsx",
    supports: "valuation reference",
  },
};
