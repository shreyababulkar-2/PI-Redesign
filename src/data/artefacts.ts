/** What the assistant has produced for the deal (the artefacts menu), and which of them the prototype can open. */
export type Artefact = { title: string; meta: string; kind: "sheet" | "doc" };

export const ARTEFACTS: Artefact[] = [
  { title: "Investment analysis", meta: "XLS · v2", kind: "sheet" },
  { title: "Revenue & EBITDA trend", meta: "DOC · v1", kind: "doc" },
  { title: "Deal summary", meta: "PDF · v1", kind: "sheet" },
  { title: "Financial model", meta: "XLS · v2", kind: "sheet" },
  { title: "Deal summary", meta: "DOC · v1", kind: "doc" },
  { title: "Investment analysis", meta: "XLS · v2", kind: "sheet" },
  { title: "Investment analysis", meta: "PDF · v1", kind: "doc" },
];

/** Artefacts open in the document drawer as tabs, by title. */
export const isArtefact = (title: string) => ARTEFACTS.some((a) => a.title === title);
