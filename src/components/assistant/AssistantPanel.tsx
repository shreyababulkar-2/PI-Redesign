import { Pressable, ScrollView, StyleSheet, Text, TextStyle, View } from "react-native";
import { colors, type } from "../../theme";
import { assistant } from "../../data/researchNote";
import { Icon } from "../Icon";
import { RichText } from "../note/RichText";
import { AnswerTable } from "./AnswerTable";
import { BackgroundGlow } from "./BackgroundGlow";
import { Composer } from "./Composer";
import { Stroke } from "../Stroke";
import { pointer } from "../../theme/cursor";

type Props = {
  /** When set, the collapse icon in the header calls this (used when the assistant is an overlay). */
  onCollapse?: () => void;
};

export function AssistantPanel({ onCollapse }: Props) {
  const [thought, files, sources] = assistant.thought;
  const thoughtText = [type.thought, { color: colors.slate500 }];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Icon name="assistantLogo" size={20} width={19.167} />
          <Text style={[type.assistantTitle, { color: colors.white }]}>
            Assistant
          </Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.headerButton}>
            <Icon name="addCircle" size={20} />
          </View>
          <View style={styles.headerButton}>
            <Icon name="history" size={20} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Collapse assistant"
            disabled={!onCollapse}
            onPress={onCollapse}
            style={styles.headerButton}
          >
            <Icon name="collapse" size={20} />
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        <BackgroundGlow />

        <View style={styles.chat}>
          <ScrollView
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.userRow}>
              <View style={styles.userBubble}>
                <Text
                  style={[
                    type.chatBubble,
                    styles.userText,
                    { color: colors.slate800 },
                  ]}
                >
                  {assistant.userMessage}
                </Text>
              </View>
            </View>

            <View style={styles.response}>
              <View style={styles.responseMain}>
                <View style={styles.answerBlock}>
                  <View style={styles.thoughtRow}>
                    <View style={styles.thoughtLeft}>
                      <Text style={thoughtText}>{thought}</Text>
                      <Icon name="ellipseDot" size={2} />
                      <Text style={thoughtText}>{files}</Text>
                      <Icon name="ellipseDot" size={2} />
                      <Text style={thoughtText}>{sources}</Text>
                    </View>
                    <Icon name="thoughtChevron" size={16} />
                  </View>

                  <RichText
                    blocks={assistant.answer}
                    regular={type.answer}
                    bold={type.answerBold}
                    color={colors.slate800}
                  />
                </View>

                <View style={styles.analysis}>
                  <View style={styles.analysisHeader}>
                    <Text style={[type.answerBold, { color: colors.slate800 }]}>
                      {assistant.tableTitle}
                    </Text>
                    <View style={styles.expand}>
                      <Icon name="expand" size={20} />
                    </View>
                  </View>
                  <AnswerTable />
                </View>
              </View>

              <View style={styles.copyButton}>
                <Icon name="copySmall" size={16} />
              </View>
            </View>
          </ScrollView>
        </View>

        <Composer />
        <Stroke color={colors.slate100} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
  },
  header: {
    height: 40,
    backgroundColor: colors.pine800,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  headerButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
  },
  body: {
    flex: 1,
    overflow: "hidden",
    paddingVertical: 16,
    gap: 32,
    alignItems: "center",
  },
  chat: { flex: 1, width: "100%" },
  chatScroll: { flex: 1 },
  chatContent: { paddingHorizontal: 16, gap: 20 },
  userRow: { width: "100%", alignItems: "flex-end", paddingLeft: 32 },
  userBubble: {
    // 73% of the chat width = the design's 265px at the 396px panel, and it scales with the panel.
    width: "73%",
    backgroundColor: colors.dew75,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 4,
  },
  userText: { textAlign: "left", textWrap: "pretty" } as TextStyle,
  response: { width: "100%", gap: 4 },
  responseMain: { width: "100%", gap: 12 },
  thoughtRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 16,
    ...pointer,
  },
  answerBlock: { width: "100%", gap: 12 },
  thoughtLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  analysis: { width: "100%", gap: 12 },
  analysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expand: { width: 20, height: 20, ...pointer },
  copyButton: {
    width: 24,
    height: 24,
    padding: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
  },
});
