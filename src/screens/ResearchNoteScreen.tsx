import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { HEADER_EXPANDED_HEIGHT } from '../theme/layout';
import { sections } from '../data/researchNote';
import { SideNav } from '../components/SideNav';
import { AnimatedHeader } from '../components/note/AnimatedHeader';
import { SectionCard } from '../components/note/SectionCard';
import { Minimap } from '../components/note/Minimap';
import { ZoomControls } from '../components/note/ZoomControls';
import { useHeaderProgress } from '../hooks/useHeaderProgress';
import { useSectionNavigation } from '../hooks/useSectionNavigation';
import { AssistantPanel } from '../components/assistant/AssistantPanel';

const sectionIds = sections.map((s) => s.id);
/** Body-text zoom: 10% steps between these bounds (1 = design size). */
const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 1.5;
const roundZoom = (z: number) => Math.round(z * 10) / 10;

/** Tick column sits 40px below the first card's top edge. */
const MINIMAP_OFFSET = 40;

export function ResearchNoteScreen() {
  const { scrollRef, activeId, scrolled, onScroll, scrollToSection, onSectionLayout, onViewportLayout, onContentSizeChange } =
    useSectionNavigation(sectionIds);
  const progress = useHeaderProgress(scrolled);
  const [zoom, setZoom] = useState(1);

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0];

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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section) => (
            <SectionCard key={section.id} section={section} zoom={zoom} onLayout={onSectionLayout(section.id)} />
          ))}
        </ScrollView>

        <View style={styles.minimapSlot}>
          <Minimap sections={sections} activeId={activeId} onSelect={scrollToSection} />
        </View>

        <AnimatedHeader
          progress={progress}
          scrolled={scrolled}
          activeTab={0}
          activeSectionTitle={activeSection.title}
        />

        <ZoomControls
          canZoomIn={zoom < ZOOM_MAX}
          canZoomOut={zoom > ZOOM_MIN}
          onZoomIn={() => setZoom((z) => Math.min(ZOOM_MAX, roundZoom(z + ZOOM_STEP)))}
          onZoomOut={() => setZoom((z) => Math.max(ZOOM_MIN, roundZoom(z - ZOOM_STEP)))}
        />
      </View>

      <AssistantPanel />
      <SideNav />
    </View>
  );
}

const styles = StyleSheet.create({
  // 56px left clears the floating side-nav pods; the assistant floats 12px from the right edge.
  root: { flex: 1, flexDirection: 'row', gap: 12, paddingLeft: 56, paddingRight: 12, backgroundColor: colors.slate50 },
  main: { flex: 1 },
  scroll: { ...StyleSheet.absoluteFill },
  scrollContent: {
    alignItems: 'center',
    gap: 16,
    paddingTop: HEADER_EXPANDED_HEIGHT,
    paddingHorizontal: 80,
  },
  minimapSlot: { position: 'absolute', top: HEADER_EXPANDED_HEIGHT + MINIMAP_OFFSET, left: 4, width: 0, height: 0, zIndex: 10 },
});
