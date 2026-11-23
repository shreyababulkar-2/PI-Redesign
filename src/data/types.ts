export type Segment = { text: string; bold?: boolean };

export type Block =
  | { kind: 'paragraph'; segments: Segment[]; marginBottom?: number }
  | { kind: 'bullet'; segments: Segment[]; marginBottom?: number }
  /** An empty 18px line (the design uses empty paragraphs as spacers). */
  | { kind: 'spacer' }
  | TableBlock
  | ChartBlock;

/**
 * A table inside the note (Figma 940:44818). The first column is the row's name (set bold); every cell may carry
 * citation markers like `[4]`, which become superscripts.
 */
export type TableBlock = {
  kind: 'table';
  title: string;
  /** Column headings with their widths; the table scrolls sideways when they add up to more than the card. */
  columns: { label: string; width: number }[];
  rows: string[][];
  marginBottom?: number;
};

/** A column chart inside the note (styled after Figma 940:49601). Title and subtitle may carry citation markers. */
export type ChartBlock = {
  kind: 'chart';
  title: string;
  subtitle: string;
  /** The value axis runs from 0 to `max`, with a rule every `step`; its labels, and the values above the columns, carry `unit`. */
  axis: { max: number; step: number; unit: string };
  bars: { label: string; value: number; /** The one the chart is about is the strong blue; the rest are pale. */ strong?: boolean }[];
  /** Figures under the plot, each a bold lead and a value. */
  facts: { lead: string; text: string }[];
  marginBottom?: number;
};

export type SectionStatus = 'vetted' | 'unvetted';

export type SectionGroup = 'main' | 'custom';

export type NoteSection = {
  /** Stable key used by the floating navigation to scroll to / highlight the section. */
  id: string;
  /** Which block of the floating navigation menu lists this section. */
  group: SectionGroup;
  index: string;
  title: string;
  status: SectionStatus;
  version: string;
  /** Max card width in the design (602 for section 1, 600 for the rest). */
  maxWidth: number;
  body: Block[];
};

/**
 * Every run of text in a block, so citations in tables and charts are found like those in paragraphs. A table
 * contributes its cells, a chart its caption; a spacer has none.
 */
export function segmentsOf(block: Block): Segment[] {
  switch (block.kind) {
    case 'paragraph':
    case 'bullet':
      return block.segments;
    case 'table':
      return block.rows.flat().map((text) => ({ text }));
    case 'chart':
      return [{ text: block.subtitle }];
    default:
      return [];
  }
}
