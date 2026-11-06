import { useMemo, useState } from 'react';

/** Hover state plus the Pressable handlers that drive it (no-op on touch-only devices). */
export function useHover() {
  const [hovered, setHovered] = useState(false);
  const handlers = useMemo(
    () => ({ onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) }),
    [],
  );
  return { hovered, handlers };
}
