import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { avatarGroup, companyLogo } from "../../assets/images";
import { colors, type } from "../../theme";
import { HEADER_TOP } from "../../theme/layout";
import { company, noteTabs } from "../../data/researchNote";
import { Icon } from "../Icon";
import { NoteTab } from "./NoteTab";
import { StageChip } from "./Chip";
import { BENCHMARK_MENU_ITEMS, KebabMenu } from "./KebabMenu";
import { WithTooltip } from "../Tooltip";
import { AssistantButton } from "../AssistantButton";
import { pointer } from "../../theme/cursor";
import { press, transition } from "../../theme/motion";
import { useHover } from "../../hooks/useHover";
import { useActiveTab } from "../../state/activeTab";

type Props = { activeTab: number };

/** Default (unscrolled) header: a white card with the company, note tabs and page actions. */
export function NoteHeader({ activeTab }: Props) {
  return (
    <View style={styles.root}>
      <NoteHeaderContent activeTab={activeTab} />
    </View>
  );
}

/** The header's inner layout without the card chrome, so it can live inside a morphing container. */
export function NoteHeaderContent({ activeTab }: Props) {
  const hoverDownload = useHover();
  const { setTab } = useActiveTab();
  return (
    <View style={styles.content}>
      <View style={styles.left}>
        <View style={styles.company}>
          <View style={styles.logoOuter}>
            <Image
              source={companyLogo}
              contentFit="cover"
              style={styles.logo}
            />
          </View>
          <Text style={[type.companyName, styles.companyName]}>
            {company.name}
          </Text>
          <View style={styles.stage}>
            <StageChip label={company.stage} />
          </View>
        </View>
        <View style={styles.tabs}>
          {noteTabs.map((label, i) => (
            <NoteTab
              key={label}
              label={label}
              active={i === activeTab}
              onPress={() => setTab(i)}
            />
          ))}
        </View>
      </View>

      <View style={styles.right}>
        {/* Collaborators (Figma 439:25170): three overlapping avatars, then a hairline divider. */}
        <WithTooltip text="Manage members" side="bottom">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Manage members"
            style={({ pressed }) => press(pressed)}
          >
            <Image
              source={avatarGroup}
              contentFit="contain"
              style={styles.avatars}
            />
          </Pressable>
        </WithTooltip>
        <View style={styles.rightDivider} />
        <View style={styles.rightButtons}>
          <WithTooltip text="Download" side="bottom">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Download"
              {...hoverDownload.handlers}
              style={({ pressed }) => press(pressed)}
            >
              {/* Hover (Figma 501:8232): the button darkens a step and the arrow turns green; the two fade into each other. */}
              <Icon name="topbarDownload" size={28} style={pointer} />
              <View
                pointerEvents="none"
                style={[
                  styles.downloadHover,
                  { opacity: hoverDownload.hovered ? 1 : 0 },
                  transition(["opacity"], 150),
                ]}
              >
                <Icon name="topbarDownloadHover" size={28} />
              </View>
            </Pressable>
          </WithTooltip>
          <KebabMenu
            {...(activeTab === 2
              ? { items: BENCHMARK_MENU_ITEMS, width: 191 }
              : null)}
          >
            {({ open, toggle }) => (
              <WithTooltip text="More" side="bottom" disabled={open}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="More actions"
                  accessibilityState={{ expanded: open }}
                  onPress={toggle}
                  style={({ pressed }) => press(pressed)}
                >
                  <Icon name="topbarMore" size={28} style={pointer} />
                  {/* While the menu is open the button gets a hairline outline (Figma 441:32461). */}
                  {open && (
                    <View pointerEvents="none" style={styles.openOutline} />
                  )}
                </Pressable>
              </WithTooltip>
            )}
          </KebabMenu>
          <AssistantButton size={28} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Soft drop shadow as on the header card in the Benchmarking design (0 1 6, 8% black).
  // zIndex lifts the kebab menu above the section cards' action icons that follow the header.
  root: {
    position: "relative",
    zIndex: 40,
    marginTop: HEADER_TOP,
    backgroundColor: colors.white,
    borderRadius: 8,
    boxShadow: "0px 1px 6px rgba(0,0,0,0.08)",
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  left: { gap: 12 },
  company: { flexDirection: "row", alignItems: "center", gap: 4 },
  companyName: { color: colors.slate600, textTransform: "uppercase" },
  logoOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 16, height: 16, borderRadius: 8 },
  downloadHover: { position: "absolute", left: 0, top: 0 },
  openOutline: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e1e4ea",
  },
  // 8px between the name and the chip (the row gap is 4).
  stage: { marginLeft: 4 },
  tabs: { flexDirection: "row", gap: 8 },
  right: { flexDirection: "row", alignItems: "center", gap: 12 },
  rightButtons: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatars: { width: 60, height: 28 },
  rightDivider: {
    width: 1,
    height: 16,
    borderRadius: 100,
    backgroundColor: "#e1e4ea",
  },
});
