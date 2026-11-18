import {
  ComponentRef,
  ReactNode,
  RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, fonts } from "../../theme";
import { pointer } from "../../theme/cursor";
import { transition } from "../../theme/motion";
import { useHover } from "../../hooks/useHover";
import { KebabMenu } from "../note/KebabMenu";
import { sections } from "../../data/sections";
import {
  citationNumbers,
  CITATION_GROUP,
  sourceFor,
} from "../../data/citations";
import { FILE_TARGETS, WEB_EXCERPTS } from "../../data/sourceExcerpts";
import { SheetData, WORKBOOKS } from "../../data/workbooks";
import { ENTER_MS, useDocumentViewer } from "../../state/documentViewer";
import { clearClaims, NoteClaim, showClaims } from "../../state/claimHighlight";
import {
  ArrowUpRight,
  Caret,
  ChevronLeft,
  ChevronRight,
  Close,
  Download,
  Folder,
  Globe,
  OpenExternal,
  PageNext,
  PagePrev,
  ZoomIn,
  ZoomOut,
} from "./icons";

const GREEN = "#22733e";

type Source = ReturnType<typeof sourceFor>;
type DocKind = "pdf" | "sheet" | "web";

/** What the source opens as: web pages show an excerpt, files open in their own viewer (not reformatted). */
function docKind(source: Source): DocKind {
  if (source.kind === "web") return "web";
  return /\.xlsx?$/i.test(source.title) ? "sheet" : "pdf";
}

/** Every source the note cites anywhere, in number order, read from the note's own text. */
function useAllCitations(): number[] {
  return useMemo(() => {
    const found = new Set<number>();
    for (const section of sections)
      for (const block of section.body) {
        if (block.kind === "spacer") continue;
        for (const seg of block.segments)
          for (const part of seg.text.split(CITATION_GROUP))
            if (/^\[/.test(part))
              citationNumbers(part).forEach((n) => found.add(n));
      }
    return [...found].sort((a, b) => a - b);
  }, []);
}

type Claim = NoteClaim & { section: string };

/** For each source, the passages of the note that cite it: the sentence (or clause) just before each marker. */
function useClaims(): Map<number, Claim[]> {
  return useMemo(() => {
    const map = new Map<number, Claim[]>();
    for (const section of sections)
      for (const block of section.body) {
        if (block.kind === "spacer") continue;
        for (const seg of block.segments) {
          const parts = seg.text.split(CITATION_GROUP);
          parts.forEach((part, i) => {
            if (i % 2 === 0) return;
            const sentence = (parts[i - 1] ?? "")
              .split(/(?<=[.!?])\s+/)
              .pop()!
              .replace(/^[\s.,;:]+/, "")
              .trim();
            if (!sentence) return;
            for (const n of citationNumbers(part)) {
              const list = map.get(n) ?? [];
              const same = list.find((c) => c.text === sentence);
              if (same)
                same.numbers = [
                  ...new Set([
                    ...(same.numbers ?? []),
                    ...citationNumbers(part),
                  ]),
                ].sort((a, b) => a - b);
              else
                list.push({
                  sectionId: section.id,
                  section: `${section.index} ${section.title}`,
                  text: sentence,
                  numbers: citationNumbers(part),
                });
              map.set(n, list);
            }
          });
        }
      }
    return map;
  }, []);
}

/**
 * The passage a source is mainly cited for: the one its excerpt backs, else one that several sources back together (so
 * the associated citations show when moving through the citations with the header arrows), else the first.
 */
function mainClaim(n: number, bySource: Map<number, Claim[]>): Claim | null {
  const claims = bySource.get(n) ?? [];
  const key = (
    WEB_EXCERPTS[n]?.supports ?? FILE_TARGETS[n]?.supports
  )?.toLowerCase();
  return (
    (key && claims.find((c) => c.text.toLowerCase().includes(key))) ||
    claims.find((c) => (c.numbers?.length ?? 0) > 1) ||
    claims[0] ||
    null
  );
}

/** The passage of the note the drawer is showing: where the citation was opened from, or the source's main one. */
function useShownClaim(n: number): Claim | null {
  const bySource = useClaims();
  const { open } = useDocumentViewer();
  const clicked = open?.claim;
  if (clicked) {
    const known = bySource.get(n)?.find((c) => c.text === clicked.text);
    return { section: "", ...clicked, ...known };
  }
  return mainClaim(n, bySource);
}

/**
 * The citation drawer (Figma 602:4423). Clicking a source in a citation's card replaces the assistant with this
 * drawer and resizes the note to share the screen with it. It shows one citation at a time: the passage of the
 * note it supports, the other sources of that sentence, and the source itself (a web excerpt, or the file as it
 * is). That passage is marked in the note too. ‹ › step through every citation in the note; ✕ or Esc returns to the
 * assistant.
 */
export function DocumentViewer() {
  const { open, visible, close } = useDocumentViewer();
  const claimsBySource = useClaims();
  const active = open?.active;
  const clicked = open?.claim ?? null;

  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible, close]);

  // Keep the note in step with the drawer: mark the passage being shown and scroll it into view.
  useEffect(() => {
    if (!visible || active === undefined) return;
    const claim = clicked ?? mainClaim(active, claimsBySource);
    if (claim) showClaims([claim], 0);
    return clearClaims;
  }, [visible, active, clicked, claimsBySource]);

  if (!open) return null;
  return <Drawer active={open.active} visible={visible} />;
}

