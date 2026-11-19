import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { colors, fonts } from "../theme";
import { pointer } from "../theme/cursor";
import { press, transition } from "../theme/motion";
import { useHover } from "../hooks/useHover";
import { SideNav } from "../components/SideNav";
import { useScreen } from "../state/screen";
import { vdr } from "../assets/vdr";

/**
 * VDR first page (Figma "VDR - Agentic exp": 28:13003 default, 28:14121 typing for the composer). A top bar, the deal
 * scan on the left, summaries on the right and the assistant composer pinned to the bottom. Geist throughout.
 */

type Src = (typeof vdr)[keyof typeof vdr];

/** An exported Figma asset at its exact design size. */
function Img({
  src,
  w,
  h = w,
  style,
}: {
  src: Src;
  w: number;
  h?: number;
  style?: object;
}) {
  return (
    <Image
      source={src}
      contentFit="fill"
      style={[{ width: w, height: h }, style]}
      accessibilityElementsHidden
    />
  );
}

const t = {
  h14: {
    fontFamily: fonts.geistMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.168,
    color: colors.slate800,
  },
  h12: {
    fontFamily: fonts.geistMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.144,
    color: "#171717",
  },
  p11: {
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.0825,
  },
  p10: {
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.05,
  },
} as const;

export function VdrScreen() {
  // The two omni box designs in the Figma file; the switch at the bottom right is a prototype control to compare them.
  const [omni, setOmni] = useState<OmniLayout>("narrow");
  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TopBar />
        <View style={styles.columns}>
          <View style={styles.left}>
            <DealScan />
            <Benchmarking />
            <Stages />
          </View>
          <View style={styles.right}>
            <SummaryCard
              icon={vdr.docs}
              title="Due diligence summary"
            />
            <SummaryCard
              icon={vdr.scanner}
              title="SHA / SPA / SSA summary"
            />
            <ChecklistCard />
          </View>
        </View>
      </ScrollView>
      <Composer layout={omni} />
      <OmniSwitch value={omni} onChange={setOmni} />
      <SideNav />
    </View>
  );
}

/* ------------------------------------------------------------------ top bar */

function TopBar() {
  return (
    <View style={styles.topBar}>
      <View style={styles.row4}>
        <View style={styles.logoWrap}>
          <View style={styles.logoRing} />
          <Image source={vdr.companyLogo} style={styles.logo} />
        </View>
        <View style={styles.row8}>
          <Text style={styles.company}>Juspay Technologies Private limited</Text>
          <View style={styles.stageChip}>
            <Text style={[t.p10, { color: colors.grey700 }]}>Stage 2</Text>
          </View>
        </View>
      </View>
      <View style={styles.topRight}>
        <View style={styles.avatars}>
          <Image source={vdr.avatar1} style={styles.avatar} />
          <Image source={vdr.avatar2} style={[styles.avatar, styles.avatarOverlap]} />
          <Image source={vdr.avatar3} style={[styles.avatar, styles.avatarOverlap]} />
        </View>
        <View style={styles.vDivider} />
        <DataRoomButton />
        <View style={styles.vDivider} />
        <View style={styles.row8}>
          <IconButton src={vdr.topbarShare} label="Share" />
          <IconButton src={vdr.topbarMore} label="More" />
        </View>
      </View>
    </View>
  );
}

function IconButton({ src, label }: { src: Src; label: string }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...hover.handlers}
      style={({ pressed }) => [
        { borderRadius: 8, ...pointer },
        hover.hovered && { backgroundColor: colors.slate100 },
        press(pressed),
      ]}
    >
      <Img src={src} w={28} />
    </Pressable>
  );
}

function DataRoomButton() {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Data Room"
      {...hover.handlers}
      style={({ pressed }) => [
        styles.dataRoom,
        hover.hovered && { backgroundColor: colors.dew100 },
        press(pressed),
      ]}
    >
      <Img src={vdr.dataRoom} w={16} />
      <Text style={styles.dataRoomText}>Data Room</Text>
    </Pressable>
  );
}

/* --------------------------------------------------------------- deal scan */

function Metric({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{value}</Text>
        {unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}
        {note ? <Text style={styles.metricUnit}> {note}</Text> : null}
      </Text>
    </View>
  );
}

