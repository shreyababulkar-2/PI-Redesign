import {
  ComponentRef,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from "react-native";
import { colors, fonts } from "../../../../theme";
import { CellSource } from "../../data/benchmarking";
import { sourceFor } from "../../../../data/citations";
import { ExpandedSource } from "../../../../components/viewer/DocumentViewer";
import { useHover } from "../../../../hooks/useHover";
import { Icon } from "../../../../components/Icon";
import { pointer } from "../../../../theme/cursor";
import { transition } from "../../../../theme/motion";

/**
 * The card that hangs under a flagged cell or row number (Figma 829:8429 / 829:10779): "Current value derived from N sources" and one
 * row per source, each with its data room folder and a link that opens it full size in a modal. When the sources
 * disagree the card says so and shows the figure each source gives. It is drawn once, at the page level, in window
 * coordinates, so the card is never cut off by the table's scroller or the cards around it.
 */

export type CardSpec = {
  sources: CellSource[];
  /** The sources report different figures. */
  conflict?: boolean;
  /** The card is for a whole row (its flag is on the row number), not one figure. */
  row?: boolean;
};

type Host = {
  /** Shows the card under `anchor` (a view in the table). */
  show: (anchor: ComponentRef<typeof View> | null, spec: CardSpec) => void;
  /** Hides it shortly after the pointer leaves, unless the pointer is on the card. */
  hide: () => void;
};

const SourceCardContext = createContext<Host | null>(null);

/** Hands out `show`/`hide` to the table cells; a no-op outside a provider. */
export function useSourceCard(): Host {
  return useContext(SourceCardContext) ?? { show: () => {}, hide: () => {} };
}

const CARD_W = 240;
const GAP = 4;

const fixed = (style: ViewStyle): ViewStyle =>
  (Platform.OS === "web" ? { position: "fixed", ...style } : { position: "absolute", ...style }) as ViewStyle;

export function SourceCardProvider({ children }: { children: ReactNode }) {
  // x is the cell's left edge, `below` the y just under it and `above` the y just over it, all in window coordinates.
  const [card, setCard] = useState<{ x: number; below: number; above: number; spec: CardSpec } | null>(null);
  // The source open in the full-size modal, by citation number.
  const [source, setSource] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { width: windowW, height: windowH } = useWindowDimensions();
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => cancel, []);

  const show = useCallback((anchor: ComponentRef<typeof View> | null, spec: CardSpec) => {
    cancel();
    if (!anchor) return;
    anchor.measureInWindow((x: number, y: number, _w: number, h: number) => {
      setCard({ x, below: y + h + GAP, above: y - GAP, spec });
    });
  }, []);
  const hide = useCallback(() => {
    cancel();
    timer.current = setTimeout(() => setCard(null), 140);
  }, []);
  const host = useMemo(() => ({ show, hide }), [show, hide]);

  // Keep the card on screen: pulled in from the right edge, and flipped above the cell when it would run off the bottom.
  const viewW = Platform.OS === "web" ? document.documentElement.clientWidth : windowW;
  const viewH = Platform.OS === "web" ? window.innerHeight : windowH;
  // On the web the card is drawn straight into the document body: a pinned ancestor (or one with a transform) would
  // otherwise change what "fixed" is measured from and shift the card off its cell.
  const layer = (node: ReactNode) =>
    Platform.OS === "web" && typeof document !== "undefined" ? createPortal(node, document.body) : node;
  const left = card ? Math.max(8, Math.min(card.x, viewW - CARD_W - 8)) : 0;
  const height = card ? 36 + card.spec.sources.length * 52 : 0;
  const flip = card ? card.below + height > viewH - 8 && card.above - height > 8 : false;
  return (
    <SourceCardContext.Provider value={host}>
      {children}
      {source !== null && (
        <ExpandedSource
          source={sourceFor(source)}
          n={source}
          claim=""
          onClose={() => setSource(null)}
        />
      )}
      {card && layer(
        <View
          // The card stays while the pointer is on it, so its rows can be clicked.
          {...({ onMouseEnter: cancel, onMouseLeave: hide } as object)}
          style={fixed(
            flip
              ? { left, bottom: viewH - card.above, width: CARD_W, zIndex: 1000 }
              : { left, top: card.below, width: CARD_W, zIndex: 1000 },
          )}
        >
          <CardBody spec={card.spec} onOpen={(n) => { setCard(null); setSource(n); }} />
        </View>,
      )}
    </SourceCardContext.Provider>
  );
}

