import { ComponentRef, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { colors, fonts } from "../../../../theme";
import { pointer } from "../../../../theme/cursor";
import { press, transition } from "../../../../theme/motion";
import { useHover } from "../../../../hooks/useHover";
import { WithTooltip } from "../../../../components/Tooltip";
import { memo } from "../../../../assets/memo";
import { vdr } from "../../../../assets/vdr";

/**
 * The IC memo tab of the deal scan (Figma 834:2649): a rail of slide thumbnails on the left, and the slides one under
 * the other beside it, each with its own column of actions. Slide 1 is the cover picture; the others share one layout:
 * an eyebrow, a headline, a green rule, two paragraphs and a table.
 */
/** The design size of a slide (Figma 834:2649); 16:9. */
const SLIDE_W = 717;
/**
 * Slides keep the width they have in the default state (rail open, filling the stage). Collapsing the rail does not
 * resize them: the stage just gets wider and the slides glide to the centre while the rail narrows.
 */
const RAIL_OPEN_W = 142;
/** The ticks start 40px down the rail; the popup starts 8px down it (Figma 834:2869). */
const TICKS_TOP = 40;
const POPUP_TOP = 8;
const RAIL_CLOSED_W = 44;
/** The actions column beside each slide: 28px of icons and a 4px gap. */
const ACTIONS_COLUMN = 32;
/** Collapsing the rail also widens the slides by this much (x becomes x + 32). */
const COLLAPSED_GROW = 32;
const SLIDE_EASING = Easing.bezier(0.4, 0, 0.2, 1);
/** The hover popup is at most 67.6% of the window height (562px of the 832px design frame). */
const POPUP_MAX_SHARE = 562 / 832;
const SLIDE_H = 404;

const SLIDES = [
  { key: "cover", label: "Slide 1: Cover" },
  {
    key: "profile",
    label: "Slide 2 - Company profile",
    eyebrow: "slide 2 - Company profile",
    title: "Company at a glance",
  },
  {
    key: "market",
    label: "Slide 3 - Market analysis",
    eyebrow: "slide 3 - Market analysis",
    title: "Market overview",
  },
  {
    key: "product",
    label: "Slide 4 - Product overview",
    eyebrow: "slide 4 - Product overview",
    title: "Product overview",
  },
  {
    key: "competition",
    label: "Slide 5 - Competitive landscape",
    eyebrow: "slide 5 - Competitive landscape",
    title: "Competitive landscape",
  },
  {
    key: "financials",
    label: "Slide 6 - Financial projections",
    eyebrow: "slide 6 - Financial projections",
    title: "Financial projections",
  },
  // The rail's seventh item (Figma 834:5574) is labelled "Slide 2: Market analysis" in the design; it sits under the fade.
  {
    key: "analysis",
    label: "Slide 7 - Market analysis",
    eyebrow: "slide 7 - Market analysis",
    title: "Market analysis",
  },
] as const;

const ROWS: [string, string, string][] = [
  [
    "Entry EV",
    "₹ 2,600 cr",
    "20.0x FY26E / 18.0x FY27E reported EBITDA; 17.6x FY27E sustainable",
  ],
  [
    "Negotiated discount to ask",
    "35%",
    "Mgmt ask: ₹4,000 Cr / 28x FY27E; PI hold: ₹2,600 Cr / 18x",
  ],
  [
    "Discount to listed median",
    "27%",
    "Listed FY27E median 24.7x; closest peer Jupiter 22.4x",
  ],
  ["Gross IRR", "Mgmt: ~25%; PI est: 24.5% base", "5-yr hold to FY30E"],
  ["MOIC", "Mgmt: 3.0x; PI est: 3.0x base", "₹300 Cr → ~₹893 Cr"],
];

const LEAD =
  "Lenskart is the definitive market leader in the organized eyewear retail market in India, with an estimated market share of ~30%. This is significantly ahead of its main organized competitor, Titan Eyeplus, which holds an estimated ~15% market share.";
const LEAD_2 =
  "This leadership has been driven by Lenskart’s strong omnichannel presence, vertically integrated supply chain, and aggressive investments in technology, branding, and customer experience.";
const NOTE =
  "The company's portfolio is dominated by its own private label brands (e.g., Vincent Chase for fast fashion, John Jacobs for premium). This strategy allows for higher gross margins and greater control over product trends.";

type PageProps = {
  /** How far the page is scrolled and how tall its view is: the slides scroll with the page, the rail sticks. */
  scrollY: number;
  viewportHeight: number;
  scrollTo: (y: number) => void;
  /** Tells the floating header which slide is current. */
  onActiveSlide?: (name: string) => void;
};

/** Where the rail and the slides' actions stick while the page scrolls: 8px below the floating header. */
const RAIL_STICK_TOP = 52;

export function ICMemoPage({
  scrollY,
  viewportHeight,
  scrollTo,
  onActiveSlide,
}: PageProps) {
  const [railOpen, setRailOpen] = useState(true);
  // Collapsing/expanding changes the layout at once; the slides are then slid from where they were (a transform, so it
  // stays smooth) and the rail card cross-fades with the ticks.
  const [shift] = useState(() => new Animated.Value(0));
  const [grow] = useState(() => new Animated.Value(1));
  const [ghost, setGhost] = useState(false);
  const [ghostFade] = useState(() => new Animated.Value(0));
  // The slides always have the width they get with the rail open: the row minus the open rail, the 8px gap and the
  // 32px actions column (the actions float beside the slide, outside its width).
  const [rootW, setRootW] = useState(0);
  // Read by the stage's layout handler, which can run before the re-render that follows a toggle.
  const railOpenRef = useRef(true);
  const slideRowWidth =
    rootW > 0 ? rootW - RAIL_OPEN_W - 8 - ACTIONS_COLUMN : 0;
  // Collapsed: the slide and its actions together sit centred between the ticks and the assistant, so the space from the
  // ticks to the slide matches the space from the actions to the assistant.
  const closedWidth = slideRowWidth + COLLAPSED_GROW;
  const closedMargin = Math.max(
    0,
    (rootW - RAIL_CLOSED_W - 8 - closedWidth - ACTIONS_COLUMN) / 2,
  );
  const toggleRail = () => {
    const next = !railOpen;
    railOpenRef.current = next;
    setRailOpen(next);
    // The layout changes at once; the stage is then transformed so it first looks exactly as it did before and eases to
    // the new layout. Scaling about the stage's top-left corner reproduces the old arrangement whatever the scroll
    // position (every slide's size and position scales with its width), and the rail and slides move together.
    const oldW = railOpen ? slideRowWidth : closedWidth;
    const newW = next ? slideRowWidth : closedWidth;
    const k = newW > 0 ? oldW / newW : 1;
    const newLeft = next ? 0 : closedMargin;
    const oldLeftRoot = railOpen
      ? RAIL_OPEN_W + 8
      : RAIL_CLOSED_W + 8 + closedMargin;
    const newStageLeftRoot = next ? RAIL_OPEN_W + 8 : RAIL_CLOSED_W + 8;
    shift.setValue(oldLeftRoot - newStageLeftRoot - newLeft * k);
    grow.setValue(k);
    Animated.timing(grow, {
      toValue: 1,
      duration: 360,
      easing: SLIDE_EASING,
      useNativeDriver: false,
    }).start();
    Animated.timing(shift, {
      toValue: 0,
      duration: 360,
      easing: SLIDE_EASING,
      useNativeDriver: false,
    }).start();
    if (!next) {
      setGhost(true);
      ghostFade.setValue(1);
      Animated.timing(ghostFade, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(() => setGhost(false));
    }
  };
  // Where this block starts in the page, and where each slide starts inside it.
  const [rootY, setRootY] = useState(0);
  const [offsets] = useState<Record<number, number>>({});
  const [stageH, setStageH] = useState(0);
  // The slide whose top is the last one at or above a probe line is the current one. The line sits just under the
  // floating header and, only over the last screenful of the page, slides down to the bottom of the view, so the last
  // slides can be reached even though they never scroll up to the top.
  const maxScroll = Math.max(1, rootY + stageH - viewportHeight);
  const span = Math.max(1, viewportHeight - RAIL_STICK_TOP - 20);
  const reach = Math.min(1, Math.max(0, 1 - (maxScroll - scrollY) / span));
  const probe = scrollY + RAIL_STICK_TOP + 20 + reach * span;
  let active = 0;
  SLIDES.forEach((_, i) => {
    if (rootY + (offsets[i] ?? 0) <= probe) active = i;
  });
  // A slide picked from the rail stays current once the page has arrived at it (the probe alone could name its
  // neighbour near the end of the page).
  const [picked, setPicked] = useState<{ i: number; y: number } | null>(null);
  // (If the page can't scroll that far, the end of the page counts as arriving.)
  if (
    picked &&
    scrollY <= picked.y + 3 &&
    scrollY >= Math.min(picked.y, maxScroll) - 6
  )
    active = picked.i;
  const activeName = (SLIDES[active] as { title?: string }).title ?? "Cover";
  useEffect(() => {
    onActiveSlide?.(activeName);
  }, [activeName, onActiveSlide]);
  const pick = (i: number) => {
    const y = i === 0 ? 0 : rootY + (offsets[i] ?? 0) - RAIL_STICK_TOP;
    setPicked({ i, y });
    scrollTo(y);
  };
  // Full height: from where the rail sits (under the header at rest, stuck under the floating header once scrolled) to 8px above the bottom.
  const railTop = Math.max(RAIL_STICK_TOP, rootY - scrollY);
  const railHeight = Math.max(320, viewportHeight - railTop - 8);
  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        setRootY(e.nativeEvent.layout.y);
        setRootW(e.nativeEvent.layout.width);
      }}
    >
      <View
        style={[
          styles.railStick,
          { height: railHeight, width: railOpen ? RAIL_OPEN_W : RAIL_CLOSED_W },
          !railOpen && { zIndex: 6 },
        ]}
      >
        <Rail
          active={active}
          open={railOpen}
          height={railHeight}
          onToggle={toggleRail}
          onPick={pick}
        />
        {ghost && !railOpen && (
          // The card that was just collapsed fades out over the slides instead of vanishing.
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: RAIL_OPEN_W,
              height: railHeight,
              opacity: ghostFade,
            }}
          >
            <RailPanel active={active} onToggle={toggleRail} onPick={pick} />
          </Animated.View>
        )}
      </View>
      <Animated.View
        style={[
          styles.stage,
          {
            transform: [{ translateX: shift }, { scale: grow }],
            transformOrigin: "0% 0%",
          },
        ]}
        onLayout={(e) => {
          setStageH(e.nativeEvent.layout.height);
          // The row is the rail, the 8px gap and the stage, so it can be worked out from the stage too.
          setRootW(
            Math.round(
              e.nativeEvent.layout.width +
                8 +
                (railOpenRef.current ? RAIL_OPEN_W : RAIL_CLOSED_W),
            ),
          );
        }}
      >
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={[
              styles.slideRow,
              slideRowWidth > 0 && {
                width: railOpen ? slideRowWidth : closedWidth,
              },
              // Open: the slide sits at the left of the stage. Collapsed: the slide and its floating actions are centred
              // between the ticks and the assistant.
              {
                alignSelf: "flex-start",
                marginLeft: railOpen ? 0 : closedMargin,
              },
            ]}
            onLayout={(e) => (offsets[i] = e.nativeEvent.layout.y)}
          >
            <View style={styles.slideWrap}>
              {s.key === "cover" ? (
                <Image
                  source={memo.cover}
                  contentFit="cover"
                  style={styles.cover}
                />
              ) : (
                <ScaledSlide>
                  <Slide eyebrow={s.eyebrow} title={s.title} />
                </ScaledSlide>
              )}
            </View>
            <View style={styles.actionsCol}>
              <Actions />
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

