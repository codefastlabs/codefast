import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

interface PreviewCardProps {
  name: string;
  path: string;
  description: string;
  code: string;
  highlightedCode: string;
  children: ReactNode;
  wide?: boolean;
}

export function PreviewCard({
  name,
  path,
  description,
  code,
  highlightedCode,
  children,
  wide,
}: PreviewCardProps) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — no visual change
    }
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-(--line) bg-(--surface) ${wide ? "sm:col-span-2" : ""}`}
    >
      {/* Tab bar */}
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-(--line) px-3">
        <div className="flex shrink-0">
          {(["preview", "code"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`border-b-2 px-3 py-2.5 text-xs font-medium capitalize transition-colors ${
                tab === t
                  ? "border-(--sea-ink) text-(--sea-ink)"
                  : "border-transparent text-(--sea-ink-soft) hover:text-(--sea-ink)"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <code className="min-w-0 truncate rounded border border-(--line) bg-(--chip-bg) px-1.5 py-0.5 font-mono text-[10px] text-(--sea-ink-soft)">
          {path}
        </code>
      </div>

      {/* Content */}
      {tab === "preview" ? (
        <div className="flex min-h-40 flex-1 items-center justify-center bg-(--chip-bg) p-6">
          {children}
        </div>
      ) : (
        <div className="relative min-h-40">
          <div
            className="shiki-wrap h-full min-h-40 overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
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
      <div className="border-t border-(--line) px-4 py-3">
        <p className="text-sm font-semibold text-(--sea-ink)">{name}</p>
        <p className="mt-0.5 text-xs leading-5 text-(--sea-ink-soft)">{description}</p>
      </div>
    </div>
  );
}
