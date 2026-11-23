import { IconName } from "../assets/icons";
import { ScreenKey } from "../state/screen";

export type Prototype = {
  /** Screen shown when the card is opened (add the key to `ScreenKey` and `CurrentScreen` in App.tsx). VDR v2 lives in src/v2.. */
  key: ScreenKey;
  title: string;
  icon: IconName;
  tag?: string;
};

/** The start page's list. Each prototype is built in its own thread: add one entry here and one screen. */
export const PROTOTYPES: Prototype[] = [
  { key: "note", title: "Deal scan", icon: "fileSmall" },
  { key: "vdr", title: "VDR v1", icon: "dataRoom" },
  { key: "vdr2", title: "VDR v2", icon: "dataRoom", tag: "In progress" },
];
