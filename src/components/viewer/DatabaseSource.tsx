import { ReactNode, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../theme";
import { DATABASE_SOURCES } from "../../data/databaseSources";
import { useHover } from "../../hooks/useHover";
import { pointer } from "../../theme/cursor";
import { press, transition } from "../../theme/motion";
import { Icon } from "../Icon";
import { WithTooltip } from "../Tooltip";

/**
 * A source that comes from a database (Figma 916:23883, 916:35330). The database itself is not shown: the reader gets
 * what was asked of it, either in plain words ("Explained") or as the SQL that was run ("SQL query", copyable), and
 * under both the rows it returned. The toggle is the only state.
 */
type Mode = "explained" | "sql";

export function DatabaseSource({ n }: { n: number }) {
  const db = DATABASE_SOURCES[n];
  const [view, setView] = useState<Mode>("explained");
  if (!db) return null;
  return (
    <View style={styles.root}>
      <View style={styles.sourceHeader}>
        <Text style={styles.sourceLabel}>Source</Text>
        <Toggle view={view} onChange={setView} />
      </View>
      {view === "explained" ? (
        <Card>
          <CardHeader title="Database request">
            <CopyButton
              label="Copy request"
              text={db.request.map((r) => `${r.label}: ${r.value}`).join("\n")}
            />
          </CardHeader>
          {db.request.map((r) => (
            <View key={r.label} style={styles.fact}>
              <Text style={styles.factLabel}>{r.label}</Text>
              <Text style={styles.factValue}>{r.value}</Text>
            </View>
          ))}
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={db.file}
            note={db.dialect}
            noteBesideTitle
          >
            <CopyButton label="Copy query" text={db.sql.join("\n")} />
          </CardHeader>
          <View style={styles.code}>
            {db.sql.map((line, i) => (
              <View key={i} style={styles.codeLine}>
                <Text style={styles.lineNo}>{i + 1}</Text>
                <Text style={styles.codeText}>{highlight(line)}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}
      <Card>
        <CardHeader title="Database result" note={db.result.meta} />
        <View style={styles.row}>
          {db.result.columns.map((c, i) => (
            <View key={c} style={[styles.cell, i === 0 ? styles.cellFirst : styles.cellEnd]}>
              <Text style={styles.columnText}>{c}</Text>
            </View>
          ))}
        </View>
        {db.result.rows.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((v, i) => (
              <View key={i} style={[styles.cell, i === 0 ? styles.cellFirst : styles.cellEnd]}>
                <Text style={i === 0 ? styles.keyText : styles.monoText}>{v}</Text>
              </View>
            ))}
          </View>
        ))}
      </Card>
    </View>
  );
}

/** The Explained / SQL query switch: a pale track with the chosen segment raised on white. */
function Toggle({ view, onChange }: { view: Mode; onChange: (v: Mode) => void }) {
  return (
    <View accessibilityRole="radiogroup" style={styles.toggle}>
      {(
        [
          ["explained", "Explained"],
          ["sql", "SQL query"],
        ] as const
      ).map(([key, label]) => (
        <Segment key={key} label={label} on={view === key} onPress={() => onChange(key)} />
      ))}
    </View>
  );
}

function Segment({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.segment,
        on && styles.segmentOn,
        transition(["background-color", "color"]),
        press(pressed),
      ]}
    >
      <Text style={[styles.segmentText, on ? { color: colors.pine800 } : hover.hovered && { color: colors.slate800 }]}>{label}</Text>
    </Pressable>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

/** The pale bar a card opens with: a title (and a note beside it or at the far end) and an action at the end. */
function CardHeader({
  title,
  note,
  noteBesideTitle = false,
  children,
}: {
  title: string;
  note?: string;
  /** The note sits next to the title (the dialect, after the file name) instead of at the far end. */
  noteBesideTitle?: boolean;
  children?: ReactNode;
}) {
  return (
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderLeft}>
        <Text style={styles.cardTitle}>{title}</Text>
        {note && noteBesideTitle && <Text style={styles.cardNote}>{note}</Text>}
      </View>
      {note && !noteBesideTitle && <Text style={styles.cardNote}>{note}</Text>}
      {children}
    </View>
  );
}

/** Copies text to the clipboard. The tooltip says "Copied" for a moment afterwards. */
function CopyButton({ label, text }: { label: string; text: string }) {
  const hover = useHover();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = () => {
    if (Platform.OS === "web" && typeof navigator !== "undefined") void navigator.clipboard?.writeText(text);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };
  return (
    <WithTooltip text={copied ? "Copied" : label} side="bottom">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={copy}
        {...hover.handlers}
        style={({ pressed }) => [styles.copy, hover.hovered && { backgroundColor: colors.slate100 }, transition(["background-color"]), press(pressed)]}
      >
        <Icon name="dbCopy" size={16} />
      </Pressable>
    </WithTooltip>
  );
}

/* ----------------------------------------------------------- highlighting */

const KEYWORDS = new Set(["SELECT", "FROM", "WHERE", "AND", "IN", "GROUP BY", "ORDER BY", "AS", "SUM"]);
const TOKEN = /('[^']*')|\b(GROUP BY|ORDER BY|SELECT|FROM|WHERE|AND|IN|AS|SUM)\b|\b(\d+)\b/g;

/** One line of SQL as coloured runs: keywords in blue and medium weight, strings in amber, numbers in green. */
function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of line.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(line.slice(last, at));
    const word = m[0];
    if (m[1]) out.push(<Text key={key++} style={{ color: "#a78025" }}>{word}</Text>);
    else if (m[2] && KEYWORDS.has(word)) out.push(<Text key={key++} style={styles.keyword}>{word}</Text>);
    else if (m[3]) out.push(<Text key={key++} style={{ color: colors.pine700 }}>{word}</Text>);
    else out.push(word);
    last = at + word.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

/* ------------------------------------------------------------------ styles */

const MONO = { fontFamily: fonts.geistMonoRegular, fontSize: 11, lineHeight: 18 } as const;

const styles = StyleSheet.create({
  root: { gap: 8 },
  sourceHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sourceLabel: { fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 18, letterSpacing: 0.144, color: colors.slate600 },
  toggle: { flexDirection: "row", gap: 2, padding: 2, borderRadius: 8, backgroundColor: "#f9fafc" },
  segment: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignItems: "center", justifyContent: "center", ...pointer },
  segmentOn: { backgroundColor: colors.white, boxShadow: "0px 1px 3px rgba(0,0,0,0.08)" } as object,
  segmentText: { fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 16, letterSpacing: 0.0825, color: colors.slate600 },
  card: { borderRadius: 8, borderWidth: 1, borderColor: colors.slate100, backgroundColor: colors.white, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.slate50 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  cardTitle: { fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 16, letterSpacing: 0.0825, color: colors.slate800 },
  cardNote: { fontFamily: fonts.geistRegular, fontSize: 10, lineHeight: 14, letterSpacing: 0.05, color: colors.slate500 },
  copy: { width: 16, height: 16, alignItems: "center", justifyContent: "center", borderRadius: 4, ...pointer },
  fact: { flexDirection: "row", gap: 12, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.slate100 },
  factLabel: { width: 84, fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 16, letterSpacing: 0.0825, color: colors.slate500 },
  factValue: { flex: 1, minWidth: 0, fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 16, letterSpacing: 0.0825, color: colors.slate800 },
  code: { gap: 2, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.white },
  codeLine: { flexDirection: "row", gap: 12 },
  lineNo: { ...MONO, width: 14, textAlign: "right", color: colors.slate400 },
  codeText: { ...MONO, color: colors.slate800, whiteSpace: "pre" } as object,
  keyword: { fontFamily: fonts.geistMonoMedium, color: "#2547d0" },
  row: { flexDirection: "row", alignItems: "center" },
  cell: { flex: 1, minWidth: 0, paddingHorizontal: 12, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.slate100 },
  cellFirst: { borderRightWidth: 1, borderRightColor: colors.slate100, alignItems: "flex-start" },
  cellEnd: { alignItems: "flex-end" },
  columnText: { fontFamily: fonts.geistRegular, fontSize: 10, lineHeight: 16, letterSpacing: 0.0825, color: colors.slate600, textTransform: "uppercase" },
  keyText: { fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 16, color: colors.slate800 },
  monoText: { fontFamily: fonts.geistMonoRegular, fontSize: 11, lineHeight: 16, color: colors.slate800 },
});
