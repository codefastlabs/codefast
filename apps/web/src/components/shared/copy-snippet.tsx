import { useCopyToClipboard } from "@codefast/ui/hooks/use-copy-to-clipboard";
import { cn } from "@codefast/ui/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import type { ComponentProps } from "react";

interface CopySnippetProps extends ComponentProps<"div"> {
  readonly code: string;
  readonly label?: string;
}

/** Plain-text code block with a copy button — used on Getting Started steps. */
export function CopySnippet({ code, label = "Copy code", className, ...props }: CopySnippetProps) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  return (
    <div
      className={cn("relative overflow-hidden rounded-xl border border-ui-border/60 bg-neutral-900", className)}
      {...props}
    >
      <pre className="overflow-x-auto p-5 pe-24 text-sm leading-relaxed text-neutral-100">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={() => void copyToClipboard(code)}
        aria-label={isCopied ? "Copied" : label}
        className="absolute inset-e-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/70 transition-colors duration-200 hover:bg-white/20 hover:text-white"
      >
        {isCopied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        {isCopied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
