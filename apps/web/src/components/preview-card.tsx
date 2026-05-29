import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";
import { CodeBlock } from "#/components/code-block";

interface PreviewCardProps {
  name: string;
  path: string;
  description: string;
  code: string;
  highlightedCode: string;
  children: ReactNode;
  wide?: boolean;
  id?: string;
  /** When set, the card title links to /components/<slug>. */
  slug?: string;
}

export function PreviewCard({
  name,
  path,
  description,
  code,
  highlightedCode,
  children,
  wide,
  id,
  slug,
}: PreviewCardProps) {
  const [tab, setTab] = useState<"preview" | "code">("preview");

  return (
    <div
      id={id}
      className={`flex scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-border bg-card ${wide ? "sm:col-span-2" : ""}`}
    >
      {/* Tab bar */}
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border px-3">
        <div className="flex shrink-0">
          {(["preview", "code"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`border-b-2 px-3 py-2.5 text-xs font-medium capitalize transition-colors ${
                tab === t
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <code className="min-w-0 truncate rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {path}
        </code>
      </div>

      {/* Content */}
      {tab === "preview" ? (
        <div className="flex min-h-40 flex-1 items-center justify-center bg-muted p-6">
          {children}
        </div>
      ) : (
        <CodeBlock code={code} highlightedCode={highlightedCode} className="h-full min-h-40" />
      )}

      {/* Meta */}
      <div className="border-t border-border px-4 py-3">
        {slug ? (
          <Link
            to="/components/$slug"
            params={{ slug }}
            className="group inline-flex items-center gap-1 text-sm font-semibold text-foreground no-underline"
          >
            {name}
            <ArrowUpRightIcon className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>
        ) : (
          <p className="text-sm font-semibold text-foreground">{name}</p>
        )}
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
