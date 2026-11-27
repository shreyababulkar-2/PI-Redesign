import { IconName } from "../assets/icons";
import { ScreenKey } from "../state/screen";

export type Prototype = {
  /** Screen shown when the card is opened (add the key to `ScreenKey` and `CurrentScreen` in App.tsx). VDR v2 lives in src/v2.. */
  key: ScreenKey;
  title: string;
  icon: IconName;
  tag?: string;
  /** The start page's layer it is listed under: what is being worked on, or frozen copies kept for reference. */
  group: "prototypes" | "archived";
};

/**
 * The start page's list. Each prototype is built in its own thread: add one entry here and one screen.
 * Archived entries are frozen snapshots (Deal scan v1 lives in src/archive/dealScan); work continues in the prototypes.
 */
export const PROTOTYPES: Prototype[] = [
  { key: "note", title: "Deal scan", icon: "fileSmall", tag: "In progress", group: "prototypes" },
  { key: "vdr", title: "VDR v1", icon: "dataRoom", group: "prototypes" },
  { key: "vdr2", title: "VDR v2", icon: "dataRoom", tag: "In progress", group: "prototypes" },
  { key: "noteArchive", title: "Deal scan v1", icon: "fileSmall", group: "archived" },
];
