import { cn } from "@codefast/ui/lib/utils";
import { useEffect, useState } from "react";

import { CodeBlock } from "#/components/shared/code-block";
import type { HighlightedSource } from "#/lib/highlight";

interface LazyCodeBlockProps {
  /** Loads the source chunk; called once, on the first render (= first Code-tab open). */
  load: () => Promise<HighlightedSource>;
  /** Extra classes for the scroll container (e.g. a min-height). */
  className?: string;
}

/**
 * Defers fetching a `?shiki` source chunk until the block actually renders —
 * gallery cards and detail pages only mount this inside their Code tab, so the
 * raw text + highlighted HTML never download for visitors who don't open it.
 */
export function LazyCodeBlock({ load, className }: LazyCodeBlockProps) {
  const [source, setSource] = useState<HighlightedSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    void load().then((loaded) => {
      if (!cancelled) {
        setSource(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [load]);

  if (!source) {
    return <div className={cn("animate-pulse bg-neutral-900", className)} />;
  }

  return <CodeBlock code={source.code} highlightedCode={source.html} className={className} />;
}
