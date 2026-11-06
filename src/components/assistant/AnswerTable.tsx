import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../../theme';
import { assistant } from '../../data/researchNote';
import { Stroke } from '../Stroke';

const COL_METRIC = 90;
const COL_VALUE = 80;

export function AnswerTable() {
  const { columns, rows } = assistant.table;
  return (
    <View style={styles.table}>
      <View style={styles.headRow}>
        <View style={[styles.cell, { width: COL_METRIC }]}>
          <Text style={[type.tableHead, { color: colors.slate700 }]}>{columns[0]}</Text>
        </View>
        <View style={[styles.cell, { width: COL_VALUE }]}>
          <Text style={[type.tableHead, { color: colors.slate700 }]}>{columns[1]}</Text>
        </View>
        <View style={[styles.cell, styles.flex]}>
          <Text style={[type.tableHead, { color: colors.slate700 }]}>{columns[2]}</Text>
        </View>
      </View>
      {rows.map((row, i) => (
        <View key={row.metric} style={[styles.row, i < rows.length - 1 && styles.rowDivider]}>
          <View style={[styles.cell, { width: COL_METRIC }]}>
            <Text style={[type.tableLabel, { color: colors.slate800 }]}>{row.metric}</Text>
          </View>
          <View style={[styles.cell, { width: COL_VALUE }]}>
            <Text style={[type.tableValue, { color: colors.slate800 }]}>{row.value}</Text>
          </View>
          <View style={[styles.cell, styles.flex]}>
            <Text style={[type.tableRemark, { color: colors.tableRemark }]}>{row.remark}</Text>
          </View>
        </View>
      ))}
      <Stroke color={colors.tableBorder} radius={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  headRow: { flexDirection: 'row', backgroundColor: colors.dew75, alignItems: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  rowDivider: { borderBottomWidth: 0.5, borderBottomColor: colors.slate200 },
  cell: { paddingHorizontal: 10, paddingVertical: 8 },
  flex: { flex: 1 },
});