/**
 * The drawer's shell and body. It slides in from the right over the pane, fully opaque, so the assistant under it is
 * covered rather than cross-fading into it, and it is removed at once on close. While it loads its content is a
 * skeleton of its own layout, which also waits until the pane has finished widening so the pages are not laid out on
 * every frame of the resize.
 */
function Drawer({ active, visible }: { active: number; visible: boolean }) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => setSettled(true), ENTER_MS - 40);
    return () => clearTimeout(id);
  }, [visible]);
  return (
    <View pointerEvents="box-none" style={styles.fill}>
      <View
        style={[
          { flex: 1, transform: [{ translateX: visible ? "0%" : "100%" }] },
          transition(["transform"], ENTER_MS),
        ]}
      >
        <View style={styles.root}>
          <Header />
          <View style={{ flex: 1 }}>
            {/* A file fills the rest of the drawer and scrolls inside its own viewer; a web excerpt scrolls with the drawer. */}
            {docKind(sourceFor(active)) === "web" ? (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
              >
                <Content
                  key={active}
                  n={active}
                  loadMs={settled ? 320 : ENTER_MS + 80}
                />
              </ScrollView>
            ) : (
              <View style={[styles.scroll, styles.body]}>
                <Content
                  key={active}
                  n={active}
                  loadMs={settled ? 320 : ENTER_MS + 80}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

/** The green top bar: previous / next citation, which one this is out of all in the note, and close. */
function Header() {
  const { open, setActive, close } = useDocumentViewer();
  const all = useAllCitations();
  const active = open?.active ?? all[0];
  const index = Math.max(all.indexOf(active), 0);
  const go = (delta: number) =>
    setActive(all[(index + delta + all.length) % all.length]);
  return (
    <View style={styles.header}>
      <View style={styles.stepper}>
        <HeaderButton label="Previous citation" onPress={() => go(-1)}>
          <ChevronLeft />
        </HeaderButton>
        <Text style={styles.count}>
          Citation {active}
          <Text style={styles.countTotal}> /{all.length}</Text>
        </Text>
        <HeaderButton label="Next citation" onPress={() => go(1)}>
          <ChevronRight />
        </HeaderButton>
      </View>
      <HeaderButton
        label="Close and return to the assistant"
        onPress={close}
        round
      >
        <Close />
      </HeaderButton>
    </View>
  );
}

function HeaderButton({
  label,
  onPress,
  round = false,
  children,
}: {
  label: string;
  onPress: () => void;
  /** The close button is the larger 24px one. */
  round?: boolean;
  children: ReactNode;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...hover.handlers}
      style={[
        round ? styles.close : styles.headerButton,
        hover.hovered && styles.headerButtonHover,
      ]}
    >
      {children}
    </Pressable>
  );
}

function Content({ n, loadMs }: { n: number; loadMs: number }) {
  const source = sourceFor(n);
  const claim = useShownClaim(n);
  const numbers = claim?.numbers ?? [];
  // The drawer shows a skeleton of its own layout while the source loads (and, the first time, while the pane is
  // still widening), instead of fading content in over an empty panel.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setLoaded(true), loadMs);
    return () => clearTimeout(id);
  }, [loadMs]);
  if (!loaded)
    return (
      <ContentSkeleton
        kind={docKind(source)}
        associated={numbers.length > 1 ? numbers.length : 0}
      />
    );
  return (
    <>
      {claim && (
        <View style={styles.section}>
          <Text style={styles.label}>Claim from Research note</Text>
          <View style={styles.claimBox}>
            <View style={styles.claimBar} />
            <Text style={styles.claimText}>“{claim.text}”</Text>
          </View>
        </View>
      )}
      {claim && numbers.length > 1 && (
        <Associated n={n} claim={claim} numbers={numbers} />
      )}
      <View style={styles.dashed} />
      <SourceHead source={source} n={n} />
      <SourceBody source={source} n={n} claim={claim?.text ?? ""} />
    </>
  );
}

