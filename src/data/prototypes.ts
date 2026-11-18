import { IconName } from "../assets/icons";
import { ScreenKey } from "../state/screen";

export type Prototype = {
  /** Screen shown when the card is opened (add the key to `ScreenKey` and `CurrentScreen` in App.tsx). */
  key: ScreenKey;
  title: string;
  note: string;
  icon: IconName;
  tag?: string;
};

/** The start page's list. Each prototype is built in its own thread: add one entry here and one screen. */
export const PROTOTYPES: Prototype[] = [
  { key: "note", title: "Research note", note: "Our current work", icon: "fileSmall" },
  { key: "vdr", title: "VDR", note: "What we are working on now", icon: "dataRoom", tag: "In progress" },
];
