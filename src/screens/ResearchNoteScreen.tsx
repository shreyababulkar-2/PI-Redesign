import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";
import { HEADER_EXPANDED_HEIGHT } from "../theme/layout";
import { noteTabs, sections } from "../data/researchNote";
import { SideNav } from "../components/SideNav";
import { FloatingHeaderLayer } from "../components/note/FloatingHeaderLayer";
import { appear, leaving } from "../theme/motion";
import { NOTE_CONTENT_ID } from "../state/selectionContext";
import { NoteHeader } from "../components/note/NoteHeader";
import { SectionCard } from "../components/note/SectionCard";
import { Minimap } from "../components/note/Minimap";
import { ZoomControls } from "../components/note/ZoomControls";
import { useSectionNavigation } from "../hooks/useSectionNavigation";
import { ResizableAssistant } from "../components/assistant/ResizableAssistant";
import { BenchmarkingPage } from "../components/benchmarking/BenchmarkingPage";
import { BENCHMARK_TABS, useActiveTab } from "../state/activeTab";

/** How long the old page takes to leave when switching tabs from a scrolled position. */
const SCROLLED_SWITCH_MS = 260;

/** Header tab indexes (see `noteTabs`). */
const TAB_RESEARCH = 0;
const TAB_BENCHMARKING = 2;

const sectionIds = sections.map((s) => s.id);
/**
 * Body text size options, as body font sizes in px, shown as A- / A / A+. 12px is the design size and the
 * default (A-).
 */
const BODY_BASE_PX = 12;
const TEXT_SIZES_PX = [12, 14, 16] as const;

/** Tick column sits 40px below the first card's top edge. */
const MINIMAP_OFFSET = 40;

export function ResearchNoteScreen() {
  const {
    scrollRef,
    activeId,
    scrolled,
    headerProgress,
    onScroll,
    scrollToSection,
    scrollToTop,
    onSectionLayout,
    onViewportLayout,
    onContentSizeChange,
  } = useSectionNavigation(sectionIds);
  const { tab, pageTab, switching, setSwitchDelay, benchTab } = useActiveTab();
  const [sizeIndex, setSizeIndex] = useState(0);
  const zoom = TEXT_SIZES_PX[sizeIndex] / BODY_BASE_PX;

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0];
  // The floating header's chip names where you are: the section on the note, the sub-tab on Benchmarking.
  const floatingTitle =
    pageTab === TAB_BENCHMARKING
      ? BENCHMARK_TABS[benchTab]
      : activeSection.title;
  const wide = pageTab === TAB_BENCHMARKING; // benchmarking cards run the full column width

  // Switching from a scrolled page: glide back to the top while the old page fades out, and give that glide the
  // time it needs before the next page is shown, so the swap happens at the top instead of as a jump.
  useEffect(() => {
    setSwitchDelay(scrolled ? SCROLLED_SWITCH_MS : 90);
  }, [scrolled, setSwitchDelay]);
  const firstTab = useRef(true);
  useEffect(() => {
    if (firstTab.current) {
      firstTab.current = false;
      return;
    }
    if (scrolled) scrollToTop(SCROLLED_SWITCH_MS + 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Each tab starts at the top; its content eases in (see `appear` on the section cards and benchmarking blocks).
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [pageTab, scrollRef]);

  return (
    <View style={styles.root}>
      <View style={styles.main}>
        {/* The scroll area spans the whole column; content starts below the header and scrolls under it. */}
        <View nativeID={NOTE_CONTENT_ID} style={styles.scroll}>
          <ScrollView
            ref={scrollRef}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onLayout={onViewportLayout}
            onContentSizeChange={onContentSizeChange}
            style={styles.scrollInner}
            contentContainerStyle={[
              styles.scrollContent,
              wide && styles.scrollContentWide,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* The default header is part of the page: it scrolls away with the content. */}
            <View style={[styles.header, wide && styles.headerWide]}>
              <NoteHeader activeTab={tab} />
            </View>
            {pageTab === TAB_RESEARCH &&
              sections.map((section, i) => (
                <SectionCard
                  key={section.id}
                  index={i}
                  section={section}
                  zoom={zoom}
                  onLayout={onSectionLayout(section.id)}
                />
              ))}
            {pageTab === TAB_BENCHMARKING && <BenchmarkingPage />}
            {pageTab !== TAB_RESEARCH && pageTab !== TAB_BENCHMARKING && (
              <View style={[styles.placeholder, appear(0), leaving(switching)]}>
                <Text style={styles.placeholderText}>
                  {noteTabs[pageTab]} is not designed yet.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {pageTab === TAB_RESEARCH && (
          <View style={styles.minimapSlot}>
            <Minimap
              sections={sections}
              activeId={activeId}
              onSelect={scrollToSection}
            />
          </View>
        )}

        <FloatingHeaderLayer
          progress={headerProgress}
          active={scrolled}
          variant="left"
          activeTab={tab}
          activeSectionTitle={floatingTitle}
        />

        <ZoomControls
          topProgress={headerProgress}
          topActive={scrolled}
          onScrollTop={scrollToTop}
          sizeIndex={sizeIndex}
          onSelectSize={setSizeIndex}
          showSize={pageTab === TAB_RESEARCH}
        />
      </View>

      <ResizableAssistant />
      <SideNav />
    </View>
  );
}

const styles = StyleSheet.create({
  // 56px left clears the floating side-nav pods; 8px gap between the columns and 8px inset on the right (Figma 332:4138).
  root: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    paddingLeft: 56,
    paddingRight: 8,
    backgroundColor: colors.slate50,
  },
  main: { flex: 1 },
  scroll: { ...StyleSheet.absoluteFill },
  scrollInner: { flex: 1 },
  scrollContent: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 80,
  },
  // Benchmarking pages use the whole column: no side inset.
  scrollContentWide: { paddingHorizontal: 0 },
  headerWide: { marginHorizontal: 0 },
  placeholder: { paddingVertical: 80, alignItems: "center" },
  placeholderText: {
    fontFamily: fonts.geistRegular,
    fontSize: 12,
    color: colors.slate500,
  },
  // Spans the full column (the scroll content is inset 80px each side); -4 trims the list gap to the design's 12px.
  // zIndex keeps the header's kebab menu above the section cards that follow it.
  header: {
    alignSelf: "stretch",
    marginHorizontal: -80,
    marginBottom: -4,
    position: "relative",
    zIndex: 40,
  },
  minimapSlot: {
    position: "absolute",
    top: HEADER_EXPANDED_HEIGHT + MINIMAP_OFFSET,
    left: 4,
    width: 0,
    height: 0,
    zIndex: 10,
  },
});