function MetricRow({ items }: { items: Parameters<typeof Metric>[0][] }) {
  return (
    <View style={styles.metricRow}>
      {items.map((m, i) => (
        <View key={m.label} style={styles.metricSlot}>
          {i > 0 && <MetricDivider alt={i === 3} />}
          <Metric {...m} />
        </View>
      ))}
      {/* Rows with fewer than four metrics keep the grid: empty slots hold the column widths. */}
      {Array.from({ length: 4 - items.length }).map((_, i) => (
        <View key={`pad${i}`} style={styles.metricSlot} />
      ))}
    </View>
  );
}

/** 24px vertical rule between metrics (Figma exports it as a 24px line rotated 90°). */
function MetricDivider({ alt }: { alt?: boolean }) {
  return (
    <View style={styles.metricDivider}>
      <Image
        source={alt ? vdr.metricDividerB : vdr.metricDivider}
        contentFit="fill"
        style={{ width: 24, height: 1, transform: [{ rotate: "90deg" }] }}
      />
    </View>
  );
}

function SectionHeader({
  title,
  edit = true,
}: {
  title: string;
  edit?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={t.h14}>{title}</Text>
      <View style={styles.row12}>
        <GhostIcon src={vdr.refresh} label={`Refresh ${title}`} />
        {edit && <GhostIcon src={vdr.edit} label={`Edit ${title}`} />}
      </View>
    </View>
  );
}

function GhostIcon({ src, label }: { src: Src; label: string }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...hover.handlers}
      style={({ pressed }) => [
        { borderRadius: 4, ...pointer, opacity: hover.hovered ? 0.7 : 1 },
        press(pressed),
        transition(["opacity", "transform"]),
      ]}
    >
      <Img src={src} w={20} />
    </Pressable>
  );
}

const TABS = ["Financials", "Market and context", "Key risks", "Caveats"];

