import { ReactNode, useEffect, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, fonts } from "../../theme";
import { pointer } from "../../theme/cursor";
import { transition } from "../../theme/motion";
import { IcWorkbook } from "../../data/financialModel";
import { SheetCell } from "../../data/workbooks";

/**
 * An artefact workbook (Financial model, Investment analysis): an Excel file shown as a grid, the way the citation drawer shows spreadsheets (column
 * letters, row numbers, hairline cell borders, a tinted title row), with the workbook's sheets as tabs above it. The column
 * letters stay put while the rows scroll down and the row numbers while the columns scroll across (`position: sticky`
 * inside the artefact frame's scroller). The workbook is a fixed example.
 */

const COLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ROW_NUM_W = 36;
const ROW_H = 28;
/** Like Excel, the grid carries on with empty rows so the sheet always fills the frame. */
const MIN_ROWS = 30;

const sticky = (extra: ViewStyle): ViewStyle =>
  (Platform.OS === "web" ? { position: "sticky", ...extra } : extra) as ViewStyle;

/** The grid fades in when a sheet is chosen (opacity only, so the sticky headers are left alone). */
function SheetFade({ children }: { children: ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [opacity]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

export function WorkbookSheet({ workbook }: { workbook: IcWorkbook }) {
  const [index, setIndex] = useState(0);
  const sheet = workbook.sheets[index];
  const width = ROW_NUM_W + sheet.widths.reduce((a, w) => a + w, 0);
  return (
    <View>
      <View style={sticky({ left: 0, zIndex: 8, alignSelf: "flex-start" })}>
        <View style={styles.tabs}>
          {workbook.sheets.length > 1 && workbook.sheets.map((s, i) => {
            const on = i === index;
            return (
              <Pressable
                key={s.name}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setIndex(i)}
                style={[styles.tab, on && styles.tabOn, pointer, transition(["background-color"])]}
              >
                <Text style={[styles.tabText, { fontFamily: on ? fonts.geistSemiBold : fonts.geistRegular }]}>{s.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <SheetFade key={index}>
      <View style={{ width }}>
        <View style={[styles.row, sticky({ top: 0, zIndex: 6 })]}>
          <View style={[styles.head, { width: ROW_NUM_W }, sticky({ left: 0, zIndex: 7 })]} />
          {sheet.widths.map((w, c) => (
            <View key={c} style={[styles.head, { width: w }]}>
              <Text style={styles.headText}>{COLS[c]}</Text>
            </View>
          ))}
        </View>
        {[...sheet.rows, ...Array.from({ length: Math.max(0, MIN_ROWS - sheet.rows.length) }, () => sheet.widths.map((): SheetCell => ({ v: "" })))].map((row, r) => (
          <View key={r} style={styles.row}>
            <View style={[styles.head, { width: ROW_NUM_W }, sticky({ left: 0, zIndex: 3 })]}>
              <Text style={styles.headText}>{r + 1}</Text>
            </View>
            {row.map((cell, c) => (
              <View
                key={c}
                style={[styles.cell, { width: sheet.widths[c] }, sheet.headerRows.includes(r) && styles.titleCell]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.cellText,
                    {
                      textAlign: cell.align ?? "left",
                      ...(cell.color ? { color: cell.color } : null),
                      fontFamily: cell.bold || sheet.headerRows.includes(r) ? fonts.geistSemiBold : fonts.geistRegular,
                    },
                  ]}
                >
                  {cell.v}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
      </SheetFade>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: 4, paddingBottom: 10 },
  tab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  tabOn: { backgroundColor: "#eef3f0" },
  tabText: { fontSize: 12, lineHeight: 16, color: colors.slate800 },
  row: { flexDirection: "row" },
  head: {
    height: ROW_H,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f2f5",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e1e4ea",
  },
  headText: { fontFamily: fonts.geistRegular, fontSize: 11, color: "#717784" },
  cell: {
    height: ROW_H,
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eceff3",
    backgroundColor: colors.white,
  },
  titleCell: { backgroundColor: "#eef3f0" },
  cellText: { fontSize: 11, color: "#2b303b" },
});
