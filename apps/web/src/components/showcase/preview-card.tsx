import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { LazyCodeBlock } from "#/components/showcase/lazy-code-block";
import type { HighlightedSource } from "#/lib/highlight";

interface PreviewCardProps {
  name: string;
  path: string;
  description: string;
  /** Loads the demo's source chunk — fetched only when the Code tab opens. */
  loadSource: () => Promise<HighlightedSource>;
  children: ReactNode;
  wide?: boolean;
  id?: string;
  /** When set, the card title links to /components/<slug>. */
  slug?: string;
}

export function PreviewCard({ name, path, description, loadSource, children, wide, id, slug }: PreviewCardProps) {
  const [tab, setTab] = useState<"preview" | "code">("preview");

  return (
    <div
      id={id}
      className={cn(
        "flex scroll-mt-28 flex-col rounded-2xl border border-ui-border bg-ui-card",
        wide && "sm:col-span-2",
      )}
    >
      {/* Tab bar */}
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-ui-border px-3">
        <div className="flex shrink-0">
          {(["preview", "code"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "border-b-2 px-3 py-2.5 text-xs font-medium capitalize transition-colors",
                tab === t ? "border-ui-fg text-ui-fg" : "border-transparent text-ui-muted hover:text-ui-fg",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <code className="min-w-0 truncate rounded border border-ui-border bg-ui-surface px-1.5 py-0.5 font-mono text-xs text-ui-muted">
          {path}
        </code>
      </div>

      {/* Content */}
      {tab === "preview" ? (
        <div className="flex min-h-40 flex-1 items-center justify-center bg-ui-surface p-6">{children}</div>
      ) : (
        <LazyCodeBlock load={loadSource} className="h-full min-h-40" />
      )}

      {/* Meta */}
      <div className="border-t border-ui-border px-4 py-3">
        {slug ? (
          <Link
            to="/components/$slug"
            params={{ slug }}
            className="group inline-flex items-center gap-1 text-sm font-semibold text-ui-fg no-underline"
          >
            {name}
            <ArrowUpRightIcon className="size-3.5 text-ui-muted transition-colors group-hover:text-ui-brand" />
          </Link>
        ) : (
          <p className="text-sm font-semibold text-ui-fg">{name}</p>
        )}
        <p className="mt-0.5 text-xs leading-5 text-ui-muted">{description}</p>
      </div>
    </div>
  );
}
