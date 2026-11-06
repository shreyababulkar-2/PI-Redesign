export type Segment = { text: string; bold?: boolean };

export type Block =
  | { kind: 'paragraph'; segments: Segment[]; marginBottom?: number }
  | { kind: 'bullet'; segments: Segment[]; marginBottom?: number }
  /** An empty 18px line (the design uses empty paragraphs as spacers). */
  | { kind: 'spacer' };

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
