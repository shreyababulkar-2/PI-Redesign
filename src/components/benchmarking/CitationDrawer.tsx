import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { createPortal } from "react-dom";
import { colors, fonts } from "../../theme";
import { CellSource } from "../../data/benchmarking";
import { sourceFor } from "../../data/citations";
import { OVERWRITE, Overwrite, useBenchmarkCitation } from "../../state/benchmarkCitation";
import { useHover } from "../../hooks/useHover";
import { Icon } from "../Icon";
import { FadeIn } from "../assistant/FadeIn";
import { WithTooltip } from "../Tooltip";
import { ExpandedSource } from "../viewer/DocumentViewer";
import { pointer } from "../../theme/cursor";
import { press, transition } from "../../theme/motion";
import { CITATION_TARGETS, CitationTarget } from "./citationTargets";

/**
 * The citation drawer for a figure in the benchmarking tables (Figma 829:19751 when its sources agree, 889:4552 when they
 * do not). It takes the assistant's place: the figure's name and where it sits, the value in use with the sources behind
 * it, and, when the sources disagree, the other values with theirs to choose from. ‹ › step through every sourced figure.
 * Choosing a value only changes what the drawer marks as in use; "Overwrite value" is the footer's job.
 */
export function CitationDrawer() {
  const { openId, close } = useBenchmarkCitation();
  const index = CITATION_TARGETS.findIndex((t) => t.id === openId);
  useEffect(() => {
    if (index < 0 || Platform.OS !== "web") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, close]);
  if (index < 0) return null;
  return (
    <FadeIn rise={0} duration={160} style={styles.panel as object}>
      <Header index={index} />
      {/* Keyed by figure, so choosing or overwriting a value starts afresh on each. */}
      <Figure key={CITATION_TARGETS[index].id} target={CITATION_TARGETS[index]} />
    </FadeIn>
  );
}

/* ------------------------------------------------------------------ header */

function Header({ index }: { index: number }) {
  const { open, close } = useBenchmarkCitation();
  const total = CITATION_TARGETS.length;
  const go = (delta: number) => open(CITATION_TARGETS[(index + delta + total) % total].id);
  return (
    <View style={styles.header}>
      <View style={styles.stepper}>
        <HeaderButton label="Previous citation" onPress={() => go(-1)}>
          <Icon name="citePrev" size={16} />
        </HeaderButton>
        <Text style={styles.count}>
          Citation {index + 1}
          <Text style={styles.countTotal}> /{total}</Text>
        </Text>
        <HeaderButton label="Next citation" onPress={() => go(1)}>
          <Icon name="citeNext" size={16} />
        </HeaderButton>
      </View>
      <HeaderButton label="Close citation" onPress={close} round>
        <Icon name="citeClose" size={18} />
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
    <WithTooltip text={label} side="bottom">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        {...hover.handlers}
        style={({ pressed }) => [
          round ? styles.closeButton : styles.stepButton,
          hover.hovered && { backgroundColor: "rgba(255,255,255,0.2)" },
          transition(["background-color"]),
          press(pressed),
        ]}
      >
        {children}
      </Pressable>
    </WithTooltip>
  );
}

/* -------------------------------------------------------------------- body */

/** One value the sources give, with the sources that give it. */
type Option = { value: string; sources: CellSource[] };

/** The figure's value (in use) first, then each other value the sources give, in order. */
function optionsOf(target: CitationTarget): Option[] {
  if (!target.conflict) return [{ value: target.value, sources: target.sources }];
  const order: string[] = [target.value];
  target.sources.forEach((s) => {
    if (s.value && !order.includes(s.value)) order.push(s.value);
  });
  return order.map((value) => ({ value, sources: target.sources.filter((s) => s.value === value) }));
}

const numeric = (v: string) => parseFloat(v.replace(/,/g, ""));

/**
 * One figure's body and footer. The value in use, and a value typed over the sources', are kept by the provider so
 * they survive closing the drawer. Choosing another value leaves every card where it is; the card in use moves to
 * the top only when the figure is opened again.
 */
