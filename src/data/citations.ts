/** A source a citation points to: a web page (with its host) or a file in the data room. */
export type Source = { title: string; kind: 'web' | 'dataroom'; host: string };

/** Example sources, by citation number: 1, 2, 3 and 8 are from Figma "WIP - Citations" (501:7918), the rest are made up to match. */
const SOURCES: Record<number, Source> = {
  1: { title: 'Supply Chain Data Of Romsons Group', kind: 'web', host: 'trademo.com' },
  2: { title: 'S3055_NAV_Report_FY2023_Q3.pdf', kind: 'dataroom', host: 'Data Room' },
  3: {
    title:
      'CCI approves the proposed combination involving inter-alia subscription to certain CCPS and acquisition of certain equity share capital of Romsons Group by Jongsong Investments',
    kind: 'web',
    host: 'pib.gov.in',
  },
  4: { title: 'Romsons_Product_Catalogue_2024.pdf', kind: 'dataroom', host: 'Data Room' },
  5: { title: 'Romsons_Annual_Report_FY2023-24.pdf', kind: 'dataroom', host: 'Data Room' },
  6: { title: 'Romsons International Employee Reviews and Ratings', kind: 'web', host: 'justdial.com' },
  7: { title: 'Romsons Group Private Limited - Company Profile and Directors', kind: 'web', host: 'zaubacorp.com' },
  8: { title: 'RP_HLDGPOSI_APIALL_Holding.xls', kind: 'dataroom', host: 'Data Room' },
  9: { title: 'Master Data: Romsons Group Private Limited (CIN U24236UP1977PTC004511)', kind: 'web', host: 'mca.gov.in' },
  10: { title: 'Romsons Group Export Shipment Records FY2023', kind: 'web', host: 'trademo.com' },
  11: { title: 'IC_Discussion_Notes_Romsons_Oct26.docx', kind: 'dataroom', host: 'Data Room' },
  12: { title: 'Romsons Group: Rating Rationale and Financial Summary', kind: 'web', host: 'crisil.com' },
  13: { title: 'Temasek arm picks up minority stake in Romsons Group', kind: 'web', host: 'economictimes.com' },
  14: { title: 'Indian Medical Devices Industry: Market Size, Segments and Growth Outlook', kind: 'web', host: 'ibef.org' },
  15: { title: 'Production Linked Incentive Scheme for Promotion of Medical Devices Manufacturing', kind: 'web', host: 'pib.gov.in' },
  16: { title: 'Romsons Group: Key Financials and Peer Comparison', kind: 'web', host: 'screener.in' },
  17: { title: 'Poly Medicure Annual Report FY2024-25', kind: 'web', host: 'polymedicure.com' },
  18: { title: 'Peer_Benchmark_Model_v3.xlsx', kind: 'dataroom', host: 'Data Room' },
};

export function sourceFor(n: number): Source {
  return SOURCES[n] ?? { title: `Source ${n}`, kind: 'dataroom', host: 'Data Room' };
}

/**
 * Citation markers in the copy: `[1,2]` or `[#6]`, and several markers in a row (`[7][9]`) count as one place.
 * The capture group makes `String.split` keep the markers, so odd entries are citations.
 */
export const CITATION_GROUP = /((?:\[#?\d+(?:\s*,\s*\d+)*\]\s?)+)/;

/** Every number in a run of markers, sorted and without duplicates. */
export function citationNumbers(raw: string): number[] {
  const nums = [...raw.matchAll(/\d+/g)].map((m) => parseInt(m[0], 10));
  return [...new Set(nums)].sort((a, b) => a - b);
}

/** `1,2,3,8` is shown as `1-3,8` (no brackets: it is set as a superscript): runs of three or more collapse into a range, shorter runs stay listed. */
export function formatCitations(numbers: number[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < numbers.length) {
    let j = i;
    while (j + 1 < numbers.length && numbers[j + 1] === numbers[j] + 1) j++;
    if (j - i >= 2) parts.push(`${numbers[i]}-${numbers[j]}`);
    else for (let k = i; k <= j; k++) parts.push(String(numbers[k]));
    i = j + 1;
  }
  return parts.join(',');
}
