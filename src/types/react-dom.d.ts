/** Only `createPortal` is used (web tooltips); react-dom ships without bundled types here. */
declare module 'react-dom' {
  import type { ReactNode, ReactPortal } from 'react';
  export function createPortal(children: ReactNode, container: Element): ReactPortal;
}
