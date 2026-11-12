import { CITATION_GROUP, citationNumbers, sourceFor } from "./citations";
import { NoteSection } from "./types";

/**
 * How many times each citation number is cited in a section's text. A group like `[1,2,3,8]` counts once for each
 * of its numbers; the same number cited again elsewhere adds to its count.
 */
export function sectionCitationCounts(
  section: NoteSection,
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const block of section.body) {
    if (block.kind === "spacer") continue;
    for (const seg of block.segments) {
      seg.text.split(CITATION_GROUP).forEach((part, i) => {
        if (i % 2 === 1)
          citationNumbers(part).forEach((n) =>
            counts.set(n, (counts.get(n) ?? 0) + 1),
          );
      });
    }
  }
  return counts;
}

/** Every citation number used in a section's text, ascending. They need not be consecutive. */
export function sectionCitationNumbers(section: NoteSection): number[] {
  return [...sectionCitationCounts(section).keys()].sort((a, b) => a - b);
}

/** One row of the drawer: its citation number, title, where it lives (domain or folder) and times cited. */
export type DrawerSource = {
  n: number;
  title: string;
  origin: string;
  cited: number;
};

/** The section's sources split by where they live: web pages ("Internet") and data room files ("Sharepoint"). */
export function sectionSources(section: NoteSection): {
  internet: DrawerSource[];
  sharepoint: DrawerSource[];
} {
  const counts = sectionCitationCounts(section);
  const internet: DrawerSource[] = [];
  const sharepoint: DrawerSource[] = [];
  for (const n of sectionCitationNumbers(section)) {
    const s = sourceFor(n);
    const cited = counts.get(n) ?? 1;
    if (s.kind === "web")
      internet.push({ n, title: s.title, origin: s.host, cited });
    // Data room files show the folder they live in.
    else
      sharepoint.push({
        n,
        title: s.title,
        origin: ".../MedTech/Romsons Group",
        cited,
      });
  }
  return { internet, sharepoint };
}

/** One-paragraph "Investor perspective" per section (placeholder copy; section 1 is from Figma 501:8562). */
const PERSPECTIVE: Record<string, string> = {
  "company-overview":
    "The investment presents an opportunity to participate in a scalable business with strong market positioning, differentiated technology, and significant growth potential. While the company demonstrates attractive revenue growth and operating margins, customer concentration, competitive pressures, and regulatory exposure remain key considerations. From an investment perspective, the focus should be on the sustainability of growth, ability to diversify the customer base, and long-term margin resilience at the proposed entry valuation.",
  "background-checks":
    "Governance and people signals matter more than usual here: the Temasek-backed ownership is a positive, but the reported employee sentiment and delayed-payment claims need direct reference calls and payroll evidence before the business can be underwritten with confidence.",
  "key-risks":
    "The risks are manageable only if the data gap is closed first. Audited consolidated accounts, the shareholder agreement and a view on working capital would move most of the open items from unknown to priced.",
  "market-opportunity":
    "Demand is structurally supported by procedure volumes and the shift to single-use products, with policy tailwinds for domestic manufacturing. The open question for returns is whether Romsons can hold price in tender-led categories.",
  benchmarking:
    "Listed peers give a useful ceiling for margins and export mix, but Romsons' institutional-heavy domestic mix suggests a lower margin profile. The comparison should be rebuilt on audited periods before it informs valuation.",
  "financial-analysis":
    "Direction is positive, with sales growing faster than profit, but scale is unresolved across sources. Treat every ratio as provisional and prioritise reconciliation of standalone versus group figures.",
  "valuation-returns":
    "Returns depend on the entry multiple relative to peers and on margin durability. Until audited numbers are available the range is indicative only.",
};

export function perspectiveFor(section: NoteSection): string {
  return (
    PERSPECTIVE[section.id] ??
    "This section is part of the wider investment case; the points above should be read with the open items in the background checks and key risks sections."
  );
}
