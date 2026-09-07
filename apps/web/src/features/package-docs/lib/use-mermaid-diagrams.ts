import { useAppearance } from "@codefast/theme";
import type { RefObject } from "react";
import { useEffect } from "react";

/**
 * Renders the `pre.mermaid` blocks inside `container` as diagrams, re-rendering on a color-scheme
 * change.
 *
 * @remarks Mermaid is imported lazily on first sight of a diagram, so a document without one never
 * loads it. Each block's source is stashed on the node so a re-theme can reprocess a `<pre>` mermaid
 * has already replaced with an SVG.
 */
export function useMermaidDiagrams(container: RefObject<HTMLElement | null>, html: string): void {
  const { colorScheme } = useAppearance();

  useEffect(() => {
    const root = container.current;

    if (!root) {
      return;
    }

    const nodes = [...root.querySelectorAll<HTMLPreElement>("pre.mermaid")];

    if (nodes.length === 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const { default: mermaid } = await import("mermaid");

      if (cancelled) {
        return;
      }

      mermaid.initialize({
        startOnLoad: false,
        theme: colorScheme === "dark" ? "dark" : "default",
        securityLevel: "strict",
        fontFamily: "inherit",
      });

      // Restore each diagram's source before running: on a re-theme the node already holds an SVG,
      // and mermaid reprocesses only a node whose `data-processed` mark is gone.
      for (const node of nodes) {
        const source = (node.dataset["mermaidSource"] ??= node.textContent ?? "");
        node.textContent = source;
        node.removeAttribute("data-processed");
      }

      try {
        await mermaid.run({ nodes });
      } catch {
        // A diagram mermaid cannot parse reveals its source instead of breaking the page.
        for (const node of nodes) {
          node.setAttribute("data-processed", "true");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [container, html, colorScheme]);
}
