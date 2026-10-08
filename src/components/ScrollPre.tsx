import type React from "react";

/**
 * Codeblock für längere Texte. Er kann bei schmalen Bildschirmen scrollen und ist deshalb per Tastatur
 * fokussierbar (WCAG 2.1.1, axe-Regel scrollable-region-focusable).
 */
export function ScrollPre({ children }: { children: React.ReactNode }) {
  return <pre tabIndex={0}>{children}</pre>;
}
