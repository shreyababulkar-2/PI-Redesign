import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  useWindowDimensions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { colors, fonts } from "../theme";
import { pointer } from "../theme/cursor";
import { motion, press, transition } from "../theme/motion";
import { useHover } from "../hooks/useHover";
import { SideNav } from "../components/SideNav";
import { useScreen } from "../state/screen";
import { vdr } from "../assets/vdr";
import { thinking } from "../data/assistantAnswers";
import { useConversation } from "../hooks/useConversation";
import { AnswerView } from "../components/assistant/AnswerView";
import { FadeIn } from "../components/assistant/FadeIn";
import { ARTEFACTS } from "../data/artefacts";
import { DocDrawer, drawerWidthFor, DRAWER_MIN_WIDTH } from "../components/assistant/DocDrawer";
import { JumpToLatest } from "../components/assistant/JumpToLatest";
import { ThoughtBlock } from "../components/assistant/ThoughtBlock";

/**
 * Full view of the assistant (Figma "VDR - Agentic exp", node 28:15209 "Central chat"): chat history on the left,
 * a top bar with the chat title, and a 602px conversation column with the composer pinned underneath. Opened by
 * sending a question from the VDR composer. Geist throughout.
 */

type Src = (typeof vdr)[keyof typeof vdr];

function Img({ src, w, h = w, style }: { src: Src; w: number; h?: number; style?: object }) {
  return (
    <Image
      source={src}
      contentFit="fill"
      style={[{ width: w, height: h }, style]}
      accessibilityElementsHidden
    />
  );
}

const body = {
  fontFamily: fonts.geistRegular,
  fontSize: 12,
  lineHeight: 18,
  letterSpacing: 0.09,
  color: colors.slate800,
} as const;

/** Width the document drawer narrows to when the chat history is opened beside it. */
const HISTORY_OPEN_DRAWER_W = 398;


const HISTORY: { label: string; items: string[] }[] = [
  { label: "Today", items: ["IC discussion preparations", "Summarise Q3 financials"] },
  { label: "Yesterday", items: ["Valuation comps vs. peers", "Key legal risks in term sheet", "Market size & growth drivers"] },
  { label: "Last 7 days", items: ["Founder background check", "Cap table review", "Draft diligence checklist"] },
];

