import {
  ComponentRef,
  CSSProperties,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform, View, ViewStyle } from "react-native";
import { createPortal } from "react-dom";
import { colors, fonts } from "../theme";

/** Which side of the element the tooltip sits on; its arrow points back at the element. */
export type TooltipSide = "right" | "left" | "bottom";

type Anchor = { x: number; y: number; width: number; height: number };

const BG = "#181b25";
/** Gap from the element to the chip: a 4px arrow plus 1px of air (Figma 484:1892 / 501:8232). */
const OFFSET = 5;

/**
 * Where the tooltip box goes for each side, the direction its content is laid out in, and the arrow (a CSS
 * triangle) that points back at the element. `from` is where it drifts in from.
 */
function layoutFor(
  side: TooltipSide,
  a: Anchor,
  shown: boolean,
): { box: CSSProperties; arrow: CSSProperties } {
  const drift = shown ? 0 : 3;
  if (side === "bottom") {
    return {
      box: {
        left: a.x + a.width / 2,
        top: a.y + a.height + OFFSET,
        flexDirection: "column",
        transform: `translateX(-50%) translateY(${-drift}px)`,
      },
      arrow: {
        borderLeft: "4px solid transparent",
        borderRight: "4px solid transparent",
        borderBottom: `4px solid ${BG}`,
        marginBottom: -0.5,
      },
    };
  }
  if (side === "left") {
    return {
      box: {
        left: a.x - OFFSET,
        top: a.y + a.height / 2,
        flexDirection: "row-reverse",
        transform: `translate(-100%, -50%) translateX(${drift}px)`,
      },
      arrow: {
        borderTop: "4px solid transparent",
        borderBottom: "4px solid transparent",
        borderLeft: `4px solid ${BG}`,
        marginLeft: -0.5,
      },
    };
  }
  return {
    box: {
      left: a.x + a.width + OFFSET,
      top: a.y + a.height / 2,
      flexDirection: "row",
      transform: `translateY(-50%) translateX(${-drift}px)`,
    },
    arrow: {
      borderTop: "4px solid transparent",
      borderBottom: "4px solid transparent",
      borderRight: `4px solid ${BG}`,
      marginRight: -0.5,
    },
  };
}

type Props = {
  text: string;
  side?: TooltipSide;
  /** `small` is a compact variant for showing full text that was cut short: 10px, wraps at 280px. */
  size?: "default" | "small";
  /** Viewport position of the element the tooltip belongs to (`measureInWindow`). */
  anchor: Anchor;
};

/**
 * Dark tooltip with a small arrow pointing at its element (Figma 484:1892, 501:8232). It is drawn on `document.body`
 * so it can overlap neighbouring panels instead of being clipped by the scrolling note area. It fades in over 120ms
 * with a 3px drift. Web only; nothing on native.
 */
export function Tooltip({
  text,
  anchor,
  side = "right",
  size = "default",
}: Props) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (Platform.OS !== "web" || typeof document === "undefined") return null;
  const { box, arrow } = layoutFor(side, anchor, shown);
  return createPortal(
    <div
      role="tooltip"
      style={{
        position: "fixed",
        display: "flex",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 100000,
        opacity: shown ? 1 : 0,
        transition:
          "opacity 120ms cubic-bezier(0.2,0,0,1), transform 120ms cubic-bezier(0.2,0,0,1)",
        ...box,
      }}
    >
      <div style={{ width: 0, height: 0, ...arrow }} />
      <div
        style={
          size === "small"
            ? {
                maxWidth: 280,
                padding: "3px 6px",
                borderRadius: 4,
                background: BG,
                color: colors.white,
                fontFamily: fonts.geistMedium,
                fontSize: 10,
                lineHeight: "14px",
                overflowWrap: "anywhere",
              }
            : {
                height: 26,
                padding: "0 8px",
                display: "flex",
                alignItems: "center",
                borderRadius: 4,
                background: BG,
                color: colors.white,
                fontFamily: fonts.geistSemiBold,
                fontSize: 11,
                lineHeight: "18px",
                whiteSpace: "nowrap",
              }
        }
      >
        {text}
      </div>
    </div>,
    document.body,
  );
}

type TargetProps = {
  text: string;
  side?: TooltipSide;
  /** No tooltip while true (e.g. the button's own menu is open). */
  disabled?: boolean;
  /** Compact tooltip for the full text of something truncated. */
  size?: "default" | "small";
  /** Only show the tooltip when the wrapped text is actually cut off (`...`), checked on hover. */
  onlyIfTruncated?: boolean;
  style?: ViewStyle;
  children: ReactNode;
};

/**
 * Wraps anything and shows `text` in a tooltip while the pointer is over it. Uses pointer enter/leave, which also
 * fire for nested buttons, so it works around Pressables and menu triggers alike.
 */
export function WithTooltip({
  text,
  side = "right",
  disabled = false,
  size = "default",
  onlyIfTruncated = false,
  style,
  children,
}: TargetProps) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [hovered, setHovered] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [cut, setCut] = useState(true);
  useEffect(() => {
    if (!hovered) return;
    ref.current?.measureInWindow((x, y, width, height) =>
      setAnchor({ x, y, width, height }),
    );
    if (onlyIfTruncated && Platform.OS === "web") {
      // The text node is the first descendant with a `dir` attribute; it is cut off when it scrolls wider than it shows.
      const el = ref.current as unknown as HTMLElement | null;
      const node = (el?.querySelector("[dir]") as HTMLElement | null) ?? el;
      setCut(!!node && node.scrollWidth > node.clientWidth + 1);
    }
  }, [hovered, onlyIfTruncated]);
  return (
    <View
      ref={ref}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={style}
    >
      {children}
      {hovered && !disabled && anchor && (!onlyIfTruncated || cut) && (
        <Tooltip text={text} anchor={anchor} side={side} size={size} />
      )}
    </View>
  );
}