function Figure({ target }: { target: CitationTarget }) {
  const { pickOf, setPick } = useBenchmarkCitation();
  const options = useMemo(() => optionsOf(target), [target]);
  const pick = pickOf(target.id);
  const { overwrite } = pick;
  const selectedKey =
    pick.selected === OVERWRITE && overwrite
      ? OVERWRITE
      : options.some((o) => o.value === pick.selected)
        ? (pick.selected as string)
        : options[0].value;
  // Frozen when the figure opens: the card in use first, then the rest as they come.
  const [order, setOrder] = useState<string[]>(() => {
    const all = [...(overwrite ? [OVERWRITE] : []), ...options.map((o) => o.value)];
    return [selectedKey, ...all.filter((k) => k !== selectedKey)];
  });
  // "add" opens the modal empty; "edit" opens it with the value already typed.
  const [editing, setEditing] = useState<"add" | "edit" | null>(null);
  // A card typed in during this visit eases in; one already there when the drawer opens does not.
  const [fresh, setFresh] = useState(false);
  // The source open full size, by citation number.
  const [source, setSource] = useState<number | null>(null);

  const select = (key: string) => setPick(target.id, { overwrite, selected: key });
  const save = (o: Overwrite) => {
    setPick(target.id, { overwrite: o, selected: OVERWRITE });
    setOrder((cur) => (cur.includes(OVERWRITE) ? cur : [OVERWRITE, ...cur]));
    setFresh(true);
    setEditing(null);
  };
  const remove = () => {
    setPick(target.id, { overwrite: null, selected: selectedKey === OVERWRITE ? null : pick.selected });
    setOrder((cur) => cur.filter((k) => k !== OVERWRITE));
  };

  const current = numeric(selectedKey === OVERWRITE && overwrite ? overwrite.value : selectedKey);
  const selectable = target.conflict || overwrite !== null;
  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{target.row}</Text>
          <View style={styles.metaRow}>
            <View style={styles.meta}>
              <Text style={styles.metaText}>{target.cell}</Text>
              <View style={styles.dot} />
              <Text style={styles.metaText}>{target.metric}</Text>
              <View style={styles.dot} />
              <Text style={styles.metaText}>{target.detail}</Text>
            </View>
            <ActivityLink />
          </View>
        </View>
        {target.conflict && (
          <View style={styles.banner}>
            <Icon name="cardWarning" size={16} />
            <Text style={styles.bannerText}>
              {`${target.sources.length} sources report ${options.length} different values. Choose one from below or overwrite it manually.`}
            </Text>
          </View>
        )}
        <View style={styles.cards}>
          {order.map((key) =>
            key === OVERWRITE ? (
              overwrite && (
                <OverwrittenCard
                  key={key}
                  overwrite={overwrite}
                  selected={selectedKey === OVERWRITE}
                  current={current}
                  animate={fresh}
                  onSelect={() => select(OVERWRITE)}
                  onEdit={() => setEditing("edit")}
                  onDelete={remove}
                />
              )
            ) : (
              <ValueCard
                key={key}
                option={options.find((o) => o.value === key) ?? options[0]}
                selectable={selectable}
                selected={selectedKey === key}
                current={current}
                onSelect={() => select(key)}
                onOpenSource={setSource}
              />
            ),
          )}
        </View>
        {source !== null && (
          <ExpandedSource source={sourceFor(source)} n={source} claim="" onClose={() => setSource(null)} />
        )}
      </ScrollView>
      <Footer onOpen={() => setEditing("add")} />
      {editing && (
        <OverwriteModal initial={editing === "edit" ? overwrite : null} onClose={() => setEditing(null)} onSave={save} />
      )}
    </>
  );
}

/** "Lower" or "Higher" than the value in use: amber below, red above. */
function Compare({ diff }: { diff: number }) {
  if (diff === 0) return null;
  const lower = diff < 0;
  return (
    <View style={[styles.chip, lower && { backgroundColor: "#fffaeb" }]}>
      <Text style={[styles.chipText, lower && { color: "#a78025" }]}>{lower ? "Lower" : "Higher"}</Text>
    </View>
  );
}

