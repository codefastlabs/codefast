import { useAppearance } from "@codefast/theme";
import type { RefObject } from "react";
import { useEffect } from "react";

const RESERVED_SIZE_PREFIX = "di-docs:mermaid-size:";

/**
 * A compact, stable key for a diagram's source (djb2), so a reserved size survives reloads and keys
 * a diagram by content rather than position.
 */
function sizeKeyFor(source: string): string {
  let hash = 5381;

  for (let index = 0; index < source.length; index += 1) {
    hash = (Math.imul(hash, 33) ^ source.charCodeAt(index)) >>> 0;
  }

  return RESERVED_SIZE_PREFIX + hash.toString(36);
}

/** The cached `"width/height maxWidthPx"` a diagram rendered to, or `null` when none is stored. */
function readReservedSize(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Stores the size a diagram rendered to, so a later visit reserves its box before mermaid loads. */
function writeReservedSize(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // A viewer with storage blocked just pays the first-render reflow on every visit.
  }
}

/** Reserves a `<pre>`'s box from a `"width/height maxWidthPx"` string, so its content cannot reflow it. */
function reserve(node: HTMLElement, value: string): void {
  const [ratio, maxWidth] = value.split(" ");

  if (ratio !== undefined && maxWidth !== undefined) {
    node.style.aspectRatio = ratio;
    node.style.maxWidth = maxWidth;
  }
}

/**
 * Renders the `pre.mermaid` blocks inside `container` as diagrams, re-rendering on a color-scheme
 * change.
 *
 * @remarks Mermaid is imported lazily on first sight of a diagram, so a document without one never
 * loads it. Each block's rendered aspect ratio is cached and reserved on the `<pre>` before mermaid
 * loads, so a repeat visit never reflows when the SVG arrives and a color-scheme swap holds its box.
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

    // Reserve each box from its cached size synchronously, before the mermaid chunk downloads, so a
    // repeat visit holds the diagram's space from first paint.
    const keys = nodes.map((node) => sizeKeyFor((node.dataset["mermaidSource"] ??= node.textContent ?? "")));

    nodes.forEach((node, index) => {
      const reserved = readReservedSize(keys[index]!);

      if (reserved !== null) {
        reserve(node, reserved);
      }
    });

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
        node.textContent = node.dataset["mermaidSource"] ?? "";
        node.removeAttribute("data-processed");
      }

      try {
        await mermaid.run({ nodes });

        // Reserve the exact box just measured, for this render and every later visit.
        nodes.forEach((node, index) => {
          const viewBox = node.querySelector("svg")?.getAttribute("viewBox")?.split(/\s+/);

          if (viewBox?.length === 4) {
            const value = `${viewBox[2]}/${viewBox[3]} ${Math.ceil(Number(viewBox[2]))}px`;
            reserve(node, value);
            writeReservedSize(keys[index]!, value);
          }
        });
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