/* ----------------------------------------------------------------------- rail */

function Rail({
  active,
  open,
  height,
  onToggle,
  onPick,
}: {
  active: number;
  open: boolean;
  height: number;
  onToggle: () => void;
  onPick: (i: number) => void;
}) {
  return (
    <FadeIn style={{ flex: 1 }} key={open ? "open" : "closed"}>
      {open ? (
        <RailPanel active={active} onToggle={onToggle} onPick={onPick} />
      ) : (
        <ClosedRail
          active={active}
          height={height}
          onToggle={onToggle}
          onPick={onPick}
        />
      )}
    </FadeIn>
  );
}

/** Fades its children in when it mounts. */
function FadeIn({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [v]);
  return (
    <Animated.View style={[style, { opacity: v }]}>{children}</Animated.View>
  );
}

/**
 * The collapsed rail (Figma 834:2869): one tick per slide, the current one longer and green. Hovering it floats the full
 * list over the slides; moving away closes it again.
 */
function ClosedRail({
  active,
  height,
  onToggle,
  onPick,
}: {
  active: number;
  height: number;
  onToggle: () => void;
  onPick: (i: number) => void;
}) {
  // The popup opens while the pointer is over the ticks or the popup itself. Closing waits a moment, so crossing the
  // gap between them (or onto a thumbnail) never flickers it shut.
  const { height: windowHeight } = useWindowDimensions();
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enter = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setShown(true);
  };
  const leave = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShown(false), 200);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  // Web: real DOM mouseenter/mouseleave on the wrapper, which (unlike Pressable's hover) count the popup, a descendant
  // that sits outside the wrapper's box, as inside it.
  const boxRef = useRef<ComponentRef<typeof View>>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = boxRef.current as unknown as HTMLElement | null;
    if (!node) return;
    node.addEventListener("mouseenter", enter);
    node.addEventListener("mouseleave", leave);
    return () => {
      node.removeEventListener("mouseenter", enter);
      node.removeEventListener("mouseleave", leave);
    };
    // enter/leave only use refs and a state setter
  }, []);
  return (
    <View style={styles.closed}>
      {/* Only the ticks themselves (and the popup they open) react to the pointer. */}
      <View ref={boxRef} accessibilityLabel="Slides" style={styles.ticksBox}>
        <View style={styles.ticks}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.tick,
                i === active ? styles.tickActive : styles.tickIdle,
              ]}
            />
          ))}
        </View>
        {shown && (
          // The transparent left padding bridges the gap to the ticks so the popup stays open on the way across.
          <View
            style={[
              styles.popupHold,
              {
                height: Math.min(
                  height - POPUP_TOP,
                  Math.round(windowHeight * POPUP_MAX_SHARE),
                ),
              },
            ]}
          >
            <RailPanel
              expand
              active={active}
              onToggle={onToggle}
              onPick={onPick}
              style={styles.popup}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function RailPanel({
  active,
  onToggle,
  onPick,
  expand,
  style,
}: {
  active: number;
  onToggle: () => void;
  onPick: (i: number) => void;
  /** True in the hover popup, where the button expands the rail rather than collapsing it. */
  expand?: boolean;
  style?: object;
}) {
  const listRef = useRef<ScrollViewInstance>(null);
  const [atBottom, setAtBottom] = useState(false);
  // Where each thumbnail sits in the list, and how the list is scrolled, so the current slide can be kept in view.
  const [thumbs] = useState<Record<number, { y: number; h: number }>>({});
  const view = useRef({ top: 0, height: 0 });
  useEffect(() => {
    const t = thumbs[active];
    if (!t) return;
    const { top, height } = view.current;
    if (active === SLIDES.length - 1)
      listRef.current?.scrollToEnd({ animated: true });
    else if (t.y < top) listRef.current?.scrollTo({ y: t.y, animated: true });
    else if (t.y + t.h > top + height)
      listRef.current?.scrollTo({ y: t.y + t.h - height, animated: true });
  }, [active, thumbs]);
  return (
    <View style={[styles.rail, style]}>
      <View style={styles.railHead}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            expand ? "Expand slide list" : "Collapse slide list"
          }
          onPress={onToggle}
          style={({ pressed }) => [styles.railToggle, press(pressed)]}
        >
          <Image
            source={vdr.chevronsUp}
            contentFit="fill"
            style={{
              width: 16,
              height: 16,
              transform: [{ rotate: expand ? "-90deg" : "90deg" }],
            }}
          />
        </Pressable>
      </View>
      <>
        <ScrollView
          ref={listRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onLayout={(e) => (view.current.height = e.nativeEvent.layout.height)}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } =
              e.nativeEvent;
            view.current.top = contentOffset.y;
            const end =
              contentOffset.y + layoutMeasurement.height >=
              contentSize.height - 2;
            setAtBottom((v) => (v === end ? v : end));
          }}
        >
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              onLayout={(e) =>
                (thumbs[i] = {
                  y: e.nativeEvent.layout.y,
                  h: e.nativeEvent.layout.height,
                })
              }
            >
              <Thumb
                label={s.label}
                cover={i === 0}
                active={i === active}
                onPress={() => onPick(i)}
              />
            </View>
          ))}
        </ScrollView>
        {/* The list fades into the button at the bottom, until it is scrolled to its end. */}
        {!atBottom && <View pointerEvents="none" style={styles.railFade} />}
        <AddSlide />
      </>
    </View>
  );
}