function AssociatedChip({
  k,
  on,
  onPress,
}: {
  k: number;
  on: boolean;
  onPress: () => void;
}) {
  const hover = useHover();
  const s = sourceFor(k);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`Source ${k}: ${s.title}`}
      onPress={onPress}
      {...hover.handlers}
      style={[
        styles.chip,
        on && styles.chipOn,
        !on && hover.hovered && styles.chipHover,
      ]}
    >
      {s.kind === "web" ? (
        <Globe color={on ? GREEN : "#717784"} />
      ) : (
        <Folder color={on ? GREEN : "#717784"} />
      )}
      <Text
        numberOfLines={1}
        style={[styles.chipText, on && styles.chipTextOn]}
      >
        {s.title}
      </Text>
    </Pressable>
  );
}

/** A block of the loading skeleton: a soft grey shape with a light that sweeps across it. */
function Bone({ style }: { style: object }) {
  return <View style={[styles.bone, style]} />;
}

/**
 * What the drawer looks like while it loads: the same layout as the loaded drawer (claim, associated citations,
 * source heading, then an excerpt or a document page) drawn as grey shapes, so nothing jumps when the content lands.
 */
function ContentSkeleton({
  kind,
  associated,
}: {
  kind: DocKind;
  /** How many associated-citation chips the loaded drawer will show (none for a sentence with one source). */
  associated: number;
}) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading source"
      style={styles.skeleton}
    >
      <View style={styles.section}>
        <Bone style={{ width: 150, height: 10 }} />
        <View style={styles.claimBox}>
          <View style={styles.claimBar} />
          <View style={{ flex: 1, gap: 8, paddingVertical: 4 }}>
            <Bone style={{ width: "96%", height: 10 }} />
            <Bone style={{ width: "68%", height: 10 }} />
          </View>
        </View>
      </View>
      {associated > 0 && (
        <View style={styles.section}>
          <Bone style={{ width: 120, height: 10 }} />
          <View style={styles.chips}>
            {Array.from({ length: Math.min(associated, 4) }, (_, i) => (
              <Bone
                key={i}
                style={{ width: 120, height: 28, borderRadius: 8 }}
              />
            ))}
          </View>
        </View>
      )}
      <View style={styles.dashed} />
      <View style={styles.sourceHead}>
        <Bone style={{ width: 62, height: 20, borderRadius: 2 }} />
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Bone style={{ width: "88%", height: 14 }} />
            <Bone style={{ width: "54%", height: 14 }} />
          </View>
          <View style={styles.titleActions}>
            {kind !== "web" && (
              <Bone style={{ width: 28, height: 28, borderRadius: 8 }} />
            )}
            <Bone style={{ width: 28, height: 28, borderRadius: 8 }} />
          </View>
        </View>
      </View>
      {kind === "web" ? (
        <View style={styles.section}>
          <Bone style={{ width: 150, height: 10 }} />
          <View style={styles.excerpt}>
            <Bone style={{ width: "62%", height: 12 }} />
            <View style={{ gap: 8 }}>
              <Bone style={{ width: "100%", height: 10 }} />
              <Bone style={{ width: "97%", height: 10 }} />
              <Bone style={{ width: "92%", height: 10 }} />
              <Bone style={{ width: "99%", height: 10 }} />
              <Bone style={{ width: "58%", height: 10 }} />
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.section, styles.fileSection]}>
          <View style={styles.rowBetween}>
            <Bone style={{ width: 44, height: 10 }} />
            <Bone style={{ width: 96, height: 10 }} />
          </View>
          <View style={[styles.viewer, { padding: 16 }]}>
            {kind === "pdf" ? (
              <View style={styles.skeletonPage}>
                <Bone style={{ width: "100%", height: 20, borderRadius: 2 }} />
                <Bone style={{ width: "46%", height: 14, marginTop: 14 }} />
                {[96, 100, 92, 98, 70].map((w, i) => (
                  <Bone key={i} style={{ width: `${w}%`, height: 8 }} />
                ))}
              </View>
            ) : (
              <View style={{ gap: 6 }}>
                {Array.from({ length: 7 }, (_, r) => (
                  <View key={r} style={{ flexDirection: "row", gap: 6 }}>
                    <Bone style={{ width: 24, height: 22 }} />
                    <Bone style={{ flex: 1, height: 22 }} />
                    <Bone style={{ width: 90, height: 22 }} />
                    <Bone style={{ width: 70, height: 22 }} />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

/** The other sources behind the same sentence: one chip each, the open one filled. Switching keeps the sentence. */
function Associated({
  n,
  claim,
  numbers,
}: {
  n: number;
  claim: Claim;
  numbers: number[];
}) {
  const { setActive } = useDocumentViewer();
  return (
    <View style={styles.section}>
      <Text style={styles.label}>Associated citations</Text>
      <View style={styles.chips}>
        {numbers.map((k) => {
          const on = k === n;
          return (
            <AssociatedChip
              key={k}
              k={k}
              on={on}
              onPress={() => setActive(k, claim)}
            />
          );
        })}
      </View>
    </View>
  );
}

function SourceHead({ source, n }: { source: Source; n: number }) {
  const kind = docKind(source);
  const url = `https://${source.host}`;
  return (
    <View style={styles.sourceHead}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {kind === "web" ? "Web" : "Data room"}
        </Text>
      </View>
      <View style={styles.titleRow}>
        <View style={styles.titleCol}>
          <Text style={styles.title}>{source.title}</Text>
          {kind === "web" && (
            <Text
              accessibilityRole="link"
              onPress={() => Linking.openURL(url)}
              style={styles.host}
            >
              {source.host}
            </Text>
          )}
        </View>
        <View style={styles.titleActions}>
          {kind !== "web" && (
            <IconButton
              label={`Download ${source.title}`}
              onPress={() => downloadFile(FILE_TARGETS[n]?.src)}
            >
              <Download />
            </IconButton>
          )}
          <IconButton
            label={kind === "web" ? `Open ${source.host}` : "Open file"}
            onPress={() =>
              kind === "web"
                ? Linking.openURL(url)
                : openFile(FILE_TARGETS[n]?.src, FILE_TARGETS[n]?.page)
            }
          >
            <OpenExternal />
          </IconButton>
        </View>
      </View>
    </View>
  );
}

function IconButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress?: () => void;
  children: ReactNode;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.iconButton,
        hover.hovered && styles.iconButtonHover,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

function SourceBody({
  source,
  n,
  claim,
}: {
  source: Source;
  n: number;
  claim: string;
}) {
  const kind = docKind(source);
  if (kind === "web") return <WebExcerpt n={n} />;
  return <FileViewer kind={kind} n={n} claim={claim} />;
}

/** Web sources are not embedded: the passage the note relies on, quoted from the page, highlighted. */
function WebExcerpt({ n }: { n: number }) {
  const ex = WEB_EXCERPTS[n];
  if (!ex) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.label}>Excerpt from the source</Text>
      <View style={styles.excerpt}>
        <Text style={styles.excerptHeading}>{ex.heading}</Text>
        <Text style={styles.excerptText}>
          {ex.before}
          <Text style={styles.excerptMatch}>{ex.match}</Text>
          {ex.after.trim()}…
        </Text>
      </View>
    </View>
  );
}

/** Saves a dummy file from `public/docs` (web). */
function downloadFile(src?: string) {
  if (!src || Platform.OS !== "web") return;
  const a = document.createElement("a");
  a.href = src;
  a.download = src.split("/").pop() ?? "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Opens a dummy file in its own browser tab (web), at the cited page for documents. */
function openFile(src?: string, page?: number) {
  if (!src || Platform.OS !== "web") return;
  window.open(page ? `${src}#page=${page}` : src, "_blank", "noopener");
}

/**
 * A file shown as it is: a PDF in an embedded viewer at the cited page, or a spreadsheet as a grid with the cited
 * rows marked, each with its own page / sheet control and zoom. The files are dummy ones in `public/docs`.
 */
function FileViewer({
  kind,
  n,
  claim,
}: {
  kind: "pdf" | "sheet";
  n: number;
  claim: string;
}) {
  const target = FILE_TARGETS[n];
  const book = WORKBOOKS[n];
  const [page, setPage] = useState(target?.page ?? 1);
  const [sheetIndex, setSheetIndex] = useState(
    Math.max(book?.sheets.findIndex((sh) => sh.name === target?.sheet) ?? 0, 0),
  );
  const [zoom, setZoom] = useState(1);
  const pages = target?.pages ?? 1;
  const step = (delta: number) => setZoom((z) => clampZoom(z + delta));
  // Trackpad pinch and Ctrl/Cmd + mouse wheel zoom the document too, like any viewer.
  const viewerRef = useRef<ComponentRef<typeof View>>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const el = viewerRef.current as unknown as HTMLElement | null;
    if (!el) return;
    // Chrome, Edge and Firefox report a pinch as a wheel event with Ctrl held.
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) =>
        clampZoom(z * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002))),
      );
    };
    // Safari reports it as gesture events carrying the pinch's scale.
    let base = 1;
    let start = 1;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      start = base;
    };
    const onGestureChange = (e: Event & { scale?: number }) => {
      e.preventDefault();
      base = clampZoom(start * (e.scale ?? 1));
      setZoom(base);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("gesturestart", onGestureStart);
    el.addEventListener("gesturechange", onGestureChange);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", onGestureStart);
      el.removeEventListener("gesturechange", onGestureChange);
    };
  }, []);
  const sheet = book?.sheets[sheetIndex];
  return (
    <View style={[styles.section, styles.fileSection]}>
      <View style={[styles.rowBetween, styles.sourceRow]}>
        <Text style={styles.label}>Source</Text>
        {kind === "pdf" ? (
          <View style={styles.pager}>
            <Pressable
              accessibilityLabel="Previous page"
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              style={pointer}
            >
              <PagePrev />
            </Pressable>
            <Text style={styles.pagerText}>
              Page {page}/{pages}
            </Text>
            <Pressable
              accessibilityLabel="Next page"
              onPress={() => setPage((p) => Math.min(pages, p + 1))}
              style={pointer}
            >
              <PageNext />
            </Pressable>
          </View>
        ) : (
          // The standard dropdown (as the version menu in the note), so it opens above the viewer and closes on an
          // outside click or Escape like the others.
          <KebabMenu
            items={(book?.sheets ?? []).map((sh) => ({ label: sh.name }))}
            selected={sheet?.name}
            onSelect={(name) =>
              setSheetIndex(
                Math.max(
                  book?.sheets.findIndex((sh) => sh.name === name) ?? 0,
                  0,
                ),
              )
            }
          >
            {({ open, toggle }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose sheet"
                accessibilityState={{ expanded: open }}
                onPress={toggle}
                style={styles.pager}
              >
                <Text style={styles.pagerText}>{sheet?.name ?? "Sheet 1"}</Text>
                <Caret />
              </Pressable>
            )}
          </KebabMenu>
        )}
      </View>
      <View ref={viewerRef} style={styles.viewer}>
        {kind === "pdf" ? (
          <PdfPages
            src={target?.src}
            pages={pages}
            page={page}
            zoom={zoom}
            cited={target?.page}
            onPage={setPage}
          />
        ) : sheet ? (
          <SheetGrid sheet={sheet} zoom={zoom} claim={claim} />
        ) : null}
        <View style={styles.zoom}>
          <Pressable
            accessibilityLabel="Zoom out"
            onPress={() => step(-0.25)}
            style={pointer}
          >
            <ZoomOut />
          </Pressable>
          <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
          <Pressable
            accessibilityLabel="Zoom in"
            onPress={() => step(0.25)}
            style={pointer}
          >
            <ZoomIn />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * Drag-to-pan for a document: press and drag with the mouse to move it around in any direction, on top of the usual
 * vertical and horizontal scrolling. It only starts once the pointer has moved a few pixels, so clicks on buttons
 * inside the viewer still work. Web only.
 */
function useDragPan(
  v: RefObject<ScrollViewInstance | null>,
  h: RefObject<ScrollViewInstance | null>,
) {
  const pos = useRef({ x: 0, y: 0 });
  const drag = useRef<{
    px: number;
    py: number;
    sx: number;
    sy: number;
    active: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const handlers =
    Platform.OS === "web"
      ? ({
          onPointerDown: (e: PointerEvent & { currentTarget: Element }) => {
            const t = e.target as Element | null;
            if (e.pointerType !== "mouse" || e.button !== 0) return;
            if (t?.closest("[role=button]")) return;
            drag.current = {
              px: e.clientX,
              py: e.clientY,
              sx: pos.current.x,
              sy: pos.current.y,
              active: false,
            };
          },
          onPointerMove: (e: PointerEvent & { currentTarget: Element }) => {
            const d = drag.current;
            if (!d) return;
            const dx = e.clientX - d.px;
            const dy = e.clientY - d.py;
            if (!d.active) {
              if (Math.hypot(dx, dy) < 4) return;
              d.active = true;
              setDragging(true);
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }
            v.current?.scrollTo({ y: Math.max(d.sy - dy, 0), animated: false });
            h.current?.scrollTo({ x: Math.max(d.sx - dx, 0), animated: false });
          },
          onPointerUp: () => {
            drag.current = null;
            setDragging(false);
          },
          onPointerCancel: () => {
            drag.current = null;
            setDragging(false);
          },
        } as object)
      : {};
  return {
    pan: handlers,
    dragging,
    /** Style for the area that can be dragged. */
    style: (Platform.OS === "web"
      ? { cursor: dragging ? "grabbing" : "grab", userSelect: "none" }
      : null) as object | null,
    trackY: (y: number) => {
      pos.current.y = y;
    },
    trackX: (x: number) => {
      pos.current.x = x;
    },
  };
}

/**
 * A floating pill (Figma 702:5933) that appears when the reader has scrolled away from the highlighted passage in the
 * source, and takes them back to it.
 */
function JumpToHighlight({
  show,
  onPress,
}: {
  show: boolean;
  onPress: () => void;
}) {
  return (
    <View
      pointerEvents={show ? "box-none" : "none"}
      style={[
        styles.jump,
        { opacity: show ? 1 : 0, transform: [{ translateY: show ? 0 : 6 }] },
        transition(["opacity", "transform"], 180),
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to highlighted section"
        onPress={onPress}
        style={({ pressed }) => [styles.jumpButton, pressed && styles.pressed]}
      >
        <Text style={styles.jumpText}>Go to highlighted section</Text>
        <ArrowUpRight />
      </Pressable>
    </View>
  );
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const clampZoom = (z: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));

const PAGE_GAP = 12;
const PAGE_RATIO = 297 / 210; // A4

/** The dummy PDF's pages as images, stacked and scrolling like a document viewer; the cited page is scrolled to. */
function PdfPages({
  src,
  pages,
  page,
  zoom,
  cited,
  onPage,
}: {
  src?: string;
  pages: number;
  page: number;
  zoom: number;
  /** The page the highlighted passage is on. */
  cited?: number;
  onPage: (p: number) => void;
}) {
  const scroller = useRef<ScrollViewInstance>(null);
  const hScroller = useRef<ScrollViewInstance>(null);
  const pan = useDragPan(scroller, hScroller);
  const [width, setWidth] = useState(0);
  const [viewH, setViewH] = useState(0);
  const [away, setAway] = useState(false);
  const base = src
    ? src.replace("/docs/", "/docs/pages/").replace(/\.pdf$/, "")
    : "";
  const pageW = Math.max(width - 32, 0) * zoom;
  const pageH = pageW * PAGE_RATIO;
  const lastScrolled = useRef(0);
  // True while the pages are being sized or resized (first layout, the drawer still widening, a zoom step): scroll
  // events then come from the layout, not the reader, so they must not change the current page.
  const settling = useRef(true);
  const pageRef = useRef(page);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useLayoutEffect(() => {
    settling.current = true;
  }, [width, pageH]);
  // Once the pages have their new size (a beat later, so the scroll is not clamped to the old height), put the
  // viewer back on the current page.
  useEffect(() => {
    if (!width) return;
    const id = setTimeout(() => {
      scroller.current?.scrollTo({
        y: (pageRef.current - 1) * (pageH + PAGE_GAP),
        animated: false,
      });
      lastScrolled.current = pageRef.current;
      settling.current = false;
    }, 60);
    return () => clearTimeout(id);
  }, [width, pageH]);
  // The pager (or the jump pill) asked for another page: scroll there.
  useEffect(() => {
    if (settling.current || page === lastScrolled.current) return;
    lastScrolled.current = page;
    scroller.current?.scrollTo({
      y: (page - 1) * (pageH + PAGE_GAP),
      animated: true,
    });
  }, [page, pageH]);
  return (
    <View
      style={[{ flex: 1 }, pan.style]}
      {...pan.pan}
      onLayout={(e) => {
        setWidth(e.nativeEvent.layout.width);
        setViewH(e.nativeEvent.layout.height);
      }}
    >
      <ScrollView
        ref={scroller}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={50}
        onScroll={(e) => {
          pan.trackY(e.nativeEvent.contentOffset.y);
          if (settling.current) return;
          // Away from the highlight once the cited page has scrolled completely out of view.
          if (cited) {
            const y = e.nativeEvent.contentOffset.y;
            const top = (cited - 1) * (pageH + PAGE_GAP);
            setAway(top + pageH < y || top > y + viewH);
          }
          const next = Math.min(
            pages,
            Math.max(
              1,
              Math.round(e.nativeEvent.contentOffset.y / (pageH + PAGE_GAP)) +
                1,
            ),
          );
          if (next !== page) {
            lastScrolled.current = next;
            onPage(next);
          }
        }}
        contentContainerStyle={styles.pdfContent}
      >
        <ScrollView
          ref={hScroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={50}
          onScroll={(e) => pan.trackX(e.nativeEvent.contentOffset.x)}
          // Zoomed out, the pages are narrower than the viewer: keep them centred, as a document viewer does.
          contentContainerStyle={{
            minWidth: Math.max(width - 32, 0),
            alignItems: "center",
          }}
        >
          <View style={{ gap: PAGE_GAP }}>
            {Array.from({ length: pages }, (_, i) => (
              <Image
                key={i}
                source={{
                  uri: `${base}/${String(i + 1).padStart(2, "0")}.webp`,
                }}
                resizeMode="contain"
                style={[styles.pdfPage, { width: pageW, height: pageH }]}
              />
            ))}
          </View>
        </ScrollView>
      </ScrollView>
      <JumpToHighlight
        show={away}
        onPress={() =>
          cited &&
          scroller.current?.scrollTo({
            y: (cited - 1) * (pageH + PAGE_GAP),
            animated: true,
          })
        }
      />
    </View>
  );
}

const COLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ROW_NUM_W = 36;

/** A spreadsheet sheet as a grid: column letters, row numbers, and the cited range marked in amber. */
function SheetGrid({
  sheet,
  zoom,
  claim,
}: {
  sheet: SheetData;
  zoom: number;
  claim: string;
}) {
  // Mark the range that backs the passage being shown (a sheet can back several).
  const text = claim.toLowerCase();
  const hit =
    sheet.highlights.find(
      (h) => h.when && text.includes(h.when.toLowerCase()),
    ) ??
    sheet.highlights.find((h) => !h.when) ??
    sheet.highlights[0];
  const [r0, c0, r1, c1] = hit?.range ?? [-1, -1, -1, -1];
  const rowH = 28 * zoom;
  const font = 11 * zoom;
  const scroller = useRef<ScrollViewInstance>(null);
  const hScroller = useRef<ScrollViewInstance>(null);
  const pan = useDragPan(scroller, hScroller);
  const [viewH, setViewH] = useState(0);
  const [away, setAway] = useState(false);
  // Where the cited rows sit in the scrolled content (16px of margin, then the column letters row).
  const top = 16 + rowH * (r0 + 1);
  const bottom = top + rowH * (r1 - r0 + 1);
  return (
    <View
      style={[{ flex: 1 }, pan.style]}
      {...pan.pan}
      onLayout={(e) => setViewH(e.nativeEvent.layout.height)}
    >
      <ScrollView
        ref={scroller}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={50}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          pan.trackY(y);
          setAway(r0 >= 0 && (bottom < y || top > y + viewH));
        }}
      >
        <ScrollView
          ref={hScroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={50}
          onScroll={(e) => pan.trackX(e.nativeEvent.contentOffset.x)}
        >
          <View style={styles.grid}>
            <View style={styles.gridRow}>
              <View
                style={[styles.gridHead, { width: ROW_NUM_W, height: rowH }]}
              />
              {sheet.widths.map((w, c) => (
                <View
                  key={c}
                  style={[
                    styles.gridHead,
                    { width: w * zoom * 0.8, height: rowH },
                  ]}
                >
                  <Text style={[styles.gridHeadText, { fontSize: font }]}>
                    {COLS[c]}
                  </Text>
                </View>
              ))}
            </View>
            {sheet.rows.map((row, r) => (
              <View key={r} style={styles.gridRow}>
                <View
                  style={[styles.gridHead, { width: ROW_NUM_W, height: rowH }]}
                >
                  <Text style={[styles.gridHeadText, { fontSize: font }]}>
                    {r + 1}
                  </Text>
                </View>
                {row.map((cell, c) => {
                  const inside = r >= r0 && r <= r1 && c >= c0 && c <= c1;
                  return (
                    <View
                      key={c}
                      style={[
                        styles.gridCell,
                        { width: sheet.widths[c] * zoom * 0.8, height: rowH },
                        r === sheet.headerRow && styles.gridHeaderCell,
                        inside && styles.gridHit,
                        inside && r === r0 && styles.gridHitTop,
                        inside && r === r1 && styles.gridHitBottom,
                        inside && c === c0 && styles.gridHitLeft,
                        inside && c === c1 && styles.gridHitRight,
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.gridText,
                          {
                            fontSize: font,
                            textAlign: cell.align ?? "left",
                            fontFamily:
                              cell.bold || r === sheet.headerRow
                                ? fonts.geistSemiBold
                                : fonts.geistRegular,
                          },
                        ]}
                      >
                        {cell.v}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
      {/* A soft edge where the sheet runs out of view; under the jump pill and the zoom control. */}
      <View pointerEvents="none" style={styles.fade} />
      <JumpToHighlight
        show={away}
        onPress={() =>
          scroller.current?.scrollTo({
            y: Math.max(top - rowH * 2, 0),
            animated: true,
          })
        }
      />
    </View>
  );
}

const LABEL = {
  fontFamily: fonts.geistRegular,
  fontSize: 12,
  lineHeight: 16,
  color: "#525866",
} as const;

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    top: 8,
    bottom: 8,
    left: 0,
    right: 0,
    zIndex: 8,
    // Clips the drawer while it slides in from the right.
    overflow: "hidden",
  },
  root: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
  },
  header: {
    height: 40,
    backgroundColor: colors.pine800,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 16 },
  headerButton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    ...pointer,
    ...transition(["background-color"]),
  },
  headerButtonHover: { backgroundColor: "rgba(255,255,255,0.2)" },
  close: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
    ...transition(["background-color"]),
  },
  count: {
    fontFamily: fonts.geistMedium,
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: colors.white,
  },
  countTotal: {
    fontFamily: fonts.geistRegular,
    color: "rgba(255,255,255,0.6)",
  },
  scroll: { flex: 1 },
  body: { padding: 17, gap: 24, flexGrow: 1 },
  section: { gap: 8 },
  fileSection: { flex: 1, minHeight: 280 },
  label: LABEL,
  claimBox: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f5f7fa",
    backgroundColor: "rgba(245,247,250,0.6)",
  },
  claimBar: { width: 2, borderRadius: 10, backgroundColor: "#66a160" },
  claimText: {
    flex: 1,
    fontFamily: fonts.geistMedium,
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.12,
    color: "#222530",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 12, rowGap: 8 },
  chip: {
    width: 120,
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f2f5f8",
    backgroundColor: "#f5f7fa",
    ...pointer,
    ...transition(["background-color", "border-color"]),
  },
  chipHover: { backgroundColor: "#eef1f5" },
  chipOn: { backgroundColor: "#ddedda", borderColor: "#bcd9b6" },
  chipText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.08,
    color: "#717784",
  },
  chipTextOn: { color: "#525866" },
  dashed: {
    height: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#e1e4ea",
  },
  sourceHead: { gap: 8 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    backgroundColor: "#f0eeee",
  },
  badgeText: {
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 16,
    color: "#525866",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  titleCol: { flex: 1, minWidth: 0, gap: 8 },
  title: {
    fontFamily: fonts.geistMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.12,
    color: "#000",
  },
  host: {
    alignSelf: "flex-start",
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.pine800,
    textDecorationLine: "underline",
    ...pointer,
  },
  titleActions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f7fa",
    ...pointer,
    ...transition(["background-color"]),
  },
  iconButtonHover: { backgroundColor: "#eceff3" },
  pressed: { transform: [{ scale: 0.96 }] },
  excerpt: {
    gap: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f5f7fa",
    backgroundColor: "rgba(245,247,250,0.4)",
  },
  excerptHeading: {
    fontFamily: fonts.geistSemiBold,
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.12,
    color: "#222530",
  },
  excerptText: {
    fontFamily: fonts.geistRegular,
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.12,
    color: "#2b303b",
  },
  excerptMatch: { backgroundColor: "#ffecc0", borderRadius: 2 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // Above the viewer below it, so the sheet menu is not painted underneath.
  sourceRow: { position: "relative", zIndex: 10 },
  pager: { flexDirection: "row", alignItems: "center", gap: 8 },
  pagerText: {
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.12,
    color: "#222530",
  },
  viewer: {
    flex: 1,
    minHeight: 240,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f5f7fa",
    backgroundColor: "rgba(245,247,250,0.6)",
    overflow: "hidden",
  },
  viewerContent: { padding: 16 },
  jump: { position: "absolute", left: 8, bottom: 8, zIndex: 3 },
  jumpButton: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 100,
    backgroundColor: "rgba(14,18,27,0.9)",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    ...pointer,
  },
  jumpText: {
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.06,
    color: colors.white,
  },
  pdfContent: { padding: 16 },
  pdfPage: {
    backgroundColor: colors.white,
    borderRadius: 2,
    boxShadow: "0px 1px 4px rgba(24,27,37,0.12)",
  },
  grid: { alignSelf: "flex-start", backgroundColor: colors.white, margin: 16 },
  gridRow: { flexDirection: "row" },
  gridHead: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f2f5",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e1e4ea",
  },
  gridHeadText: { fontFamily: fonts.geistRegular, color: "#717784" },
  gridCell: {
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eceff3",
    backgroundColor: colors.white,
  },
  gridHeaderCell: { backgroundColor: "#eef3f0" },
  gridText: { color: "#2b303b" },
  gridHit: { backgroundColor: "#fff4d6" },
  gridHitTop: { borderTopWidth: 1.5, borderTopColor: "#f0a020" },
  gridHitBottom: { borderBottomWidth: 1.5, borderBottomColor: "#f0a020" },
  gridHitLeft: { borderLeftWidth: 1.5, borderLeftColor: "#f0a020" },
  gridHitRight: { borderRightWidth: 1.5, borderRightColor: "#f0a020" },
  skeleton: { gap: 24, flex: 1 },
  skeletonPage: {
    gap: 8,
    padding: 14,
    borderRadius: 2,
    backgroundColor: colors.white,
    boxShadow: "0px 1px 4px rgba(24,27,37,0.12)",
  },
  bone: {
    borderRadius: 4,
    backgroundColor: "#eceff3",
    // A light sweeping across the shape (web); a flat grey elsewhere.
    ...(Platform.OS === "web"
      ? ({
          backgroundImage:
            "linear-gradient(90deg, #eceff3 30%, #f7f9fb 50%, #eceff3 70%)",
          backgroundSize: "300% 100%",
          animation: "pi-skeleton 1.4s ease-in-out infinite",
        } as object)
      : null),
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 24,
    // Fades into the viewer's own tint instead of a flat white band that cut the rows off.
    ...(Platform.OS === "web"
      ? ({
          backgroundImage:
            "linear-gradient(to bottom, rgba(245,247,250,0), rgba(245,247,250,0.9))",
        } as object)
      : { backgroundColor: "rgba(245,247,250,0.6)" }),
  },
  zoom: {
    position: "absolute",
    right: 8,
    bottom: 8,
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#f2f5f8",
    backgroundColor: colors.white,
    boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
  },
  zoomText: {
    minWidth: 28,
    textAlign: "center",
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 18,
    color: "#2b303b",
  },
});