function CardBody({ spec, onOpen }: { spec: CardSpec; onOpen: (n: number) => void }) {
  const { sources, conflict, row } = spec;
  return (
    <View style={styles.card}>
      <View style={styles.list}>
        <Text style={styles.title}>
          {`Current ${row ? "values" : "value"} derived from ${sources.length} ${sources.length === 1 ? "source" : "sources"}`}
        </Text>
        {sources.map((s, i) => (
          <SourceRow
            key={`${s.n}-${i}`}
            source={s}
            // Each source is followed by a rule; the last one only when the conflict notice sits under it.
            rule={i < sources.length - 1 || !!conflict}
            onPress={() => onOpen(s.n)}
          />
        ))}
      </View>
      {conflict && (
        <View style={styles.notice}>
          <Icon name="cardWarning" size={16} />
          <Text numberOfLines={1} style={styles.noticeText}>
            {`${distinctFigures(sources)} conflicting values from sources`}
          </Text>
        </View>
      )}
    </View>
  );
}

/** How many different figures the sources give. */
const distinctFigures = (sources: CellSource[]) => new Set(sources.map((s) => s.value)).size;

function SourceRow({ source, rule, onPress }: { source: CellSource; rule: boolean; onPress: () => void }) {
  const hover = useHover();
  const info = sourceFor(source.n);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open source ${source.n}: ${info.title}`}
        onPress={onPress}
        {...hover.handlers}
        style={[styles.row, hover.hovered && styles.rowHover]}
      >
        <View style={styles.rowText}>
          <Text numberOfLines={1} style={styles.file}>{`${source.n}. ${info.title}`}</Text>
          <View style={styles.folder}>
            <Icon name="cardFolder" size={12} />
            <Text style={styles.folderText}>{info.kind === "web" ? info.host : "Data Room"}</Text>
          </View>
        </View>
        <View style={styles.chevron}>
          <Icon name="cardChevron" size={12} />
        </View>
      </Pressable>
      {rule && <View style={styles.rule} />}
    </>
  );
}

const styles = StyleSheet.create({
  // White card, 8px radius, 10/8 padding, a hairline and a soft two-layer shadow (Figma 829:19698).
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.slate100,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    boxShadow: "0px 1px 3px rgba(24,27,37,0.05), 0px 8px 24px rgba(24,27,37,0.1)",
  } as ViewStyle,
  list: { gap: 2 },
  title: { fontFamily: fonts.geistRegular, fontSize: 10, color: colors.slate500 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderRadius: 6,
    ...pointer,
    ...transition(["background-color"]),
  },
  rowHover: { backgroundColor: colors.slate50 },
  rowText: { flex: 1, minWidth: 0, gap: 4, justifyContent: "center" },
  file: { fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 18, letterSpacing: 0.0825, color: colors.slate900 },
  folder: { flexDirection: "row", alignItems: "center", gap: 2, paddingLeft: 4 },
  folderText: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 12, letterSpacing: 0.055, color: colors.pine700 },
  chevron: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  // The separator under each source: the library's slate 200 at half strength.
  rule: { height: 1, backgroundColor: "rgba(225,228,234,0.5)" },
  // The conflict notice under the list: pale red with a warning triangle.
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#ffebec",
  },
  noticeText: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 16, letterSpacing: 0.0825, color: "#d02533" },
});
