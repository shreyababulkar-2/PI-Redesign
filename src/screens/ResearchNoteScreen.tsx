import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { HEADER_EXPANDED_HEIGHT } from '../theme/layout';
import { noteTabs, sections } from '../data/researchNote';
import { SideNav } from '../components/SideNav';
import { FloatingHeaderLayer } from '../components/note/FloatingHeaderLayer';
import { NoteHeader } from '../components/note/NoteHeader';
import { OptionsSwitcher } from '../components/OptionsSwitcher';
import { useDesignOptions } from '../state/designOptions';
import { SectionCard } from '../components/note/SectionCard';
import { Minimap } from '../components/note/Minimap';
import { ZoomControls } from '../components/note/ZoomControls';
import { useSectionNavigation } from '../hooks/useSectionNavigation';
import { ResizableAssistant } from '../components/assistant/ResizableAssistant';
import { BenchmarkingPage } from '../components/benchmarking/BenchmarkingPage';
import { BENCHMARK_TABS, useActiveTab } from '../state/activeTab';

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
  const { scrollRef, activeId, scrolled, headerProgress, onScroll, scrollToSection, scrollToTop, onSectionLayout, onViewportLayout, onContentSizeChange } =
    useSectionNavigation(sectionIds);
  const { scrolledHeader } = useDesignOptions();
  const { tab, benchTab } = useActiveTab();
  const [sizeIndex, setSizeIndex] = useState(0);
  const zoom = TEXT_SIZES_PX[sizeIndex] / BODY_BASE_PX;

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0];
  // The floating header's chip names where you are: the section on the note, the sub-tab on Benchmarking.
  const floatingTitle = tab === TAB_BENCHMARKING ? BENCHMARK_TABS[benchTab] : activeSection.title;
  const wide = tab === TAB_BENCHMARKING; // benchmarking cards run the full column width

  // Each tab starts at the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [tab, scrollRef]);

  return (
    <View style={styles.root}>
      <View style={styles.main}>
        {/* The scroll area spans the whole column; content starts below the header and scrolls under it. */}
        <ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onLayout={onViewportLayout}
          onContentSizeChange={onContentSizeChange}
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, wide && styles.scrollContentWide]}
          showsVerticalScrollIndicator={false}
        >
          {/* The default header is part of the page: it scrolls away with the content. */}
          <View style={[styles.header, wide && styles.headerWide]}>
            <NoteHeader activeTab={tab} />
          </View>
          {tab === TAB_RESEARCH &&
            sections.map((section) => (
              <SectionCard key={section.id} section={section} zoom={zoom} onLayout={onSectionLayout(section.id)} />
            ))}
          {tab === TAB_BENCHMARKING && <BenchmarkingPage />}
          {tab !== TAB_RESEARCH && tab !== TAB_BENCHMARKING && (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>{noteTabs[tab]} is not designed yet.</Text>
            </View>
          )}
        </ScrollView>

        {tab === TAB_RESEARCH && (
          <View style={styles.minimapSlot}>
            <Minimap sections={sections} activeId={activeId} onSelect={scrollToSection} />
          </View>
        )}

        <FloatingHeaderLayer
          progress={headerProgress}
          active={scrolled}
          variant={scrolledHeader}
          activeTab={tab}
          activeSectionTitle={floatingTitle}
        />

        <OptionsSwitcher />

        <ZoomControls
          topProgress={headerProgress}
          topActive={scrolled}
          onScrollTop={scrollToTop}
          sizeIndex={sizeIndex}
          onSelectSize={setSizeIndex}
          showSize={tab === TAB_RESEARCH}
        />
      </View>

      <ResizableAssistant />
      <SideNav />
    </View>
  );
}

const styles = StyleSheet.create({
  // 56px left clears the floating side-nav pods; 8px gap between the columns and 8px inset on the right (Figma 332:4138).
  root: { flex: 1, flexDirection: 'row', gap: 8, paddingLeft: 56, paddingRight: 8, backgroundColor: colors.slate50 },
  main: { flex: 1 },
  scroll: { ...StyleSheet.absoluteFill },
  scrollContent: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 80,
  },
  // Benchmarking pages use the whole column: no side inset.
  scrollContentWide: { paddingHorizontal: 0 },
  headerWide: { marginHorizontal: 0 },
  placeholder: { paddingVertical: 80, alignItems: 'center' },
  placeholderText: { fontFamily: fonts.geistRegular, fontSize: 12, color: colors.slate500 },
  // Spans the full column (the scroll content is inset 80px each side); -4 trims the list gap to the design's 12px.
  header: { alignSelf: 'stretch', marginHorizontal: -80, marginBottom: -4 },
  minimapSlot: { position: 'absolute', top: HEADER_EXPANDED_HEIGHT + MINIMAP_OFFSET, left: 4, width: 0, height: 0, zIndex: 10 },
});
