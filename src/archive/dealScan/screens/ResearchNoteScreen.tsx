import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../../theme";
import {
  HEADER_COLLAPSED_HEIGHT,
  HEADER_EXPANDED_HEIGHT,
} from "../../../theme/layout";
import { noteTabs, sections } from "../data/researchNote";
import { SideNav } from "../../../components/SideNav";
import { FloatingHeaderLayer } from "../components/note/FloatingHeaderLayer";
import { appear, leaving } from "../../../theme/motion";
import { NOTE_CONTENT_ID } from "../../../state/selectionContext";
import { NoteHeader } from "../components/note/NoteHeader";
import { SectionCard } from "../components/note/SectionCard";
import { DockedSections, Minimap } from "../components/note/Minimap";
import { ScrollTopButton } from "../components/note/ScrollTopButton";
import { SourcesDrawer } from "../components/note/SourcesDrawer";
import { useSectionNavigation } from "../../../hooks/useSectionNavigation";
import { ResizableAssistant } from "../components/assistant/ResizableAssistant";
import { BenchmarkingPage } from "../components/benchmarking/BenchmarkingPage";
import { ICMemoPage } from "../components/memo/ICMemoPage";
import { BENCHMARK_TABS, useActiveTab } from "../../../state/activeTab";

/** How long the old page takes to leave when switching tabs from a scrolled position. */
const SCROLLED_SWITCH_MS = 260;

/** Header tab indexes (see `noteTabs`). */
const TAB_RESEARCH = 0;
const TAB_MEMO = 1;
const TAB_BENCHMARKING = 2;

const sectionIds = sections.map((s) => s.id);
/** Tick column sits 40px below the first card's top edge. */
const MINIMAP_OFFSET = 40;
/**
 * Docked section panel (Figma 940:48893): 195px wide. The cards start 234px in and end 71px short of the right edge,
 * which leaves the same 39px either side of the cards with their action icons.
 */
const DOCKED_LEFT = 234;
const DOCKED_RIGHT = 71;

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

  const [memoSlide, setMemoSlide] = useState("Cover");
  // The section menu docked as a panel in the left margin (from the hover popup's dock button); the page makes room for it.
  const [docked, setDocked] = useState(false);
  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0];
  // The floating header's chip names where you are: the section on the note, the sub-tab on Benchmarking.
  const floatingTitle =
    pageTab === TAB_BENCHMARKING
      ? BENCHMARK_TABS[benchTab]
      : pageTab === TAB_MEMO
        ? memoSlide
        : activeSection.title;
  // Benchmarking cards and the IC memo run the full column width.
  const wide = pageTab === TAB_BENCHMARKING || pageTab === TAB_MEMO;
  const dockedNow = docked && pageTab === TAB_RESEARCH;
  // The IC memo needs where the page is scrolled and how tall the view is: its rail sticks while the slides scroll.
  const [scrollY, setScrollY] = useState(0);
  const [viewportH, setViewportH] = useState(0);

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
            onScroll={(e) => {
              onScroll(e);
              if (pageTab === TAB_MEMO || docked)
                setScrollY(e.nativeEvent.contentOffset.y);
            }}
            scrollEventThrottle={16}
            onLayout={(e) => {
              onViewportLayout(e);
              setViewportH(e.nativeEvent.layout.height);
            }}
            onContentSizeChange={onContentSizeChange}
            style={styles.scrollInner}
            contentContainerStyle={[
              styles.scrollContent,
              wide && styles.scrollContentWide,
              dockedNow && {
                paddingLeft: DOCKED_LEFT,
                paddingRight: DOCKED_RIGHT,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* The default header is part of the page: it scrolls away with the content. */}
            <View
              style={[
                styles.header,
                wide && styles.headerWide,
                dockedNow && {
                  marginLeft: -DOCKED_LEFT,
                  marginRight: -DOCKED_RIGHT,
                },
              ]}
            >
              <NoteHeader activeTab={tab} />
            </View>
            {pageTab === TAB_RESEARCH &&
              sections.map((section, i) => (
                <SectionCard
                  key={section.id}
                  index={i}
                  section={section}
                  onLayout={onSectionLayout(section.id)}
                />
              ))}
            {pageTab === TAB_BENCHMARKING && <BenchmarkingPage />}
            {pageTab === TAB_MEMO && (
              <ICMemoPage
                scrollY={scrollY}
                viewportHeight={viewportH}
                onActiveSlide={setMemoSlide}
                scrollTo={(y) =>
                  scrollRef.current?.scrollTo({ y, animated: true })
                }
              />
            )}
            {pageTab !== TAB_RESEARCH &&
              pageTab !== TAB_BENCHMARKING &&
              pageTab !== TAB_MEMO && (
                <View
                  style={[styles.placeholder, appear(0), leaving(switching)]}
                >
                  <Text style={styles.placeholderText}>
                    {noteTabs[pageTab]} is not designed yet.
                  </Text>
                </View>
              )}
          </ScrollView>
        </View>

        {pageTab === TAB_RESEARCH && !docked && (
          <View style={styles.minimapSlot}>
            <Minimap
              sections={sections}
              activeId={activeId}
              onSelect={scrollToSection}
              onDock={() => setDocked(true)}
            />
          </View>
        )}
        {dockedNow && (
          // Full height like the IC memo's slide rail: under the header at rest, then stuck under the floating header.
          <View
            style={{
              position: "absolute",
              left: 0,
              width: 195,
              zIndex: 10,
              top: Math.max(
                HEADER_COLLAPSED_HEIGHT,
                HEADER_EXPANDED_HEIGHT - scrollY,
              ),
              bottom: 8,
            }}
          >
            <DockedSections
              sections={sections}
              activeId={activeId}
              onSelect={scrollToSection}
              onUndock={() => setDocked(false)}
            />
          </View>
        )}

        <FloatingHeaderLayer
          progress={headerProgress}
          active={scrolled}
          variant="left"
          activeTab={tab}
          activeSectionTitle={floatingTitle}
          // Every edge is 8px: the floating header sits 8px from the side nav, the top and the assistant.
          inset={{ top: -4, left: -12, right: -12 }}
        />

        <ScrollTopButton
          progress={headerProgress}
          active={scrolled}
          // Not `onPress={scrollToTop}`: that would hand it the press event as its duration and the scroll would jump.
          onPress={() => scrollToTop()}
        />
      </View>

      {/* On the IC memo the assistant never grows past 5 columns of the 12-column grid (8px gutters, 60px / 8px margins). */}
      <ResizableAssistant
        maxWidthFor={
          pageTab === TAB_MEMO
            ? (w) => Math.round((5 * w) / 12 - 33)
            : undefined
        }
      />
      <SideNav />
      <SourcesDrawer />
    </View>
  );
}

const styles = StyleSheet.create({
  // 60px left clears the side nav by 8px; 8px gap between the columns and 8px inset on the right (Figma 332:4138, 834:2649).
  root: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    paddingLeft: 60,
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
    marginBottom: -8,
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