function Thumb({
  label,
  cover,
  active,
  onPress,
}: {
  label: string;
  cover: boolean;
  active: boolean;
  onPress: () => void;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      {...hover.handlers}
      style={[
        styles.thumb,
        active
          ? styles.thumbActive
          : hover.hovered && { backgroundColor: colors.slate100 },
        transition(["background-color"]),
      ]}
    >
      <Image
        source={cover ? memo.thumbCover : memo.thumbSlide}
        contentFit="cover"
        style={styles.thumbImage}
      />
      <Text
        numberOfLines={1}
        style={[styles.thumbLabel, active && styles.thumbLabelActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AddSlide() {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.add, press(pressed)]}
    >
      <Text style={styles.addText}>Add new slide</Text>
    </Pressable>
  );
}

/* --------------------------------------------------------------------- slides */

/** The slide actions: a transparent icon at rest; on hover a white chip, a green icon and a dark tooltip with its name. */
const ACTIONS = [
  {
    label: "Comments",
    icon: memo.actionComment,
    hoverIcon: memo.actionCommentHover,
  },
  { label: "Edit", icon: memo.actionEdit, hoverIcon: memo.actionEditHover },
  { label: "Sources", icon: memo.actionLink, hoverIcon: memo.actionLinkHover },
  {
    label: "Delete",
    icon: memo.actionDelete,
    hoverIcon: memo.actionDeleteHover,
  },
] as const;

function Actions() {
  return (
    <View style={styles.actions}>
      {ACTIONS.map((a) => (
        <ActionButton key={a.label} {...a} />
      ))}
    </View>
  );
}

function ActionButton({
  label,
  icon,
  hoverIcon,
}: {
  label: string;
  icon: number;
  hoverIcon: number;
}) {
  const hover = useHover();
  return (
    <WithTooltip text={label} style={styles.actionWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        {...hover.handlers}
        style={({ pressed }) => [
          styles.action,
          hover.hovered && { backgroundColor: colors.white },
          press(pressed),
        ]}
      >
        <Image
          source={hover.hovered ? hoverIcon : icon}
          contentFit="fill"
          style={{ width: 16, height: 16 }}
        />
      </Pressable>
    </WithTooltip>
  );
}

/**
 * A slide is a 16:9 page drawn at its design size (717 x 404) and scaled to the room it has, so the type, the table and
 * the spacing all grow and shrink together, as on a PPT slide, with no empty strip beside it.
 */
function ScaledSlide({ children }: { children: React.ReactNode }) {
  const [width, setWidth] = useState(SLIDE_W);
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        width: "100%",
        aspectRatio: SLIDE_W / SLIDE_H,
        overflow: "hidden",
        borderRadius: 10,
      }}
    >
      <View
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: [{ scale: width / SLIDE_W }],
          transformOrigin: "0% 0%",
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Slide({ eyebrow, title }: { eyebrow?: string; title?: string }) {
  return (
    <View style={styles.slide}>
      <View style={{ gap: 4 }}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.rule} />
      <View style={{ gap: 12 }}>
        <View>
          <Text style={styles.body}>{LEAD}</Text>
          <Text style={styles.body}>{LEAD_2}</Text>
        </View>
        <Text style={styles.note}>{NOTE}</Text>
      </View>
      <MemoTable />
    </View>
  );
}

