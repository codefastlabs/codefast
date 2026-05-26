"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

interface PreviewCardProps {
  name: string;
  path: string;
  description: string;
  code: string;
  children: ReactNode;
  wide?: boolean;
}

export function PreviewCard({ name, path, description, code, children, wide }: PreviewCardProps) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] ${wide ? "sm:col-span-2" : ""}`}
    >
      {/* Tab bar */}
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-[var(--line)] px-3">
        <div className="flex shrink-0">
          {(["preview", "code"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`border-b-2 px-3 py-2.5 text-xs font-medium capitalize transition-colors ${
                tab === t
                  ? "border-[var(--sea-ink)] text-[var(--sea-ink)]"
                  : "border-transparent text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <code className="min-w-0 truncate rounded border border-[var(--line)] bg-[var(--chip-bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--sea-ink-soft)]">
          {path}
        </code>
      </div>

      {/* Content */}
      {tab === "preview" ? (
        <div className="flex min-h-40 flex-1 items-center justify-center bg-[var(--chip-bg)] p-6">
          {children}
        </div>
      ) : (
        <div className="relative min-h-40">
          <pre className="h-full overflow-x-auto bg-[var(--code-surface)] p-5 text-xs leading-relaxed text-[var(--code-text)]">
            <code>{code}</code>
          </pre>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-[10px] font-medium text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {/* Meta */}
      <div className="border-t border-[var(--line)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--sea-ink)]">{name}</p>
        <p className="mt-0.5 text-xs leading-5 text-[var(--sea-ink-soft)]">{description}</p>
      </div>
    </div>
  );
}