export function AssistantScreen() {
  const { question, go } = useScreen();
  const {
    turns,
    generating,
    send,
    stop,
    regenerate,
    finishStreaming,
    toggleThought,
    reset,
    streamedWords,
  } = useConversation(VDR_ANSWERS);
  // The open chat's name (top bar and history). A chat is "Untitled chat" until its answer starts to appear, and is
  // named then, so the name is worked out from the first turn rather than stored.
  const first = turns[0];
  const named =
    first !== undefined &&
    (first.phase === "streaming" ||
      first.phase === "done" ||
      (first.phase === "stopped" && first.stoppedWords > 0));
  const chatTitle = named ? chatNameFor(first.answerId, first.question) : UNTITLED;
  function newChat() {
    reset();
    turnY.current = {};
    lastResponse.current = { id: -1, y: 0, height: 0 };
    offsetY.current = 0;
    setShowJump(false);
  }
  const chatRef = useRef<ScrollViewInstance>(null);
  // The chat history can be collapsed (Figma 32:15465): the chat then spans the full width.
  const [historyOpen, setHistoryOpen] = useState(true);
  // The deal-documents menu opened from the top bar's document button (Figma 35:16243).
  const [docsOpen, setDocsOpen] = useState(false);
  // The artefacts menu from the first top-bar button (Figma 62:23858); it and the documents menu are never open together.
  const [artefactsOpen, setArtefactsOpen] = useState(false);
  // The "more" menu (Figma 60:22871): download, rename, archive, delete. Like the other two, never open with them.
  const [moreOpen, setMoreOpen] = useState(false);
  // The document open in the drawer at the right (null = closed). The dot in the menu follows this.
  // Web: a click anywhere outside the documents button/menu closes the menu. (No overlay: every View is its own
  // stacking context, so an overlay would sit above the menu and swallow its clicks.)
  useEffect(() => {
    if (!(docsOpen || artefactsOpen || moreOpen) || Platform.OS !== "web") return;
    const close = (e: Event) => {
      if ((e.target as Element | null)?.closest?.("[data-popup-menu]")) return;
      setDocsOpen(false);
      setArtefactsOpen(false);
      setMoreOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [docsOpen, artefactsOpen, moreOpen]);
  // The documents open in the drawer at the right, in the order they were opened; one is active. The dots in the menu
  // follow the open tabs. (Tabs are cleared only once the drawer has finished closing.)
  const [tabs, setTabs] = useState<string[]>([]);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  // The drawer opened by the top bar's panel button before any document: it shows an empty state.
  const [emptyOpen, setEmptyOpen] = useState(false);
  const [emptyMounted, setEmptyMounted] = useState(false);
  const drawerOpen = activeDoc !== null || emptyOpen;
  // The tab that was showing when the drawer was last closed: the panel button brings the drawer back on it, with the
  // other tabs still open.
  const lastDoc = useRef<string | null>(null);
  useEffect(() => {
    if (activeDoc) lastDoc.current = activeDoc;
  }, [activeDoc]);
  // True while the history is collapsed only because the drawer opened; closing the drawer then restores it.
  const foldedByDrawer = useRef(false);
  const [drawer] = useState(() => new Animated.Value(0));
  const [drawerW] = useState(() => new Animated.Value(500));
  // Width the user dragged the drawer to (kept for every document); until then each document has its own default.
  // Never more than half the window.
  const { width: windowWidth } = useWindowDimensions();
  const maxDrawer = Math.max(DRAWER_MIN_WIDTH, Math.floor(windowWidth * 0.5));
  const [customW, setCustomW] = useState<number | null>(null);
  const widthFor = (doc: string) => Math.min(customW ?? drawerWidthFor(doc), maxDrawer);
  const currentW = widthFor(activeDoc ?? tabs[tabs.length - 1] ?? "");
  // A narrower window can take the drawer past half: pull it back in. (Not tied to the active document, so switching
  // tabs can animate the width.)
  useEffect(() => {
    drawerW.stopAnimation((v) => {
      if (v > maxDrawer) drawerW.setValue(maxDrawer);
    });
  }, [maxDrawer, drawerW]);
  function resizeDrawer(w: number) {
    setCustomW(w);
    drawerW.setValue(w);
  }
  const slide = (value: Animated.Value, toValue: number, onDone?: () => void) =>
    Animated.timing(value, {
      toValue,
      duration: motion.base,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) onDone?.();
    });
  /** Opens a document in the drawer: a new tab (kept beside the others) that becomes the active one. */
  function pickDoc(doc: string) {
    setEmptyOpen(false);
    setTabs((t) => (t.includes(doc) ? t : [...t, doc]));
    setActiveDoc(doc);
    // The drawer needs the room: an open chat history folds away as it arrives.
    if (!drawerOpen && historyOpen) {
      toggleHistory(false);
      foldedByDrawer.current = true;
    }
    slide(drawerW, widthFor(doc));
    if (!drawerOpen) slide(drawer, 1);
  }
  /** Opens the drawer with nothing in it yet (the top bar's panel button). */
  function openEmptyDrawer() {
    setEmptyOpen(true);
    setEmptyMounted(true);
    if (historyOpen) {
      toggleHistory(false);
      foldedByDrawer.current = true;
    }
    slide(drawerW, widthFor(""));
    slide(drawer, 1);
  }
  function showTab(doc: string) {
    setActiveDoc(doc);
    slide(drawerW, widthFor(doc));
  }
  /** Closes the drawer. The open tabs are kept for the next time it opens, unless the last one was closed. */
  function closeDrawer(clearTabs = false) {
    setActiveDoc(null);
    setEmptyOpen(false);
    // The history that folded away for the drawer comes back with it (unless the user changed it in between).
    if (foldedByDrawer.current) toggleHistory(true, false);
    slide(drawer, 0, () => {
      if (clearTabs) setTabs([]);
      setEmptyMounted(false);
    });
  }
  function closeTab(doc: string) {
    const rest = tabs.filter((d) => d !== doc);
    if (rest.length === 0) return closeDrawer(true);
    setTabs(rest);
    if (doc === activeDoc) showTab(rest[Math.max(0, tabs.indexOf(doc) - 1)]);
  }
  // 1 = history shown, 0 = collapsed; everything that moves with it (panel, top bar, chat column) follows this value.
  const [open] = useState(() => new Animated.Value(1));
  const [historyMounted, setHistoryMounted] = useState(true);
  function toggleHistory(next: boolean, squeezeDrawer = true) {
    foldedByDrawer.current = false;
    setHistoryOpen(next);
    if (next) setHistoryMounted(true);
    // Opening the history beside an open drawer squeezes the chat, so the drawer gives room back: it narrows to 398px
    // (never wider than half the window) and stays there; a drawer already that narrow is left as it is.
    if (next && drawerOpen && squeezeDrawer) {
      const narrow = Math.min(HISTORY_OPEN_DRAWER_W, maxDrawer);
      if (currentW > narrow) {
        setCustomW(narrow);
        slide(drawerW, narrow);
      }
    }
    Animated.timing(open, {
      toValue: next ? 1 : 0,
      duration: motion.base,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !next) setHistoryMounted(false);
    });
  }

  // The question that opened this view is sent once, on arrival.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    send(question || DEFAULT_QUESTION);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Classic chat: a sent question lands below the latest output and the view scrolls down to it; the answer then
  // builds underneath, and the down arrow ("jump to latest") appears if it runs past the bottom of the view.
  const turnY = useRef<Record<number, number>>({});
  const pendingScroll = useRef<number | null>(null);
  const [chatHeight, setChatHeight] = useState(0);
  const lastTurnId = turns[turns.length - 1]?.id;
  useEffect(() => {
    pendingScroll.current = lastTurnId ?? null;
  }, [lastTurnId]);
  function onTurnLayout(id: number, y: number) {
    turnY.current[id] = y;
    if (id === lastTurnId) updateJump();
    if (pendingScroll.current === id) {
      pendingScroll.current = null;
      setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 30);
    }
  }

  // "Jump to latest": while the latest answer extends below the visible area, a button scrolls back to it (dots while it is
  // still being written, a down arrow once it is finished).
  const offsetY = useRef(0);
  const lastResponse = useRef({ id: -1, y: 0, height: 0 });
  const [showJump, setShowJump] = useState(false);
  function updateJump() {
    const { id, y, height } = lastResponse.current;
    const bottom = (turnY.current[id] ?? 0) + y + height;
    setShowJump(bottom - (offsetY.current + chatHeight) > 24);
  }
  useEffect(updateJump, [generating, chatHeight]);

  return (
    <View style={styles.root}>
      {historyMounted && (
        <Animated.View
          pointerEvents={historyOpen ? "auto" : "none"}
          style={{
            width: open.interpolate({ inputRange: [0, 1], outputRange: [0, 250] }),
            // The root's 8px gap is cancelled as the panel closes so the chat grows into it.
            marginRight: open.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
            opacity: open,
            overflow: "hidden",
          }}
        >
          <History title={chatTitle} onNewChat={newChat} onCollapse={() => toggleHistory(false)} />
        </Animated.View>
      )}
      <View style={styles.main}>
        <TopBar
          title={chatTitle}
          historyOpen={historyOpen}
          onTogglePanel={() => {
            if (drawerOpen) closeDrawer();
            else if (tabs.length > 0) pickDoc(lastDoc.current && tabs.includes(lastDoc.current) ? lastDoc.current : tabs[tabs.length - 1]);
            else openEmptyDrawer();
          }}
          open={open}
          onExpand={() => toggleHistory(true)}
          docsOpen={docsOpen}
          onDocs={() => {
            setArtefactsOpen(false);
            setMoreOpen(false);
            setDocsOpen((v) => !v);
          }}
          artefactsOpen={artefactsOpen}
          onArtefacts={() => {
            setDocsOpen(false);
            setMoreOpen(false);
            setArtefactsOpen((v) => !v);
          }}
          moreOpen={moreOpen}
          onMore={() => {
            setDocsOpen(false);
            setArtefactsOpen(false);
            setMoreOpen((v) => !v);
          }}
          onMoreAction={(action) => {
            setMoreOpen(false);
            if (action === "Delete conversation") newChat();
          }}
          openDocs={drawerOpen ? tabs : []}
          activeDoc={activeDoc}
          onPickArtefact={(t) => {
            pickDoc(t);
            setArtefactsOpen(false);
          }}
          onPickDoc={(d) => {
            pickDoc(d);
            setDocsOpen(false);
          }}
        />
        <Animated.View
          style={[
            styles.column,
            { maxWidth: drawer.interpolate({ inputRange: [0, 1], outputRange: [602, 500] }) },
          ]}
        >
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={chatRef}
              onLayout={(e) => setChatHeight(e.nativeEvent.layout.height)}
              onScroll={(e) => {
                offsetY.current = e.nativeEvent.contentOffset.y;
                updateJump();
              }}
              scrollEventThrottle={32}
              style={{ flex: 1 }}
              contentContainerStyle={styles.thread}
              showsVerticalScrollIndicator={false}
            >
              {turns.map((turn) => (
                <View
                  key={turn.id}
                  onLayout={(e) => onTurnLayout(turn.id, e.nativeEvent.layout.y)}
                  style={{ gap: 24 }}
                >
                  <FadeIn style={styles.userRow}>
                    <Animated.View
                      style={[
                        styles.bubble,
                        { maxWidth: drawer.interpolate({ inputRange: [0, 1], outputRange: [480, 400] }) },
                      ]}
                    >
                      <ClampedQuestion text={turn.question} />
                    </Animated.View>
                  </FadeIn>
                  <View
                    style={{ gap: 12 }}
                    onLayout={(e) => {
                      if (turn.id !== lastTurnId) return;
                      const { y, height } = e.nativeEvent.layout;
                      lastResponse.current = { id: turn.id, y, height };
                      updateJump();
                    }}
                  >
                    <ThoughtBlock
                      thinking={thinking[turn.answerId]}
                      phase={turn.phase}
                      steps={turn.steps}
                      expanded={turn.expanded}
                      onToggle={() => toggleThought(turn.id)}
                      startedAt={turn.startedAt}
                      thoughtSecs={turn.thoughtSecs}
                      stepTimes={turn.stepTimes}
                      white
                    />
                    {(turn.phase === "streaming" ||
                      turn.phase === "done" ||
                      (turn.phase === "stopped" && turn.stoppedWords > 0)) && (
                      <AnswerView
                        key={`${turn.id}-${turn.run}`}
                        wide
                        compact={drawerOpen}
                        answerId={turn.answerId}
                        phase={turn.phase}
                        stoppedWords={turn.stoppedWords}
                        onProgress={(w) => (streamedWords.current = w)}
                        onStreamed={() => finishStreaming(turn.id)}
                        onRegenerate={() => regenerate(turn.id)}
                      />
                    )}
                    {turn.phase === "stopped" && turn.stoppedWords === 0 && (
                      <Text style={styles.stopped}>You stopped this response</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
            {showJump && (
              <View pointerEvents="box-none" style={styles.jumpWrap}>
                <FadeIn rise={6} duration={180}>
                  <JumpToLatest generating={generating} onPress={() => chatRef.current?.scrollToEnd({ animated: true })} />
                </FadeIn>
              </View>
            )}
          </View>
          <ChatComposer onSend={send} generating={generating} onStop={stop} />
        </Animated.View>
      </View>
      {(tabs.length > 0 || emptyMounted) && (
        <Animated.View
          pointerEvents={drawerOpen ? "auto" : "none"}
          style={{
            width: Animated.multiply(drawer, drawerW),
            marginLeft: drawer.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
            opacity: drawer,
            overflow: "hidden",
          }}
        >
          <DocDrawer
            width={currentW}
            widthValue={drawerW}
            maxWidth={maxDrawer}
            onResize={resizeDrawer}
            tabs={tabs}
            active={activeDoc ?? tabs[tabs.length - 1] ?? null}
            onSelectTab={showTab}
            onCloseTab={closeTab}
            onClose={() => closeDrawer()}
            onGoTo={() => go("note")}
            onPickDoc={pickDoc}
          />
        </Animated.View>
      )}
      <SideNav />
    </View>
  );
}

/** The VDR prototype answers the first question with the IC-preparation summary and every later one with the EBITDA comparison. */
const UNTITLED = "Untitled chat";
/** The history entry that stands for the open chat itself: it is listed once, under whatever the chat is called. */
const OPEN_CHAT = "IC discussion preparations";

/** What the assistant calls a chat once it has started answering. */
function chatNameFor(answerId: string, question: string): string {
  if (answerId === "icprep") return OPEN_CHAT;
  return question.length > 40 ? `${question.slice(0, 40).trimEnd()}…` : question;
}

/**
 * A chat name that is typed out letter by letter when it replaces "Untitled chat", so the naming is noticed; any
 * other change (for instance back to "Untitled chat" for a new chat) shows at once.
 */
function TypedName({ text, style }: { text: string; style?: object }) {
  const [prev, setPrev] = useState(text);
  const [typed, setTyped] = useState<{ text: string; n: number } | null>(null);
  if (prev !== text) {
    setPrev(text);
    setTyped(prev === UNTITLED ? { text, n: 0 } : null);
  }
  const typing = typed !== null && typed.text === text && typed.n < text.length;
  useEffect(() => {
    if (!typing) return;
    const id = setInterval(() => {
      setTyped((t) => (t && t.n < t.text.length ? { ...t, n: t.n + 1 } : t));
    }, 32);
    return () => clearInterval(id);
  }, [typing]);
  return (
    <Text numberOfLines={1} style={style}>
      {typed && typed.text === text ? text.slice(0, typed.n) : text}
    </Text>
  );
}
const VDR_ANSWERS = ["icprep", "ebitda"] as const;

const DEFAULT_QUESTION =
  "Based on the available information, how prepared are we to make an investment decision? Highlight key considerations and gaps.";

/* ----------------------------------------------------------------- history */

function History({ title, onNewChat, onCollapse }: { title: string; onNewChat: () => void; onCollapse: () => void }) {
  return (
    <View style={styles.history}>
      <View style={styles.historyHead}>
        <Text style={[body, { fontFamily: fonts.geistMedium, letterSpacing: 0 }]}>Chat history</Text>
        <View style={styles.row6}>
          <SoftButton label="New chat" src={vdr.addChat} hoverSrc={vdr.addChatHover} w={16} onPress={onNewChat} />
          <SoftButton
            label="Collapse chat history"
            src={vdr.collapseHistory}
            hoverSrc={vdr.collapseHistoryHover}
            w={12}
            turn
            onPress={onCollapse}
          />
        </View>
      </View>
      <View style={styles.search}>
        <Img src={vdr.search} w={16} />
        <Text style={[body, { color: colors.slate500, letterSpacing: 0 }]}>Search chats</Text>
      </View>
      <HistoryList title={title} />
    </View>
  );
}

/** The chats grouped by day; the open chat leads today's list, whatever it is called. Shared by the panel and the hover popup. */
function HistoryList({ title }: { title: string }) {
  return (
    <View style={{ gap: 12 }}>
      {HISTORY.map((g, i) => (
        <View key={g.label} style={{ gap: 2 }}>
          <Text style={styles.date}>{g.label}</Text>
          {(i === 0 ? [title, ...g.items.filter((x) => x !== title && x !== OPEN_CHAT)] : g.items).map((item) => (
            <HistoryItem
              key={i === 0 && item === title ? "open-chat" : item}
              label={item}
              active={i === 0 && item === title}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * While the history is collapsed (Figma 101:3742): hovering the top bar's expand button shows the chat list in a small
 * popup under the top bar; only a click on the button opens the panel. The popup stays up while the pointer is on the
 * button or on it, and lets go a beat after the pointer leaves both.
 */
function HistoryPeek({
  visible,
  title,
  onEnter,
  onLeave,
}: {
  visible: boolean;
  title: string;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const reveal = useReveal(visible);
  // The popup is "hovered" for as long as the pointer is anywhere over it, its rows included. The Pressable hover events
  // fire a leave as the pointer crosses onto a row, so the web listens for the plain mouseenter / mouseleave instead
  // (those do not fire when moving between an element and its own children).
  const ref = useRef<unknown>(null);
  const live = useRef({ onEnter, onLeave });
  useEffect(() => {
    live.current = { onEnter, onLeave };
  }, [onEnter, onLeave]);
  useEffect(() => {
    const el = ref.current as HTMLElement | null;
    if (Platform.OS !== "web" || !el?.addEventListener) return;
    const enter = () => live.current.onEnter();
    const leave = () => live.current.onLeave();
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
  }, []);
  return (
    <Animated.View ref={ref as never} pointerEvents={visible ? "auto" : "none"} style={[styles.peekWrap, reveal]}>
      {/* The top 14px is a transparent bridge from the button to the card so the pointer can cross the gap. */}
      <View style={styles.peekBridge}>
        <View style={styles.peek}>
          <HistoryList title={title} />
        </View>
      </View>
    </Animated.View>
  );
}

function HistoryItem({ label, active }: { label: string; active: boolean }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.historyItem,
        active ? styles.historyActive : hover.hovered && { backgroundColor: colors.slate50 },
        press(pressed),
      ]}
    >
      {active && <View style={styles.activeDot} />}
      <TypedName
        text={label}
        style={{
          flex: 1,
          fontFamily: active ? fonts.geistMedium : fonts.geistRegular,
          fontSize: 12,
          lineHeight: 16,
          letterSpacing: active ? 0.144 : 0,
          color: active ? colors.pine900 : colors.slate600,
        }}
      />
    </Pressable>
  );
}

function SoftButton({
  label,
  src,
  w,
  h,
  turn,
  active,
  bare,
  hoverSrc,
  onPress,
  onHoverChange,
}: {
  label: string;
  src: Src;
  /** Icon shown on hover, faded in over the normal one: the same hover as the research note header's buttons (the button darkens a step and the icon turns green). */
  hoverSrc?: Src;
  w: number;
  h?: number;
  turn?: boolean;
  active?: boolean;
  /** No fill at rest (the compact bar's buttons, Figma 121:27309); the hover fill still shows. */
  bare?: boolean;
  onPress?: () => void;
  /** Called as the pointer enters (true) and leaves (false) the button. */
  onHoverChange?: (hovered: boolean) => void;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => {
        hover.handlers.onHoverIn();
        onHoverChange?.(true);
      }}
      onHoverOut={() => {
        hover.handlers.onHoverOut();
        onHoverChange?.(false);
      }}
      style={({ pressed }) => [
        styles.soft,
        bare && { backgroundColor: "transparent" },
        // One step darker on hover, the same as the composer's buttons.
        hover.hovered && { backgroundColor: colors.slate200 },
        active && { backgroundColor: "#f0f5f4" },
        press(pressed),
      ]}
    >
      <View style={turn ? { transform: [{ rotate: "180deg" }] } : undefined}>
        <Img src={src} w={w} h={h} />
        {hoverSrc && !active && (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { opacity: hover.hovered ? 1 : 0 }, transition(["opacity"], 150)]}
          >
            <Img src={hoverSrc} w={w} h={h} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ top bar */

function TopBar({
  title,
  historyOpen,
  open,
  onExpand,
  docsOpen,
  onDocs,
  artefactsOpen,
  onArtefacts,
  moreOpen,
  onMore,
  onMoreAction,
  openDocs,
  activeDoc,
  onPickDoc,
  onPickArtefact,
  onTogglePanel,
}: {
  title: string;
  historyOpen: boolean;
  open: Animated.Value;
  onExpand: () => void;
  docsOpen: boolean;
  onDocs: () => void;
  artefactsOpen: boolean;
  onArtefacts: () => void;
  moreOpen: boolean;
  onMore: () => void;
  onMoreAction: (action: string) => void;
  openDocs: string[];
  activeDoc: string | null;
  onPickDoc: (doc: string) => void;
  onPickArtefact: (title: string) => void;
  onTogglePanel: () => void;
}) {
  const closed = Animated.subtract(1, open);
  // The history peek: shown while the pointer is on the expand button or the popup, dropped shortly after it leaves both.
  const [peek, setPeek] = useState(false);
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdPeek = () => {
    if (peekTimer.current) clearTimeout(peekTimer.current);
    setPeek(true);
  };
  const releasePeek = () => {
    if (peekTimer.current) clearTimeout(peekTimer.current);
    peekTimer.current = setTimeout(() => setPeek(false), 140);
  };
  useEffect(() => () => {
    if (peekTimer.current) clearTimeout(peekTimer.current);
  }, []);
  const grow = (from: number, to: number) =>
    closed.interpolate({ inputRange: [0, 1], outputRange: [from, to] });
  return (
    <View style={styles.topBarWrap}>
    {/* Compact - VDR (Figma 114:27274): two floating pills over a soft fade the chat scrolls under. */}
    {/* 8px from the history panel when it is open (the page gap is already 8), 8px from the side nav when it is not. */}
    <Animated.View pointerEvents="box-none" style={[styles.compactBar, { left: grow(-8, -4) }]}>
      <Image source={vdr.compactBg} contentFit="fill" style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[styles.compactPill, styles.compactLeft]}>
        <Animated.View
          pointerEvents={historyOpen ? "none" : "box-none"}
          style={{
            width: grow(0, 37),
            marginRight: grow(-4, 0),
            opacity: closed,
            overflow: "hidden",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <SoftButton
            bare
            label="Expand chat history"
            src={vdr.compactExpand}
            w={13}
            onHoverChange={(h) => (h ? holdPeek() : releasePeek())}
            onPress={() => {
              if (peekTimer.current) clearTimeout(peekTimer.current);
              setPeek(false);
              onExpand();
            }}
          />
          <View style={styles.compactDivider} />
        </Animated.View>
        <View style={styles.compactCompany}>
          <Image source={vdr.companyLogo} style={{ width: 16, height: 16, borderRadius: 76 }} />
          <Text numberOfLines={1} style={styles.compactCompanyText}>
            Juspay Technologies Private limited
          </Text>
        </View>
      </View>
      <View style={[styles.compactPill, styles.compactActions]}>
        {/* The three buttons sit 2px apart (Figma 122:27775); the pill's 8px gap separates them from the divider. */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
        <View style={{ zIndex: 30 }} {...({ dataSet: { popupMenu: "1" } } as object)}>
          <SoftButton
          bare
            label="Artefacts"
            src={artefactsOpen ? vdr.assistantTopbarAActive : vdr.assistantTopbarA}
            hoverSrc={vdr.assistantTopbarAHover}
            w={16}
            active={artefactsOpen}
            onPress={onArtefacts}
          />
          <ArtefactsMenu open={artefactsOpen} onSelect={onPickArtefact} />
        </View>
        <View style={{ zIndex: 30 }} {...({ dataSet: { popupMenu: "1" } } as object)}>
          <SoftButton
          bare
            label="Deal documents"
            src={docsOpen ? vdr.assistantTopbarBActive : vdr.assistantTopbarB}
            hoverSrc={vdr.assistantTopbarBHover}
            w={docsOpen ? 8.64 : 16}
            h={docsOpen ? 11 : 16}
            active={docsOpen}
            onPress={onDocs}
          />
          <DocsMenu open={docsOpen} openDocs={openDocs} active={activeDoc} onSelect={onPickDoc} />
        </View>
        <View style={{ zIndex: 30 }} {...({ dataSet: { popupMenu: "1" } } as object)}>
          <SoftButton
          bare
            label="More"
            src={moreOpen ? vdr.topbarMoreActive : vdr.topbarMoreIdle}
            hoverSrc={vdr.topbarMoreActive}
            w={16}
            active={moreOpen}
            onPress={onMore}
          />
          <MoreMenu open={moreOpen} onAction={onMoreAction} />
        </View>
        </View>
        <View style={styles.compactActionsDivider} />
        <SoftButton bare label="Toggle document panel" src={vdr.topbarPanel} w={13} onPress={onTogglePanel} />
      </View>
    </Animated.View>
    <HistoryPeek visible={peek} title={title} onEnter={holdPeek} onLeave={releasePeek} />
    </View>
  );
}


const QUESTION_LINES = 3;

/**
 * The question in its bubble (Figma 88:25451): a long one stops after three lines with a trailing "…", and a click on
 * the bubble opens the whole message (a second click folds it again). On the web the cut is found by measuring, so the
 * "…" always sits at the end of the third line; native uses numberOfLines.
 */
function ClampedQuestion({ text }: { text: string }) {
  const web = Platform.OS === "web";
  const [expanded, setExpanded] = useState(false);
  const [shown, setShown] = useState(text);
  const [truncated, setTruncated] = useState(false);
  const ref = useRef<unknown>(null);
  const fit = useCallback(() => {
    const el = ref.current as HTMLElement | null;
    if (!web || !el || typeof document === "undefined") return;
    const cs = getComputedStyle(el);
    const lineHeight = parseFloat(cs.lineHeight) || 18;
    const limit = lineHeight * QUESTION_LINES + 1;
    // An off-screen copy of the text box, the same width and type, to see how many lines a given cut needs.
    const probe = document.createElement("div");
    probe.style.cssText = `position:absolute;visibility:hidden;left:-9999px;top:0;width:${el.getBoundingClientRect().width}px;font:${cs.font};letter-spacing:${cs.letterSpacing};line-height:${cs.lineHeight};white-space:pre-wrap;word-break:break-word;text-align:right`;
    document.body.appendChild(probe);
    probe.textContent = text;
    if (probe.scrollHeight <= limit) {
      setShown(text);
      setTruncated(false);
    } else {
      let lo = 0;
      let hi = text.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        probe.textContent = `${text.slice(0, mid).trimEnd()}…`;
        if (probe.scrollHeight <= limit) lo = mid;
        else hi = mid - 1;
      }
      setShown(`${text.slice(0, lo).trimEnd()}…`);
      setTruncated(true);
    }
    probe.remove();
  }, [text, web]);
  useLayoutEffect(fit, [fit]);
  const clickable = expanded || truncated || (!web && text.length > 0);
  return (
    <Pressable
      accessibilityRole={clickable ? "button" : undefined}
      accessibilityLabel={expanded ? "Show less" : "Show the whole message"}
      disabled={!clickable}
      onPress={() => setExpanded((v) => !v)}
      style={{ alignSelf: "stretch" }}
    >
      <Text
        ref={ref as never}
        onLayout={fit}
        numberOfLines={web || expanded ? undefined : QUESTION_LINES}
        style={[body, { textAlign: "right", color: colors.white }]}
      >
        {web && !expanded ? shown : text}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------- deal documents */

const DOCS = [
  "Research note",
  "IC memo",
  "Benchmarking",
  "Checklist",
  "Due diligence summary",
  "SHA / SPA / SSA summary",
];

/**
 * The deal-documents menu (Figma 35:16243): a small white card under the top bar's document button listing the
 * deal's documents, the document open in the drawer marked with a dot. It fades and drops in
 * and out, and a click anywhere outside closes it.
 */
/** Fade-and-drop animation shared by the top bar's popup menus: 0 = hidden, 1 = shown. */
function useReveal(open: boolean) {
  const [shown] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(shown, {
      toValue: open ? 1 : 0,
      duration: open ? motion.base : motion.fast,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: false,
    }).start();
  }, [open, shown]);
  return {
    opacity: shown,
    transform: [{ translateY: shown.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) }],
  };
}

function DocsMenu({
  open,
  openDocs,
  active,
  onSelect,
}: {
  open: boolean;
  openDocs: string[];
  active: string | null;
  onSelect: (doc: string) => void;
}) {
  const reveal = useReveal(open);
  return (
    <Animated.View pointerEvents={open ? "auto" : "none"} style={[styles.docsMenu, reveal]}>
      {DOCS.map((d) => (
        <DocsItem key={d} label={d} open={openDocs.includes(d)} active={d === active} onPress={() => onSelect(d)} />
      ))}
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ more menu */

const MORE_ITEMS: { label: string; icon: Src; danger?: boolean }[] = [
  { label: "Download", icon: vdr.menuDownload },
  { label: "Rename", icon: vdr.menuRename },
  { label: "Archive", icon: vdr.menuArchive },
  { label: "Delete conversation", icon: vdr.menuDelete, danger: true },
];

/** The "more" menu (Figma 60:22871): actions on the conversation, hanging from the last top-bar button. */
function MoreMenu({ open, onAction }: { open: boolean; onAction: (action: string) => void }) {
  const reveal = useReveal(open);
  return (
    <Animated.View pointerEvents={open ? "auto" : "none"} style={[styles.docsMenu, styles.moreMenu, reveal]}>
      {MORE_ITEMS.map((m) => (
        <MoreRow key={m.label} {...m} onPress={() => onAction(m.label)} />
      ))}
    </Animated.View>
  );
}

function MoreRow({ label, icon, danger, onPress }: { label: string; icon: Src; danger?: boolean; onPress: () => void }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [styles.docsItem, hover.hovered && { backgroundColor: colors.slate50 }, press(pressed)]}
    >
      <Img src={icon} w={20} />
      <Text style={[styles.docsText, { color: danger ? "#e93544" : colors.slate600 }]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ artefacts */

/**
 * The artefacts menu (Figma 62:23858): what the assistant has produced for this deal, as a 288 x 376 card that hangs
 * from the first top-bar button the way the documents menu hangs from the second (8px under the header, 8px from the
 * window edge). Each row has a thumbnail, a name with its file type and version, and a "more" button; the list scrolls.
 */
function ArtefactsMenu({ open, onSelect }: { open: boolean; onSelect: (title: string) => void }) {
  const reveal = useReveal(open);
  return (
    <Animated.View pointerEvents={open ? "auto" : "none"} style={[styles.docsMenu, styles.artefactsMenu, reveal]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {ARTEFACTS.map((a, i) => (
          <ArtefactRow key={i} {...a} onPress={() => onSelect(a.title)} />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

/** The row's "more" button: bare at rest, a light grey fill on hover like the other icon buttons. */
function MoreButton() {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="More"
      {...hover.handlers}
      style={({ pressed }) => [
        { width: 28, height: 28, borderRadius: 8, ...pointer },
        hover.hovered && { backgroundColor: colors.slate200 },
        press(pressed),
      ]}
    >
      <Img src={vdr.artefactMore} w={28} />
    </Pressable>
  );
}

function ArtefactRow({
  title,
  meta,
  kind,
  onPress,
}: {
  title: string;
  meta: string;
  kind: "sheet" | "doc";
  onPress: () => void;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [styles.artefactRow, hover.hovered && { backgroundColor: colors.slate50 }, press(pressed)]}
    >
      <View style={[styles.artefactThumb, { borderRadius: kind === "sheet" ? 8 : 4 }]}>
        {kind === "sheet" ? (
          <Image source={vdr.artefactSheet} contentFit="cover" style={{ width: 29.7, height: 31.4 }} />
        ) : (
          <Image source={vdr.artefactDoc} contentFit="contain" style={{ width: 29.3, height: 37.5 }} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text numberOfLines={1} style={styles.artefactTitle}>
          {title}
        </Text>
        <Text style={styles.artefactMeta}>{meta}</Text>
      </View>
      <MoreButton />
    </Pressable>
  );
}

function DocsItem({
  label,
  open,
  active,
  onPress,
}: {
  label: string;
  open: boolean;
  active: boolean;
  onPress: () => void;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.docsItem,
        hover.hovered && { backgroundColor: colors.slate50 },
        press(pressed),
      ]}
    >
      <View style={[styles.docsDot, { opacity: open ? 1 : 0 }]} />
      <Text style={[styles.docsText, { color: active ? colors.slate700 : colors.slate600 }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------------------------------------------------------------- composer */

function ChatComposer({
  onSend,
  generating,
  onStop,
}: {
  onSend: (q: string) => void;
  generating: boolean;
  onStop: () => void;
}) {
  const [value, setValue] = useState("");
  const [height, setHeight] = useState(18);
  const typing = value.trim().length > 0;
  const send = () => {
    const q = value.trim();
    if (!q) return;
    setValue("");
    setHeight(18);
    onSend(q);
  };
  return (
    <View style={styles.composer}>
      <View style={styles.row16}>
        <View style={styles.row8}>
          <SquareButton src={vdr.plus} label="Add" />
          <SquareButton src={vdr.attach} label="Attach" />
        </View>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Ask anything about this deal..."
          placeholderTextColor={colors.slate600}
          multiline
          numberOfLines={1}
          rows={1}
          onContentSizeChange={(e) => setHeight(Math.min(90, Math.max(18, e.nativeEvent.contentSize.height)))}
          onKeyPress={(e) => {
            const ev = e.nativeEvent as unknown as { key: string; shiftKey?: boolean };
            if (ev.key === "Enter" && !ev.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          accessibilityLabel="Ask anything about this deal"
          style={[styles.input, { height: typing ? height : 18 }]}
        />
        {generating ? (
          // One answer at a time: the send button becomes a stop button while the answer is being written.
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop generating"
            onPress={onStop}
            style={({ pressed }) => [styles.stop, press(pressed)]}
          >
            <View style={styles.stopSquare} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={!typing}
            onPress={send}
            style={({ pressed }) => [{ ...pointer }, press(pressed && typing)]}
          >
            <Img src={typing ? vdr.sendTyping : vdr.send} w={28} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function SquareButton({ src, label }: { src: Src; label: string }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.square,
        hover.hovered && { backgroundColor: colors.slate200 },
        press(pressed),
      ]}
    >
      <Img src={src} w={16} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ styles */

const styles = StyleSheet.create({
  // 56px clears the side nav; 8px gaps and inset (Figma: history at 60, top bar to 1272).
  root: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 56,
    paddingRight: 8,
    backgroundColor: colors.slate50,
  },
  row6: { flexDirection: "row", alignItems: "center", gap: 6 },
  row8: { flexDirection: "row", alignItems: "center", gap: 8 },
  row16: { flexDirection: "row", alignItems: "center", gap: 16 },

  history: {
    width: 250,
    // Fills the height of the animated wrapper it now sits in, as it did when it was a direct child of the row.
    flex: 1,
    gap: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.white,
  },
  historyHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  soft: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.slate50,
    ...pointer,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.slate50,
  },
  date: {
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.slate400,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 8,
    ...pointer,
    ...transition(["background-color"]),
  },
  historyActive: { backgroundColor: "#f0f5f4" },
  activeDot: { width: 4, height: 4, borderRadius: 100, backgroundColor: colors.pine900 },

  // zIndex lifts the top bar (and the documents menu hanging from it) above the history and drawer panels.
  main: { flex: 1, minWidth: 0, gap: 8, zIndex: 20 },
  // Overlays the chat, which scrolls beneath it (the thread's top padding clears it at rest).
  topBarWrap: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 30 },
  topBar: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
    // Above the chat below it, so the documents menu can hang over it.
    zIndex: 30,
  },
  company: { flexDirection: "row", alignItems: "center", gap: 4, height: 36 },
  // Compact - VDR (Figma 114:27274): 8px all round of the pills, over a soft fade.
  compactBar: {
    position: "absolute",
    // Flush with the top of the window: cancels the page's own 8px top padding.
    top: -8,
    // The page pads 4px beside the side nav and 8px at the right edge; the pills sit 8px from each (Figma 114:27274).
    left: -4,
    right: -8,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 8,
  },
  compactBg: { opacity: 1 },
  compactPill: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
    boxShadow: "0px 2px 12px rgba(15,23,41,0.08)",
  } as object,
  compactLeft: { width: 260, paddingLeft: 4, paddingRight: 8 },
  compactActions: {
    justifyContent: "center",
    paddingHorizontal: 4,
    boxShadow: "0px 1px 2px rgba(15,23,41,0.04), 0px 2px 12px rgba(15,23,41,0.08)",
  } as object,
  compactCompany: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, minWidth: 0 },
  compactCompanyText: {
    flex: 1,
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 18,
    color: colors.slate600,
    textTransform: "uppercase",
  },
  compactDivider: { width: 1, height: 16, borderRadius: 100, backgroundColor: colors.slate200 },
  compactActionsDivider: { width: 1, height: 12, borderRadius: 100, backgroundColor: colors.slate200 },
  companyText: {
    flex: 1,
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.44,
    textTransform: "uppercase",
    color: colors.slate600,
  },
  docsMenu: {
    // 8px below the header and 8px from the window edge (flush with the header's right edge): the button sits 8px above the header's bottom and 44px
    // from its right edge.
    position: "absolute",
    top: 44,
    right: -44,
    width: 190,
    zIndex: 20,
    gap: 2,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.white,
    shadowColor: "#181b25",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  // Right edge in line with the "more" button; 8px below the header like the others.
  moreMenu: { right: 0, width: 172 },
  // The history popup (Figma 101:3742): 220px wide, its card 6px below the top bar and in line with its left edge. The wrapper starts
  // at the bottom of the expand button so the bridge above the card joins the two.
  peekWrap: { position: "absolute", left: 0, top: 36, width: 220, zIndex: 40 },
  peekBridge: { paddingTop: 14 },
  peek: {
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.white,
    boxShadow: "0px 1px 3px rgba(24,27,37,0.05), 0px 8px 24px rgba(24,27,37,0.1)",
  } as object,
  artefactsMenu: { right: -80, width: 288, height: 376, gap: 0, overflow: "hidden" },
  artefactRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderRadius: 8, ...pointer },
  artefactThumb: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.slate50,
    overflow: "hidden",
  },
  artefactTitle: { fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 15, color: colors.slate800 },
  artefactMeta: { fontFamily: fonts.geistRegular, fontSize: 10, lineHeight: 14, color: colors.slate500 },
  docsItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 6,
    ...pointer,
  },
  docsDot: { width: 4, height: 4, borderRadius: 100, backgroundColor: colors.pine800 },
  docsText: { flexShrink: 0, fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 20, letterSpacing: 0.09 },
  companyDivider: { width: 1, height: 16, borderRadius: 100, backgroundColor: colors.slate200 },
  title: { fontFamily: fonts.geistMedium, fontSize: 14, lineHeight: 18, color: colors.slate800 },

  column: { flex: 1, width: "100%", maxWidth: 602, alignSelf: "center", paddingBottom: 8 },
  thread: { gap: 24, paddingTop: 52, paddingBottom: 24 },
  userRow: { alignItems: "flex-end" },
  bubble: {
    maxWidth: 480,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 2,
    // Figma 101:4272: solid pine with white text, no stroke.
    backgroundColor: colors.pine800,
  },

  jumpWrap: { position: "absolute", left: 0, right: 0, bottom: 8, alignItems: "center" },
  stopped: { fontFamily: fonts.geistRegular, fontSize: 10, lineHeight: 14, color: colors.slate500 },
  stop: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.pine700,
    ...pointer,
  },
  stopSquare: { width: 10, height: 10, borderRadius: 2, backgroundColor: colors.white },
  composer: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    boxShadow: "0px 2px 4px rgba(0,0,0,0.02)",
  },
  square: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.slate100,
    ...pointer,
    ...transition(["background-color"]),
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontFamily: fonts.geistRegular,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.09,
    color: colors.slate800,
    resize: "none",
    outlineStyle: "none",
  } as object,
});