function ValueCard({
  option,
  selectable,
  selected,
  current,
  onSelect,
  onOpenSource,
}: {
  option: Option;
  /** The sources disagree, or a value was typed over them, so the cards can be chosen between. */
  selectable: boolean;
  selected: boolean;
  /** The value in use, to say whether this one is lower or higher. */
  current: number;
  onSelect: () => void;
  onOpenSource: (n: number) => void;
}) {
  const hover = useHover();
  const n = option.sources.length;
  const diff = numeric(option.value) - current;
  return (
    <View
      style={[
        styles.card,
        { borderColor: !selectable ? colors.slate200 : selected ? colors.pine700 : colors.slate100 },
        !selectable && { paddingHorizontal: 1 },
        transition(["border-color"]),
      ]}
    >
      <Pressable
        accessibilityRole={selectable ? "radio" : undefined}
        accessibilityState={selectable ? { checked: selected } : undefined}
        accessibilityLabel={selectable ? `Use ${option.value}` : undefined}
        disabled={!selectable || selected}
        onPress={onSelect}
        {...hover.handlers}
        style={[
          styles.cardHead,
          { backgroundColor: selected ? PINE25 : colors.shark50 },
          selectable && !selected && hover.hovered && { backgroundColor: colors.slate100 },
          selectable && !selected && pointer,
          transition(["background-color"]),
        ]}
      >
        <View style={styles.cardHeadLeft}>
          {/* The choice sits on the left for every card: a ring to pick it, a check once it is in use. */}
          {selectable && <Icon name={selected ? "citeCheck" : "citeRadio"} size={24} />}
          <View style={{ gap: 4 }}>
            <Text style={styles.cardLabel}>{selected ? "Current value" : "Alternate value"}</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>{option.value}</Text>
              {selectable && !selected && <Compare diff={diff} />}
            </View>
          </View>
        </View>
      </Pressable>
      <View style={styles.cardBody}>
        <Text style={styles.cardLabel}>{`As per ${n} ${n === 1 ? "source" : "sources"}`}</Text>
        <View style={{ gap: 2 }}>
          {option.sources.map((s, i) => (
            <SourceRow key={`${s.n}-${i}`} source={s} index={i} rule={i < n - 1} onOpen={() => onOpenSource(s.n)} />
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * The value typed in by hand (Figma 940:36944). It is a card like the others, so it can be chosen or set aside, and
 * it stays where it is when another is chosen. Edit reopens the modal; the bin takes the value away.
 */
function OverwrittenCard({
  overwrite,
  selected,
  current,
  animate,
  onSelect,
  onEdit,
  onDelete,
}: {
  overwrite: Overwrite;
  selected: boolean;
  current: number;
  animate: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hover = useHover();
  const diff = numeric(overwrite.value) - current;
  return (
    <FadeIn rise={animate ? 8 : 0} duration={animate ? 220 : 0}>
      <View style={[styles.card, { borderColor: selected ? colors.pine700 : colors.slate100 }, transition(["border-color"])]}>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: selected }}
          accessibilityLabel={`Use ${overwrite.value}`}
          disabled={selected}
          onPress={onSelect}
          {...hover.handlers}
          style={[
            styles.cardHead,
            { backgroundColor: selected ? PINE25 : colors.shark50 },
            !selected && hover.hovered && { backgroundColor: colors.slate100 },
            !selected && pointer,
            transition(["background-color"]),
          ]}
        >
          <View style={styles.cardHeadLeft}>
            <Icon name={selected ? "citeCheck" : "citeRadio"} size={24} />
            <View style={{ gap: 4 }}>
              <Text style={styles.cardLabel}>{selected ? "Current value (Overwritten)" : "Overwritten value"}</Text>
              <View style={styles.valueRow}>
                <Text style={styles.value}>{overwrite.value}</Text>
                {!selected && <Compare diff={diff} />}
              </View>
            </View>
          </View>
          <View style={styles.cardActions}>
            <IconAction label="Edit value" icon="citeEdit" onPress={onEdit} />
            <IconAction label="Remove value" icon="citeTrash" onPress={onDelete} />
          </View>
        </Pressable>
        <View style={styles.addedBy}>
          <Text style={styles.cardLabel}>
            {"Added manually by "}
            <Text style={{ fontFamily: fonts.geistMedium, color: colors.slate700 }}>You</Text>
          </Text>
        </View>
      </View>
    </FadeIn>
  );
}

function IconAction({ label, icon, onPress }: { label: string; icon: "citeEdit" | "citeTrash"; onPress: () => void }) {
  const hover = useHover();
  return (
    <WithTooltip text={label} side="bottom">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        {...hover.handlers}
        style={({ pressed }) => [styles.iconAction, hover.hovered && { backgroundColor: colors.slate100 }, transition(["background-color"]), press(pressed)]}
      >
        <Icon name={icon} size={16} />
      </Pressable>
    </WithTooltip>
  );
}

/** "See activity" (Figma 940:37016). A placeholder for now: the activity view is still to be designed. */
function ActivityLink() {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="See activity"
      {...hover.handlers}
      style={({ pressed }) => [styles.activity, hover.hovered && { opacity: 0.75 }, transition(["opacity"]), press(pressed)]}
    >
      <Text style={styles.activityText}>See activity</Text>
    </Pressable>
  );
}

/** Enter a value by hand (Figma 940:36748): a value and, optionally, how it was checked. */
function OverwriteModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Overwrite | null;
  onClose: () => void;
  onSave: (o: Overwrite) => void;
}) {
  const [value, setValue] = useState(initial?.value ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  // It eases in once mounted and eases out before it is taken away, so it never pops.
  const [shown, setShown] = useState(false);
  const ready = value.trim().length > 0;
  const closeHover = useHover();
  const leaving = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => {
      cancelAnimationFrame(id);
      if (leaving.current) clearTimeout(leaving.current);
    };
  }, []);
  const finish = (after: () => void) => {
    if (leaving.current) return;
    setShown(false);
    leaving.current = setTimeout(after, 140);
  };
  const dismiss = () => finish(onClose);
  const save = () => {
    if (ready) finish(() => onSave({ value: value.trim(), note: note.trim() }));
  };
  useEffect(() => {
    if (Platform.OS !== "web") return;
    // Capture, so Esc closes only the modal and not the drawer beneath it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      if (leaving.current) return;
      setShown(false);
      leaving.current = setTimeout(onClose, 140);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  if (Platform.OS !== "web") return null;
  const layer = (
    <View style={[styles.modalLayer as object, { opacity: shown ? 1 : 0 }, transition(["opacity"], shown ? 180 : 140, shown ? undefined : "cubic-bezier(0.45, 0, 0.25, 1)")]}>
      <Pressable accessibilityLabel="Close" onPress={dismiss} style={styles.modalBackdrop as object} />
      <View
        style={[
          styles.modal as object,
          { transform: [{ translateY: shown ? 0 : 8 }, { scale: shown ? 1 : 0.98 }] },
          transition(["transform"], shown ? 220 : 140, shown ? undefined : "cubic-bezier(0.45, 0, 0.25, 1)"),
        ]}
      >
        <View style={styles.modalHead}>
          <View style={{ gap: 2 }}>
            <View style={styles.footTitle}>
              <Icon name="citePencil" size={16} />
              <Text style={styles.footTitleText}>Overwrite value</Text>
            </View>
            <Text style={styles.footHint}>Update the value manually instead</Text>
          </View>
          <WithTooltip text="Close" side="bottom">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={dismiss}
              {...closeHover.handlers}
              style={({ pressed }) => [styles.modalClose, closeHover.hovered && { backgroundColor: colors.slate100 }, transition(["background-color"]), press(pressed)]}
            >
              <Icon name="modalClose" size={18} />
            </Pressable>
          </WithTooltip>
        </View>
        <View style={{ gap: 20 }}>
          <Field label="Enter value" value={value} onChange={setValue} autoFocus onSubmit={save} />
          <Field label="How was this checked (Optional)" value={note} onChange={setNote} multiline />
        </View>
        <View style={styles.modalActions}>
          <ModalButton label="Discard" onPress={dismiss} />
          <ModalButton label="Update the value" onPress={save} primary disabled={!ready} />
        </View>
      </View>
    </View>
  );
  return createPortal(layer, document.body);
}

/** A boxed input whose label sits inside it and lifts to the top once there is something to label. */
function Field({
  label,
  value,
  onChange,
  multiline = false,
  autoFocus = false,
  onSubmit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  autoFocus?: boolean;
  onSubmit?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;
  return (
    <View style={{ height: multiline ? 66 : 42, justifyContent: "flex-end" }}>
      <View style={[styles.field, { height: multiline ? 66 : 42 }, focused && { borderColor: colors.pine700 }]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          autoFocus={autoFocus}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmit}
          accessibilityLabel={label}
          style={[styles.fieldInput, multiline && { lineHeight: 20 }, { outlineStyle: "none" } as object]}
        />
      </View>
      {/* Typing: the label drops onto the border, on a white notch (Figma 890:4248). Idle: it sits inside as the prompt. */}
      <View
        pointerEvents="none"
        style={[
          styles.fieldLabelWrap,
          lifted ? { top: -8, backgroundColor: colors.white } : { top: 13 },
          transition(["top"]),
        ]}
      >
        <Text style={[styles.fieldLabel, lifted ? { fontSize: 11, color: colors.slate500 } : null]}>{label}</Text>
      </View>
    </View>
  );
}

function ModalButton({
  label,
  onPress,
  primary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.modalButton,
        primary
          ? disabled
            ? { backgroundColor: "#f5f5f5", borderColor: "rgba(255,255,255,0.12)" }
            : ({ backgroundImage: "linear-gradient(137deg, #22733e 4.57%, #1c4b2e 102.61%)", borderColor: "rgba(255,255,255,0.12)" } as object)
          : { backgroundColor: colors.white, borderColor: colors.slate300 },
        !primary && hover.hovered && { backgroundColor: colors.slate50 },
        primary && !disabled && hover.hovered && { opacity: 0.92 },
        !disabled && pointer,
        transition(["background-color", "opacity"]),
        press(pressed && !disabled),
      ]}
    >
      <Text style={[styles.modalButtonText, { color: primary ? (disabled ? colors.slate500 : colors.white) : colors.slate700 }]}>{label}</Text>
    </Pressable>
  );
}

/** Where in the file the figure is: a cell for a spreadsheet, a page for a document. */
function placeIn(n: number, index: number): string {
  return /\.xlsx?$/i.test(sourceFor(n).title) ? `Sheet 1 · cell E${index + 4}` : `Page ${((n * 3 + index * 5) % 17) + 2}`;
}

function SourceRow({
  source,
  index,
  rule,
  onOpen,
}: {
  source: CellSource;
  index: number;
  rule: boolean;
  onOpen: () => void;
}) {
  const info = sourceFor(source.n);
  return (
    <>
      <View style={styles.sourceRow}>
        <View style={{ flex: 1, minWidth: 0, gap: 4, justifyContent: "center" }}>
          <Text numberOfLines={1} style={styles.file}>
            {info.title}
          </Text>
          <View style={styles.folder}>
            <Icon name="cardFolder" size={12} />
            <Text style={styles.folderText}>{`${info.kind === "web" ? info.host : "Data Room"} · ${placeIn(source.n, index)}`}</Text>
          </View>
        </View>
        <ExpandButton label={`Open ${info.title} full size`} onPress={onOpen} />
      </View>
      {rule && <View style={styles.rule} />}
    </>
  );
}

function ExpandButton({ label, onPress }: { label: string; onPress: () => void }) {
  const hover = useHover();
  return (
    <WithTooltip text="Expand" side="left">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        {...hover.handlers}
        style={({ pressed }) => [
          styles.expand,
          hover.hovered && { backgroundColor: colors.slate100 },
          transition(["background-color"]),
          press(pressed),
        ]}
      >
        <Icon name="citeExpand" size={16} />
      </Pressable>
    </WithTooltip>
  );
}

/* ------------------------------------------------------------------ footer */

function Footer({ onOpen }: { onOpen: () => void }) {
  const hover = useHover();
  return (
    <View style={styles.footer}>
      <View style={{ gap: 2 }}>
        <View style={styles.footTitle}>
          <Icon name="citePencil" size={16} />
          <Text style={styles.footTitleText}>Overwrite value</Text>
        </View>
        <Text style={styles.footHint}>Update the value manually instead</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add value"
        onPress={onOpen}
        {...hover.handlers}
        style={({ pressed }) => [styles.add, hover.hovered && { opacity: 0.92 }, transition(["opacity"]), press(pressed)]}
      >
        <Icon name="citePlus" size={16} />
        <Text style={styles.addText}>Add value</Text>
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ styles */

const PINE25 = "#f0f5f4";

const TEXT = { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 16, letterSpacing: 0.0825, color: colors.slate600 } as const;

const styles = StyleSheet.create({
  // Covers the assistant: white, 10px radius, the library's soft shadow (Figma 889:4597).
  panel: {
    position: "absolute",
    top: 8,
    bottom: 8,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
    zIndex: 5,
  } as object,
  header: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.pine800,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepButton: { width: 20, height: 20, borderRadius: 4, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.1)", ...pointer },
  closeButton: { width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 4, ...pointer },
  count: { fontFamily: fonts.geistMedium, fontSize: 14, lineHeight: 16, letterSpacing: 0.168, color: colors.white },
  countTotal: { fontFamily: fonts.geistRegular, color: "rgba(255,255,255,0.6)" },
  body: { padding: 16, gap: 16 },
  titleBlock: { gap: 4 },
  name: { fontFamily: fonts.geistMedium, fontSize: 14, lineHeight: 20, letterSpacing: 0.105, color: colors.slate800 },
  metaRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  activity: { borderRadius: 4, ...pointer },
  activityText: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 16, letterSpacing: 0.0825, color: colors.pine800, textDecorationLine: "underline" },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: TEXT,
  dot: { width: 4, height: 4, borderRadius: 21, backgroundColor: colors.pine800 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#ffebec",
  },
  bannerText: { ...TEXT, flex: 1, color: "#d02533" },
  cards: { gap: 12 },
  card: { borderWidth: 1, borderRadius: 12, overflow: "hidden", backgroundColor: colors.white },
  // A white 2px ring inside the card's own border, as the design draws it.
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 2,
    borderColor: colors.white,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardHeadLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardLabel: TEXT,
  valueRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  value: { fontFamily: fonts.geistMedium, fontSize: 14, lineHeight: 20, letterSpacing: 0.105, color: colors.slate800 },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: "#ffebec" },
  chipText: { fontFamily: fonts.geistRegular, fontSize: 10, lineHeight: 16, letterSpacing: 0.05, color: "#d02533" },
  cardBody: { paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderRadius: 6 },
  file: { fontFamily: fonts.geistMedium, fontSize: 11, lineHeight: 18, letterSpacing: 0.0825, color: colors.slate900 },
  folder: { flexDirection: "row", alignItems: "flex-start", gap: 2, paddingLeft: 4 },
  folderText: { fontFamily: fonts.geistRegular, fontSize: 11, lineHeight: 12, letterSpacing: 0.055, color: colors.pine700 },
  expand: { width: 28, height: 28, padding: 4, borderRadius: 8, alignItems: "center", justifyContent: "center", ...pointer },
  rule: { height: 1, backgroundColor: "rgba(225,228,234,0.5)" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderWidth: 1,
    borderColor: colors.white,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundImage: "linear-gradient(90deg, #f0f5f4 0%, #ffffff 100%)",
    boxShadow: "0px -1px 6px rgba(0,0,0,0.1)",
  } as object,
  footTitle: { flexDirection: "row", alignItems: "center", gap: 4 },
  footTitleText: { fontFamily: fonts.geistMedium, fontSize: 14, lineHeight: 20, letterSpacing: 0.105, color: colors.slate800 },
  footHint: TEXT,
  add: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.pine800,
    backgroundImage: "linear-gradient(124deg, #22733e 4.57%, #1c4b2e 102.61%)",
    ...pointer,
  } as object,
  cardActions: { flexDirection: "row", alignItems: "center", gap: 2 },
  iconAction: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", ...pointer },
  edit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.pine800,
    backgroundColor: colors.white,
    ...pointer,
  },
  editText: { fontFamily: fonts.geistMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.144, color: colors.pine800 },
  addedBy: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  modalLayer: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, alignItems: "center", justifyContent: "center" } as object,
  modalBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)" } as object,
  modal: {
    width: 398,
    maxWidth: "92%",
    padding: 16,
    gap: 12,
    borderRadius: 12,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    backgroundColor: colors.white,
  },
  // The design puts an (invisible) divider between the head and the fields, so 12px twice.
  modalHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  modalClose: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", ...pointer },
  field: { borderWidth: 1, borderColor: colors.slate200, borderRadius: 8, backgroundColor: "rgba(245,247,250,0.5)", overflow: "hidden" },
  fieldLabelWrap: { position: "absolute", left: 16 },
  fieldLabel: { fontFamily: fonts.geistRegular, fontSize: 12, lineHeight: 16, letterSpacing: 0.0825, color: colors.slate400 },
  fieldInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontFamily: fonts.geistMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.09, color: colors.slate800 },
  modalActions: { flexDirection: "row", gap: 12 },
  modalButton: { flex: 1, minWidth: 1, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalButtonText: { fontFamily: fonts.geistMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.144 },
  addText: { fontFamily: fonts.geistMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.144, color: colors.white },
});
