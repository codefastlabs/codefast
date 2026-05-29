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
      className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-card ${wide ? "sm:col-span-2" : ""}`}
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
        <div className="relative min-h-40">
          <div
            className="h-full min-h-40 overflow-x-auto [&_.shiki]:min-h-full [&_.shiki]:overflow-x-auto [&_.shiki]:bg-neutral-900! [&_.shiki]:p-5 [&_.shiki]:text-xs [&_.shiki]:leading-[1.75] [&_.shiki]:tab-2!"
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
      <div className="border-t border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