function DealScan() {
  const [tab, setTab] = useState(0);
  return (
    <View style={styles.scanCard}>
      <Image source={vdr.scanHeaderBg} contentFit="fill" style={styles.scanBg} />
      <Img src={vdr.scanBanner} w={377} h={89} style={styles.scanBanner} />

      <View style={styles.scanHeader}>
        <View style={{ gap: 4 }}>
          <View style={styles.row8}>
            <Text style={t.h14}>First cut IC memo</Text>
            <View style={styles.vettedChip}>
              <Img src={vdr.selectAll} w={12} />
              <Text style={[t.p10, { color: colors.white }]}>0/12 vetted</Text>
            </View>
          </View>
          <Text style={[t.p10, { color: colors.slate600 }]}>
            Last updated 2 Jul, 2:33 PM
          </Text>
        </View>
        <ScanButton />
      </View>

      <View style={styles.summaryBox}>
        <Img src={vdr.sparkleAi} w={20} />
        <Text style={[t.p11, { flex: 1, color: colors.slate900 }]}>
          Juspay Technologies provides enterprise payment orchestration and UPI
          software, reporting FY25 revenue of ₹539 Cr, with no transaction ask
          specified in the reviewed note.
        </Text>
      </View>

      <View style={styles.block}>
        <SectionHeader title="Deal terms" />
        <View style={styles.metricPanel}>
          <MetricRow
            items={[
              { label: "Implied enterprise value", value: "₹2,292.5", unit: "Cr" },
              { label: "Equity value (pr money)", value: "₹2,050 - ₹2,100", unit: "Cr" },
              { label: "Round size", value: "₹242.2", unit: "Cr" },
              { label: "Entry EV/Revenue", value: "1.95", unit: "x" },
            ]}
          />
          <MetricRow
            items={[
              { label: "Primary vs Secondary", value: "100", unit: "%", note: "(primary)" },
              { label: "Entry EV/EBITDA", value: "7.4", unit: "x", note: "(assumed)" },
              { label: "Stake sold", value: "10.7", unit: "%" },
              { label: "Investor ownership (post)", value: "10.7", unit: "%" },
            ]}
          />
        </View>
      </View>

      <Image source={vdr.sectionDivider} contentFit="fill" style={styles.hairline} />

      <View style={styles.block}>
        <SectionHeader title="Deal brief" />
        <View style={{ gap: 12 }}>
          <View style={styles.row8}>
            {TABS.map((label, i) => (
              <BriefTab
                key={label}
                label={label}
                active={i === tab}
                onPress={() => setTab(i)}
              />
            ))}
          </View>
          <View style={styles.metricPanel}>
            <MetricRow
              items={[
                { label: "Revenue (FY25)", value: "₹593", unit: "Cr" },
                { label: "Revenue growth (YoY)", value: "14.56", unit: "%" },
                { label: "EBITDA margin", value: "25.4", unit: "%" },
                { label: "EBITDA", value: "157", unit: "Cr" },
              ]}
            />
            <MetricRow
              items={[
                { label: "Gross margin", value: "14.56", unit: "%" },
                { label: "Take rate", value: "4 - 4.5", unit: "bps" },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <View style={styles.metaRow}>
          <Img src={vdr.info} w={12} />
          <Text style={[t.p10, { color: colors.slate800 }]}>
            <Text style={{ fontFamily: fonts.geistSemiBold }}>Sources:</Text>{" "}
            Investment memo / IM, IC note / internal memo, Structured company
            data, Web / Public sources
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Img src={vdr.notes} w={12} />
          <Text style={[t.p10, { color: colors.slate800 }]}>
            <Text style={{ fontFamily: fonts.geistSemiBold }}>Note coverage:</Text>{" "}
            DD findings note
          </Text>
        </View>
      </View>

      <Image source={vdr.sectionDivider} contentFit="fill" style={styles.hairline} />

      <View style={styles.block}>
        <View style={styles.sectionHeader}>
          <Text style={t.h14}>Deal signals</Text>
          <GhostIcon src={vdr.refresh} label="Refresh Deal signals" />
        </View>
        <SignalsTable />
      </View>
    </View>
  );
}

function ScanButton() {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="View full scan"
      {...hover.handlers}
      style={({ pressed }) => [
        styles.scanButton,
        hover.hovered && { backgroundColor: colors.pine100 },
        press(pressed),
      ]}
    >
      <Text style={[t.h12, { color: colors.pine800 }]}>View full scan</Text>
      <Img
        src={vdr.arrowRight12}
        w={12}
        style={{ transform: [{ rotate: "180deg" }] }}
      />
    </Pressable>
  );
}

function BriefTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.tab,
        active
          ? styles.tabActive
          : hover.hovered && { backgroundColor: colors.slate200 },
        press(pressed),
      ]}
    >
      {active && <View style={styles.tabDot} />}
      <Text
        style={{
          fontFamily: active ? fonts.geistMedium : fonts.geistRegular,
          fontSize: 11,
          lineHeight: 16,
          letterSpacing: 0.055,
          color: active ? colors.pine800 : colors.slate500,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const SIGNALS: [string, string, string, string][][] = [
  [
    [
      "Leading:",
      "Fully integrated, multi-service platform (Consults, Labs, Meds, Surgery). Strong AI/data analytics (CLARA). Dedicated portals for all stakeholders.",
      "Competitive:",
      "Also offers an integrated platform, but often with less product depth, fewer service lines, and less mature data analytics capabilities.",
    ],
    [
      "Leading:",
      "Highly diversified B2B2C model with 400+ corporates, 78% of insurers, and 14 major NBFCs. Proven ability to win and service large, pan-India enterprise accounts.",
      "Developing:",
      "Primarily focused on the corporate segment, but with a smaller client base and fewer deep-seated partnerships with major insurers and TPAs.",
    ],
    [
      "Leading:",
      "Unmatched scale with 103,000+ doctors and 15,000+ OP centers, enabling a true pan-India cashless network. Operates as a neutral aggregator.",
      "Lagging:",
      "Significantly smaller and more geographically concentrated provider network. May struggle to service employees of large clients in Tier 2/3 cities.",
    ],
  ],
  [
    [
      "Flexible:",
      "Blended model of recurring PaaS fees and transactional take rates, aligning revenue with utilization and value creation.",
      "Standard:",
      "Primarily relies on PEPM (per-employee-per-month) SaaS fees. This model is simpler but may have less upside from increased platform usage.",
    ],
  ],
];

function Cell({ lead, text }: { lead: string; text: string }) {
  return (
    <View style={styles.cell}>
      <Text style={[t.p10, { color: colors.slate800 }]}>
        <Text style={{ fontFamily: fonts.geistSemiBold }}>{lead}</Text> {text}
      </Text>
    </View>
  );
}

function SignalsTable() {
  return (
    <View style={{ gap: 16 }}>
      <View style={styles.table}>
        <View style={styles.tableHead}>
          {["What looks promising", "Areas for consideration"].map((h) => (
            <View key={h} style={styles.headCell}>
              <Text
                style={[
                  t.p11,
                  { fontFamily: fonts.geistSemiBold, color: colors.slate900 },
                ]}
              >
                {h}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ gap: 2 }}>
          {SIGNALS[0].map(([l1, a, l2, b]) => (
            <View key={l1 + a} style={styles.tableRow}>
              <Cell lead={l1} text={a} />
              <Cell lead={l2} text={b} />
            </View>
          ))}
          <Image source={vdr.tableRowLine} contentFit="fill" style={styles.hairline} />
          {SIGNALS[1].map(([l1, a, l2, b]) => (
            <View key={l1 + a} style={styles.tableRow}>
              <Cell lead={l1} text={a} />
              <Cell lead={l2} text={b} />
            </View>
          ))}
        </View>
      </View>
      <View style={{ paddingLeft: 15 }}>
        {[
          "Our highly diversified B2B2C model includes partnerships with over 400 corporate clients, 78% of the insurance providers in the market, and 14 leading non-banking financial companies (NBFCs).",
          "We have a proven track record of successfully acquiring and servicing large enterprise accounts across India, demonstrating our capability to manage complex, pan-India business relationships effectively.",
        ].map((line) => (
          <View key={line} style={styles.bullet}>
            <Text style={[t.p10, { color: colors.slate800, marginLeft: -11 }]}>
              •
            </Text>
            <Text style={[t.p10, { color: colors.slate800, flex: 1, marginLeft: 7 }]}>
              {line}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------ benchmarking */

function Benchmarking() {
  return (
    <View style={styles.benchCard}>
      <View style={styles.benchHeader}>
        <Img src={vdr.benchmarking} w={20} />
        <Text style={t.h14}>Benchmarking</Text>
      </View>
      <View style={{ gap: 12 }}>
        <CompetitorBar />
        <View style={styles.row12}>
          <BenchTile
            chip="Neutral"
            chipTone="neutral"
            title="Financial comparables"
            body={[
              ["Revenue ", false],
              ["CAGR 9.6%", true],
              [" vs sector ", false],
              ["~23%", true],
              [", EBITDA margin ", false],
              ["12.8%", true],
              [" vs median ", false],
              ["~12%", true],
              [", in line but lags growth.", false],
            ]}
          />
          <BenchTile
            chip="Below peers"
            chipTone="bad"
            title="Trading comparables"
            body={[
              ["Currently trades at ", false],
              ["~15x EBITDA", true],
              [" vs ", false],
              ["peer ~12x", true],
              [", indicating value despite profitability gaps.", false],
            ]}
          />
          <BenchTile
            chip="Above peers"
            chipTone="good"
            title="Transaction comparables"
            body={[
              ["Precedent deals at ", false],
              ["~15-16x EBITDA", true],
              [" vs company’s ", false],
              ["~12x", true],
              [", implying upside if growth margins improve.", false],
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function CompetitorBar() {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="View competitor list"
      {...hover.handlers}
      style={({ pressed }) => [styles.competitor, press(pressed)]}
    >
      <Image source={vdr.benchmarkBg} contentFit="fill" style={StyleSheet.absoluteFill} />
      <Img src={vdr.benchmarkArt} w={100} h={102} style={styles.competitorArt} />
      <Img src={vdr.comparables} w={20} />
      <View style={[styles.row4, { flex: 1 }]}>
        <Text style={[t.p11, { fontFamily: fonts.geistSemiBold, fontSize: 12, color: colors.white }]}>
          Competitor list
        </Text>
        <Text style={[t.p10, { flex: 1, color: colors.white }]} numberOfLines={1}>
          (Razorpay, Stripe, Bill desk, +120 more)
        </Text>
      </View>
      <View style={[styles.row0, { opacity: hover.hovered ? 0.85 : 1 }]}>
        <Text style={[t.p11, { fontFamily: fonts.geistMedium, color: colors.white }]}>
          View
        </Text>
        <Img src={vdr.chevronRight18} w={18} />
      </View>
    </Pressable>
  );
}

const TONES = {
  neutral: { bg: colors.neutralChipBg, fg: colors.neutralChipText },
  good: { bg: colors.dew100, fg: colors.pine800 },
  bad: { bg: "#ffebec", fg: "#d02533" },
} as const;

function BenchTile({
  chip,
  chipTone,
  title,
  body,
}: {
  chip: string;
  chipTone: keyof typeof TONES;
  title: string;
  body: [string, boolean][];
}) {
  const hover = useHover();
  const tone = TONES[chipTone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.benchTile,
        hover.hovered && { backgroundColor: colors.slate100 },
        press(pressed),
      ]}
    >
      <View style={styles.benchTop}>
        <View style={{ gap: 8 }}>
          <View style={[styles.chip, { backgroundColor: tone.bg }]}>
            <Text style={[t.p10, { color: tone.fg }]}>{chip}</Text>
          </View>
          <Text style={[t.p11, { fontFamily: fonts.geistSemiBold, fontSize: 12, color: colors.slate700 }]}>
            {title}
          </Text>
        </View>
        <Img src={vdr.chevronRight20} w={20} />
      </View>
      <Text style={[t.p11, { color: colors.slate600 }]}>
        {body.map(([text, strong], i) => (
          <Text
            key={i}
            style={
              strong
                ? { fontFamily: fonts.geistMedium, color: colors.slate800 }
                : undefined
            }
          >
            {text}
          </Text>
        ))}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ stages */

function Stage({
  label,
  rows,
}: {
  label: string;
  rows: { icon: "link" | "checklist"; title: string; updated: string }[];
}) {
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.row8}>
        <Text style={[t.h12, { color: colors.pine900 }]}>{label}</Text>
        <Img src={vdr.stageLine} w={723} h={1} style={{ flex: 1, minWidth: 0 }} />
        <View style={styles.collapse}>
          <Img src={vdr.chevronUp} w={20} />
        </View>
      </View>
      <View style={{ gap: 12 }}>
        {rows.map((r) => (
          <StageRow key={r.title} {...r} />
        ))}
      </View>
    </View>
  );
}

function StageRow({
  icon,
  title,
  updated,
}: {
  icon: "link" | "checklist";
  title: string;
  updated: string;
}) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      {...hover.handlers}
      style={({ pressed }) => [
        styles.stageRow,
        hover.hovered && styles.stageRowHover,
        press(pressed),
      ]}
    >
      <View style={styles.row8}>
        <View style={styles.stageIcon}>
          {icon === "link" ? (
            <Img
              src={vdr.linkIcon}
              w={10.5}
              style={{ transform: [{ rotate: "-90deg" }] }}
            />
          ) : (
            <Img src={vdr.checklist} w={14} />
          )}
        </View>
        <Text style={t.h12}>{title}</Text>
      </View>
      <Text style={[t.p11, { color: colors.slate500 }]}>{updated}</Text>
    </Pressable>
  );
}

function Stages() {
  return (
    <View style={{ gap: 16 }}>
      <Stage
        label="STAGE 3"
        rows={[
          { icon: "link", title: "First cut IC memo", updated: "Last updated 20 Aug, 2:12 PM" },
          { icon: "checklist", title: "Stage 3 checklist", updated: "Last updated 8 Aug, 12:02 PM" },
        ]}
      />
      <Stage
        label="STAGE 2"
        rows={[
          { icon: "link", title: "Initial deal scan", updated: "Last updated 12 Jul, 11:44 PM" },
          { icon: "checklist", title: "Stage 2 checklist", updated: "Last updated 12 Jul, 4:56 PM" },
        ]}
      />
      <Stage
        label="STAGE 1"
        rows={[
          { icon: "link", title: "Prospect scan document", updated: "Last updated 2 Jul, 2:33 PM" },
        ]}
      />
    </View>
  );
}

/* ------------------------------------------------------------ right column */

const BULLETS = [
  "Overview: Strong product-market fit with promising growth, but faces concentration risks.",
  "Key risks: 99% revenue from top clients, threat of in-housing, contract churn, and regulatory challenges.",
];

function SummaryCard({ icon, title }: { icon: Src; title: string }) {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      {...hover.handlers}
      style={({ pressed }) => [styles.sideCard, press(pressed)]}
    >
      <View style={styles.sideCardBg} />
      <View style={styles.sideHeader}>
        <View style={styles.row8}>
          <Img src={icon} w={20} />
          <Text style={t.h14}>{title}</Text>
        </View>
        <View style={[styles.sideChevron, hover.hovered && { backgroundColor: colors.slate100 }]}>
          <Img src={vdr.chevronRightCard} w={20} />
        </View>
      </View>
      <View style={styles.bulletBox}>
        {BULLETS.map((b) => (
          <View key={b} style={styles.sideBullet}>
            <Text style={[t.p11, { color: colors.slate700 }]}>•</Text>
            <Text style={[t.p11, { color: colors.slate700, flex: 1 }]}>{b}</Text>
          </View>
        ))}
      </View>
      <Text style={[t.p10, { color: colors.slate600 }]}>
        Last updated:{" "}
        <Text style={{ color: colors.pine800 }}>23 July ‘25, 12:56 PM</Text>
      </Text>
    </Pressable>
  );
}

function ChecklistCard() {
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Evaluation checklist"
      {...hover.handlers}
      style={({ pressed }) => [styles.checkCard, press(pressed)]}
    >
      <View style={[styles.row12, { alignItems: "center" }]}>
        <Img src={vdr.checklist} w={14} style={{ width: 20, height: 20 }} />
        <View style={styles.row8}>
          <Text style={t.h14}>Evaluation checklist</Text>
          <View style={[styles.chip, { backgroundColor: colors.dew100 }]}>
            <Text style={[t.p10, { color: colors.pine800 }]}>7/7 vetted</Text>
          </View>
        </View>
      </View>
      <View style={[styles.sideChevron, hover.hovered && { backgroundColor: colors.slate100 }]}>
        <Img src={vdr.chevronRightCard} w={20} />
      </View>
    </Pressable>
  );
}

/* ---------------------------------------------------------------- composer */

/**
 * The assistant composer (default 28:13447, typing 28:14565). Typing state: the border turns pine with a soft ring,
 * the text sets in slate-700 at 11px, the field grows with its lines and the send button turns green.
 */
type OmniLayout = "narrow" | "large";

/** How much the omni box grows when focused. */
const FOCUS_SCALE = 1.1;

function Composer({ layout }: { layout: OmniLayout }) {
  const { openAssistant } = useScreen();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  // One line tall until the text wraps; then it grows with the content (design: 18px per line, up to 5 lines).
  const [height, setHeight] = useState(18);
  const typing = value.length > 0;
  const lit = typing || focused;

  // Clicking into the box grows it a touch (about 1.5%, a few pixels each side) from its bottom edge, eased so it settles
  // rather than snaps; it holds while there is focus or text, and lets go a beat after the last of those (so a click on
  // + or send, which blurs the field first, lands before the box starts shrinking under the pointer).
  const grownScale = FOCUS_SCALE;
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    if (focused || typing) {
      setGrown(true);
      return;
    }
    const id = setTimeout(() => setGrown(false), 180);
    return () => clearTimeout(id);
  }, [focused, typing]);
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    Animated.timing(scale, {
      toValue: grown ? grownScale : 1,
      duration: 280,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: false,
    }).start();
  }, [grown, grownScale, scale]);
  /** Sending opens the full assistant view with the question (Enter sends, Shift+Enter breaks the line). */
  const send = () => {
    const q = value.trim();
    if (!q) return;
    setValue("");
    setHeight(18);
    openAssistant(q);
  };
  const tools = (
    <View style={styles.row8}>
      <SquareButton src={vdr.plus} label="Add" w={16} />
      <SquareButton src={vdr.attach} label="Attach" w={16} />
    </View>
  );
  const sendButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Send"
      disabled={!typing}
      onPress={send}
      style={({ pressed }) => [{ ...pointer }, press(pressed && typing)]}
    >
      <Img src={typing ? vdr.sendTyping : vdr.send} w={28} />
    </Pressable>
  );
  return (
    <View pointerEvents="box-none" style={styles.composerDock}>
      <Image
        source={typing ? vdr.composerFadeTyping : vdr.composerFade}
        contentFit="fill"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.composer,
          layout === "large" && styles.composerLarge,
          lit ? styles.composerLit : styles.composerIdle,
          { transform: [{ scale }], transformOrigin: "50% 100%" },
        ]}
      >
        <View style={layout === "large" ? styles.composerCol : styles.composerRow}>
          {layout === "narrow" && tools}
          <TextInput
            value={value}
            onChangeText={setValue}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyPress={(e) => {
              const ev = e.nativeEvent as unknown as { key: string; shiftKey?: boolean };
              if (ev.key === "Enter" && !ev.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask anything about this deal..."
            placeholderTextColor={colors.slate600}
            multiline
            numberOfLines={1}
            rows={1}
            onContentSizeChange={(e) =>
              setHeight(Math.min(90, Math.max(18, e.nativeEvent.contentSize.height)))
            }
            accessibilityLabel="Ask anything about this deal"
            style={[
              styles.input,
              typing ? styles.inputTyping : styles.inputIdle,
              { height: typing ? height : 18 },
            ]}
          />
          {layout === "narrow" ? (
            sendButton
          ) : (
            <View style={styles.composerFoot}>
              {tools}
              {sendButton}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * Prototype control: a small two-option switch that flips the omni box between its two Figma designs, the narrow one
 * (one row, 52px) and the large one (input above, tools below, 86px).
 */
function OmniSwitch({ value, onChange }: { value: OmniLayout; onChange: (v: OmniLayout) => void }) {
  const options: { id: OmniLayout; label: string }[] = [
    { id: "narrow", label: "Narrow" },
    { id: "large", label: "Large" },
  ];
  return (
    <View style={styles.omniSwitch}>
      <View style={styles.omniSwitchTrack}>
        {options.map((o) => {
          const on = o.id === value;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => onChange(o.id)}
              style={[styles.omniSwitchOption, on && styles.omniSwitchOn, transition(["background-color"])]}
            >
              <Text style={[styles.omniSwitchText, { color: on ? colors.white : colors.slate700 }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SquareButton({ src, label, w }: { src: Src; label: string; w: number }) {
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
      <Img src={src} w={w} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ styles */

const SHADOW = "1px 4px 5px rgba(222,222,222,0.25)";

const styles = StyleSheet.create({
  // 56px clears the side nav; 8px gap above the top bar and 8px inset on the right (Figma: nav 8 → 60 / 1212 wide).
  root: {
    flex: 1,
    backgroundColor: colors.slate50,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 8,
    paddingLeft: 56,
    paddingRight: 8,
    paddingBottom: 144,
    gap: 12,
  },
  columns: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  left: { flex: 1, minWidth: 0, gap: 24 },
  right: { width: 398, gap: 16 },
  row0: { flexDirection: "row", alignItems: "center" },
  row4: { flexDirection: "row", alignItems: "center", gap: 4 },
  row8: { flexDirection: "row", alignItems: "center", gap: 8 },
  row12: { flexDirection: "row", alignItems: "center", gap: 12 },

  topBar: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  logoWrap: { width: 24, height: 24, borderRadius: 100, backgroundColor: colors.white },
  logoRing: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 62.5,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  logo: { position: "absolute", left: 4, top: 4, width: 16, height: 16, borderRadius: 76 },
  company: {
    fontFamily: fonts.geistMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.44,
    textTransform: "uppercase",
    color: colors.slate600,
  },
  stageChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 40,
    backgroundColor: "#f0eeee",
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatars: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarOverlap: { marginLeft: -12 },
  vDivider: { width: 1, height: 16, borderRadius: 100, backgroundColor: colors.slate200 },
  dataRoom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#eef6ec",
    ...pointer,
    ...transition(["background-color"]),
  },
  dataRoomText: {
    fontFamily: fonts.geistMedium,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: colors.pine800,
  },

  scanCard: {
    padding: 16,
    gap: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
    overflow: "hidden",
    boxShadow: SHADOW,
  },
  // Stretches with the card: 1px in from each edge, 104px tall (the export is 804px wide at the design width).
  hairline: { alignSelf: "stretch", height: 1 },
  scanBg: { position: "absolute", left: 1, right: 1, top: 1, height: 104 },
  scanBanner: { position: "absolute", right: 0, top: 0, transform: [{ rotate: "180deg" }] },
  scanHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  vettedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 1,
    borderRadius: 40,
    backgroundColor: colors.pine800,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.pine800,
    backgroundColor: colors.white,
    ...pointer,
  },
  summaryBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    boxShadow: "2px 2px 8px rgba(0,0,0,0.04)",
  },
  block: { gap: 8 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricPanel: {
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.slate50,
  },
  metricRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  metricSlot: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 16 },
  metricDivider: { width: 0, height: 24, alignItems: "center", justifyContent: "center", marginLeft: -16 },
  metric: { flex: 1, minWidth: 0, gap: 4 },
  metricLabel: {
    fontFamily: fonts.geistRegular,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.05,
    color: colors.slate600,
  },
  metricValueRow: { fontFamily: fonts.geistRegular, lineHeight: 20 },
  metricValue: {
    fontFamily: fonts.geistSemiBold,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.156,
    color: colors.pine900,
    fontVariant: ["tabular-nums"],
  },
  metricUnit: {
    fontFamily: fonts.geistRegular,
    fontSize: 11,
    lineHeight: 20,
    letterSpacing: 0.156,
    color: colors.slate500,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.slate100,
    ...pointer,
  },
  tabActive: { backgroundColor: colors.dew100 },
  tabDot: { width: 4, height: 4, borderRadius: 100, backgroundColor: colors.pine900 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },

  table: { gap: 4, borderRadius: 8, backgroundColor: colors.white },
  tableHead: { flexDirection: "row", gap: 2, borderRadius: 8, overflow: "hidden" },
  headCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f0eeee",
  },
  tableRow: { flexDirection: "row", gap: 2, borderRadius: 4, overflow: "hidden" },
  cell: { flex: 1, padding: 8, backgroundColor: "rgba(245,247,250,0.5)" },
  bullet: { flexDirection: "row" },

  benchCard: {
    gap: 4,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
    boxShadow: SHADOW,
  },
  benchHeader: { flexDirection: "row", alignItems: "center", gap: 6, padding: 12, paddingBottom: 12 },
  competitor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 4,
    overflow: "hidden",
    ...pointer,
  },
  competitorArt: { position: "absolute", right: 0, top: -26 },
  benchTile: {
    flex: 1,
    minWidth: 0,
    gap: 8,
    height: 128,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: "rgba(245,247,250,0.6)",
    ...pointer,
    ...transition(["background-color"]),
  },
  benchTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 40,
  },

  collapse: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.white,
    boxShadow: "0px 1px 2px rgba(10,13,20,0.03)",
    ...pointer,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    backgroundColor: colors.white,
    boxShadow: SHADOW,
    ...pointer,
    ...transition(["background-color"]),
  },
  stageRowHover: { backgroundColor: colors.slate50 },
  stageIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.slate50,
    alignItems: "center",
    justifyContent: "center",
  },

  sideCard: {
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
    overflow: "hidden",
    boxShadow: SHADOW,
    ...pointer,
  },
  sideCardBg: {
    position: "absolute",
    left: 1,
    top: 1,
    width: 396,
    height: 80,
    borderRadius: 8,
    opacity: 0.3,
    backgroundImage: `linear-gradient(0deg, rgba(245,247,250,0.5), rgba(202,207,216,0.5))`,
  } as object,
  sideHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sideChevron: { padding: 2, borderRadius: 4, ...transition(["background-color"]) },
  bulletBox: {
    gap: 8,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.dew100,
    backgroundColor: colors.white,
  },
  sideBullet: { flexDirection: "row", gap: 6 },
  checkCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    boxShadow: "1px 4px 2.5px rgba(222,222,222,0.25)",
    ...pointer,
  },

  // Composer: a 100px dock across the bottom with the white fade behind a 602px pill.
  composerDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 24,
    zIndex: 20,
  },
  composer: {
    width: "100%",
    maxWidth: 602,
    // Figma's 1px border sits inside its 16/12 padding, so take it out of ours to keep the 52px height.
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
    ...transition(["border-color", "box-shadow"], 160),
  },
  composerIdle: {
    borderColor: "#7dbe94",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.02)",
    backdropFilter: "blur(1px)",
  } as object,
  composerLit: {
    borderColor: colors.pine700,
    boxShadow: "0px 0px 0px 3px rgba(34,115,62,0.15), 0px 2px 8px rgba(0,0,0,0.02)",
    backdropFilter: "blur(2px)",
  } as object,
  composerRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  // The large design (Figma 101:2517): the field on top, then the tools and send button on a row underneath, 86px in all.
  composerLarge: { paddingHorizontal: 15, paddingVertical: 11 },
  composerCol: { gap: 16 },
  composerFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  omniSwitch: {
    position: "absolute",
    right: 16,
    bottom: 16,
    zIndex: 30,
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    boxShadow: "0px 2px 8px rgba(0,0,0,0.04)",
  } as object,
  omniSwitchTrack: { flexDirection: "row", gap: 2 },
  omniSwitchOption: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100, ...pointer },
  omniSwitchOn: { backgroundColor: colors.pine700 },
  omniSwitchText: { fontFamily: fonts.geistMedium, fontSize: 10, lineHeight: 16 },
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
    resize: "none",
    fontFamily: fonts.geistRegular,
    outlineStyle: "none",
  } as object,
  inputIdle: { fontSize: 12, lineHeight: 18, letterSpacing: 0.09, color: colors.slate600 },
  inputTyping: { fontSize: 11, lineHeight: 18, color: colors.slate700 },
});
