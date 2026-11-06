/** Header geometry (px). The scroll area spans the whole column; content starts below the header card. */
export const HEADER_TOP = 8; // gap above the header card
export const HEADER_EXPANDED_HEIGHT = 100; // 8 + header card (80) + 12 gap above the first card
export const HEADER_COLLAPSED_HEIGHT = 64; // floating header (60) + 4 gap
/** How far the tick column / content sits higher once the header has collapsed. */
export const HEADER_COLLAPSE_DELTA = HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT;
/** Where the per-card action icons stick while their card scrolls (Figma: 82px below the column top). */
export const CARD_ACTIONS_STICKY_TOP = 82;
