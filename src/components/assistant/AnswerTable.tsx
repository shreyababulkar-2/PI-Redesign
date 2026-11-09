import { StyleSheet, Text, View } from "react-native";
import { colors, type } from "../../theme";
import { AnswerTableSpec } from "../../data/assistantAnswers";
import { Stroke } from "../Stroke";

/**
 * The answer table (Figma "Investment analysis"): a pale-green header row, a bold first column and
 * hairline row dividers. Column widths and which columns read as muted remarks come from the spec.
 */
export function AnswerTable({ spec }: { spec: AnswerTableSpec }) {
  const { columns, rows, widths, muted = [] } = spec;
  const cellStyle = (c: number) => [
    styles.cell,
    widths[c] == null ? styles.flex : { width: widths[c] as number },
  ];
  const textFor = (c: number) =>
    c === 0
      ? [type.tableLabel, { color: colors.slate800 }]
      : muted.includes(c)
        ? [type.tableRemark, { color: colors.tableRemark }]
        : [type.tableValue, { color: colors.slate800 }];

  return (
    <View style={styles.table}>
      <View style={styles.headRow}>
        {columns.map((label, c) => (
          <View key={label} style={cellStyle(c)}>
            <Text style={[type.tableHead, { color: colors.slate700 }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((row, i) => (
        <View
          key={row[0]}
          style={[styles.row, i < rows.length - 1 && styles.rowDivider]}
        >
          {row.map((value, c) => (
            <View key={c} style={cellStyle(c)}>
              <Text style={textFor(c)}>{value}</Text>
            </View>
          ))}
        </View>
      ))}
      <Stroke color={colors.tableBorder} radius={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  table: { width: "100%", borderRadius: 8, overflow: "hidden" },
  headRow: {
    flexDirection: "row",
    backgroundColor: colors.dew75,
    alignItems: "stretch",
  },
  row: { flexDirection: "row", alignItems: "stretch" },
  rowDivider: { borderBottomWidth: 0.5, borderBottomColor: colors.slate200 },
  cell: { paddingHorizontal: 10, paddingVertical: 8 },
  flex: { flex: 1 },
});
