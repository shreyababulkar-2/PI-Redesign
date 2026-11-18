import Svg, { Path } from "react-native-svg";

/** Icons for the citation drawer, drawn from Figma 602:4423. Each takes a colour; sizes are the design's. */
type P = { color?: string; size?: number };

export function ChevronLeft({ color = "#fff", size = 16 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M9.99976 12L5.99976 8L9.99976 4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronRight({ color = "#fff", size = 16 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M5.99976 12L9.99976 8L5.99976 4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Close({ color = "#fff", size = 18 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M4.5 13.5L13.5 4.5M4.5 4.5L13.5 13.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Globe({ color = "#717784", size = 16 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M13.317 8.41241C13.3912 7.46792 13.2128 6.5207 12.8002 5.66841C12.1172 6.31911 11.3099 6.82435 10.427 7.15367C10.4979 8.02757 10.4586 8.90695 10.3099 9.77097C11.3844 9.49961 12.4025 9.03966 13.317 8.41241ZM9.4408 9.94703C9.61549 9.10952 9.67658 8.25219 9.62239 7.39829C9.10169 7.52279 8.55857 7.58861 8.00014 7.58861C7.4417 7.58861 6.89858 7.52279 6.37789 7.39829C6.32497 8.25219 6.38604 9.10935 6.55947 9.94703C7.51434 10.0938 8.48594 10.0938 9.4408 9.94703ZM6.78154 10.8076C7.59111 10.9036 8.40916 10.9036 9.21874 10.8076C8.9405 11.7057 8.52975 12.5571 8.00014 13.3333C7.47052 12.5571 7.05976 11.7058 6.78154 10.8076ZM5.69037 9.77152C5.54086 8.90722 5.50153 8.02737 5.57333 7.15312C4.69016 6.82389 3.88266 6.31864 3.19957 5.66786C2.78707 6.52037 2.60883 7.46779 2.68325 8.41241C3.59782 9.03966 4.6159 9.50016 5.69037 9.77152ZM13.1174 9.50935C12.8412 10.4478 12.314 11.2924 11.593 11.9515C10.8719 12.6107 9.9846 13.0591 9.02731 13.2483C9.50672 12.44 9.87262 11.5692 10.1146 10.6606C11.17 10.4388 12.1835 10.0504 13.1174 9.5099V9.50935ZM2.88288 9.50935C3.80285 10.0419 4.81361 10.4352 5.88563 10.6606C6.12766 11.5692 6.49356 12.44 6.97297 13.2483C6.01575 13.0592 5.12846 12.6108 4.40742 11.9517C3.68637 11.2927 3.15912 10.4482 2.88288 9.5099V9.50935ZM9.02731 2.75109C10.3825 3.0182 11.5816 3.80187 12.3724 4.9373C11.7887 5.52876 11.0918 5.99589 10.3236 6.31067C10.1166 5.05347 9.67695 3.84619 9.02731 2.75109ZM8.00014 2.66663C8.79836 3.83602 9.32282 5.17114 9.53433 6.57229C9.04372 6.69844 8.52959 6.7659 8.00014 6.7659C7.47069 6.7659 6.95656 6.69899 6.46595 6.57229C6.67744 5.17114 7.2019 3.83601 8.00014 2.66663ZM6.97297 2.75109C6.32332 3.84618 5.88367 5.05347 5.6767 6.31067C4.90849 5.9959 4.21159 5.52877 3.62783 4.9373C4.41874 3.80203 5.61784 3.01801 6.97297 2.75109Z"
        fill={color}
      />
    </Svg>
  );
}

export function Folder({ color = "#717784", size = 16 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M12.4445 13.3333C12.916 13.3333 13.3682 13.146 13.7016 12.8126C14.035 12.4792 14.2223 12.027 14.2223 11.5555V8.88885C14.2223 8.41735 14.035 7.96517 13.7016 7.63177C13.3682 7.29837 12.916 7.11107 12.4445 7.11107H3.55561C3.08411 7.11107 2.63193 7.29837 2.29853 7.63177C1.96513 7.96517 1.77783 8.41735 1.77783 8.88885V11.5555C1.77783 12.027 1.96513 12.4792 2.29853 12.8126C2.63193 13.146 3.08411 13.3333 3.55561 13.3333H12.4445ZM1.77783 6.90129V4.4444C1.77783 3.97291 1.96513 3.52072 2.29853 3.18733C2.63193 2.85393 3.08411 2.66663 3.55561 2.66663H6.74316C7.09658 2.66678 7.43548 2.80724 7.68539 3.05714L8.94287 4.31403C9.02583 4.39759 9.13902 4.4444 9.25694 4.4444H12.4445C12.916 4.4444 13.3682 4.6317 13.7016 4.9651C14.035 5.2985 14.2223 5.75069 14.2223 6.22218V6.90129C13.7339 6.46315 13.1006 6.22125 12.4445 6.22218H3.55561C2.89949 6.22125 2.26623 6.46315 1.77783 6.90129Z"
        fill={color}
      />
    </Svg>
  );
}

export function Download({ color = "#525866", size = 16 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 11.0556V2.5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.33301 7.38892L7.99967 11.0556L11.6663 7.38892"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.2782 13.5H3.72266"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** "Go to link": a box with an arrow leaving its corner (Figma 702:5942). */
export function OpenExternal({ color = "#525866", size = 16 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M7 3.00009L4.68182 3C4.28399 3 3.72064 3.15804 3.43934 3.43934C3.15804 3.72064 3 4.10218 3 4.5V11.5C3 11.8978 3.15804 12.2794 3.43934 12.5607C3.72064 12.842 4.10218 13 4.5 13H11.5C11.8978 13 12.2794 12.842 12.5607 12.5607C12.842 12.2794 13 11.8978 13 11.5V9.00568M8.27273 7.72727L13 3M13 6.5V3H9.5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PagePrev({ color = "#717784", size = 14 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M8.74976 10.5L5.24976 7L8.74976 3.5"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PageNext({ color = "#717784", size = 14 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M5.24976 10.5L8.74976 7L5.24976 3.5"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ZoomOut({ color = "#717784", size = 14 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M2.91675 7H11.0834"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ZoomIn({ color = "#717784", size = 14 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M7 2.625V11.375M11.375 7H2.625"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Caret({ color = "#717784", size = 14 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M3.49976 5.25L6.99976 8.75L10.4998 5.25"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** The small up-right arrow on the "Go to highlighted section" pill (Figma 702:5935). */
export function ArrowUpRight({ color = "#fff", size = 12 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path
        d="M2.71875 9.28125L9.28125 2.71875M9.28125 7.64062V2.71875H4.35938"
        stroke={color}
        strokeWidth={0.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