function MemoTable() {
  return (
    <View style={styles.table}>
      <View style={styles.headRow}>
        {["Metric", "Value in Cr", "Context"].map((h, c) => (
          <View key={h} style={[styles.headCell, COLS[c]]}>
            <Text style={styles.headText}>{h}</Text>
          </View>
        ))}
      </View>
      {ROWS.map((row) => (
        <View key={row[0]} style={styles.row}>
          <View style={[styles.labelCell, COLS[0]]}>
            <Text style={styles.labelText}>{row[0]}</Text>
          </View>
          <View style={[styles.cell, COLS[1]]}>
            <Text style={styles.valueText}>{row[1]}</Text>
          </View>
          <View style={[styles.cell, COLS[2]]}>
            <Text numberOfLines={1} style={styles.contextText}>
              {row[2]}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Column shares of the table: 173 / 183 / 303 of 659. */
const COLS = [{ flex: 173 }, { flex: 183 }, { flex: 303 }];

const stickyTop = (
  Platform.OS === "web" ? { position: "sticky", top: RAIL_STICK_TOP } : null
) as object;
const stickyActions = (
  Platform.OS === "web" ? { position: "sticky", top: RAIL_STICK_TOP } : null
) as object;
const small = {
  fontFamily: fonts.geistRegular,
  color: colors.slate800,
} as const;
const ruleGradient = (
  Platform.OS === "web"
    ? {
        backgroundImage:
          "linear-gradient(to right, #90bf89, rgba(144,191,137,0.2))",
      }
    : { backgroundColor: "#90bf89" }
) as object;
const popupShadow = (
  Platform.OS === "web"
    ? { boxShadow: "2px 4px 12px rgba(0,0,0,0.15)" }
    : { elevation: 6 }
) as object;
const railGradient = (
  Platform.OS === "web"
    ? {
        backgroundImage:
          "linear-gradient(to bottom, rgba(245,247,250,0) 16%, #ffffff 100%)",
        // The last slides blur out under the fade, stronger towards the button.
        backdropFilter: "blur(1.5px)",
        WebkitBackdropFilter: "blur(1.5px)",
        maskImage: "linear-gradient(to bottom, transparent 0%, #000 40%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 40%)",
      }
    : { backgroundColor: "rgba(255,255,255,0.9)" }
) as object;
const addGradient = (
  Platform.OS === "web"
    ? {
        backgroundImage: `linear-gradient(130deg, ${colors.pine700} 4.6%, ${colors.pine900} 102.6%)`,
      }
    : { backgroundColor: colors.pine800 }
) as object;

const styles = StyleSheet.create({
  // Stretches to the column (the page centres its content, which would let the slides push it wider).
  root: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  // The rail stays under the floating header while the slides scroll past (web).
  railStick: { width: RAIL_OPEN_W, ...stickyTop },
  // The slides' column: 717 wide slides beside a 28px column of actions, 4px apart.
  stage: { flex: 1, minWidth: 0, gap: 16, paddingBottom: 8 },
  slideRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  // Floats 4px to the right of the slide, over the full height of the row so the icons can stick inside it.
  actionsCol: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "100%",
    marginLeft: 4,
    width: 28,
  },
  slideWrap: { flex: 1, minWidth: 0 },
  cover: { width: "100%", aspectRatio: 717 / 404, borderRadius: 10 },
  // Like the research note's card actions: at the top of the slide at rest, then stuck under the floating header while the
  // slide scrolls past (web).
  actions: { marginTop: 16, gap: 4, ...stickyActions },
  actionWrap: { width: 28, height: 28 },
  action: {
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
    ...transition(["background-color"]),
  },

  rail: {
    flex: 1,
    width: 142,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  closed: { flex: 1, width: 44 },
  // Ticks sit 24px in from the left and start 40px down (Figma 834:2924).
  ticksBox: {
    marginTop: TICKS_TOP,
    width: RAIL_CLOSED_W,
    paddingVertical: 6,
  },
  ticks: { paddingLeft: 24, gap: 8 },
  tick: { height: 2, borderRadius: 2 },
  tickActive: { width: 20, backgroundColor: colors.pine800 },
  tickIdle: { width: 14, backgroundColor: colors.slate300 },
  popupHold: {
    position: "absolute",
    top: POPUP_TOP - TICKS_TOP,
    left: RAIL_CLOSED_W,
    paddingLeft: 10,
  },
  popup: {
    flex: 1,
    borderColor: "#ddedda",
    ...popupShadow,
  },
  railHead: { flexDirection: "row", alignItems: "center" },
  railToggle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    ...pointer,
  },
  thumb: {
    gap: 6,
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: colors.slate50,
    ...pointer,
  },
  thumbActive: { backgroundColor: "#f0f5f4", borderColor: "#eef6ec" },
  thumbImage: { width: "100%", height: 62, borderRadius: 6 },
  thumbLabel: {
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.05,
    color: colors.slate500,
    paddingHorizontal: 2,
  },
  thumbLabelActive: { fontFamily: fonts.geistMedium, color: colors.slate700 },
  railFade: {
    position: "absolute",
    left: 1,
    right: 1,
    bottom: 0,
    height: 137,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    ...railGradient,
  },
  add: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    ...addGradient,
    ...pointer,
  },
  addText: {
    fontFamily: fonts.geistMedium,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: colors.white,
  },

  slide: {
    width: SLIDE_W,
    height: SLIDE_H,
    padding: 28,
    gap: 16,
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.white,
  },
  eyebrow: {
    fontFamily: fonts.geistMedium,
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: 0.12,
    textTransform: "uppercase",
    color: colors.slate500,
  },
  title: {
    fontFamily: fonts.geistSemiBold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.2,
    color: colors.pine800,
  },
  rule: { height: 1, ...ruleGradient },
  body: { ...small, fontSize: 10, lineHeight: 16, letterSpacing: 0.075 },
  note: { ...small, fontSize: 9, lineHeight: 13.6, letterSpacing: 0.07 },
  table: {
    borderRadius: 8,
    borderWidth: 0.75,
    borderColor: colors.slate200,
    overflow: "hidden",
    gap: 1,
  },
  headRow: {
    flexDirection: "row",
    gap: 0.75,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#ded9da",
  },
  headCell: {
    padding: 8,
    backgroundColor: "#ded9da",
    justifyContent: "center",
  },
  headText: {
    fontFamily: fonts.geistSemiBold,
    fontSize: 8.3,
    lineHeight: 13.6,
    letterSpacing: 0.06,
    color: colors.slate700,
  },
  row: {
    flexDirection: "row",
    gap: 1,
    alignItems: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  labelCell: {
    padding: 6,
    minHeight: 25.7,
    backgroundColor: colors.slate50,
    borderRightWidth: 1,
    borderRightColor: colors.white,
  },
  cell: { padding: 6, minHeight: 25.7, backgroundColor: colors.white },
  labelText: { ...small, fontSize: 8.3, lineHeight: 13.6, letterSpacing: 0.06 },
  valueText: {
    ...small,
    fontFamily: fonts.geistSemiBold,
    fontSize: 7.5,
    lineHeight: 12,
    letterSpacing: 0.04,
  },
  contextText: {
    ...small,
    fontFamily: fonts.geistSemiBold,
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 0.04,
  },
});
