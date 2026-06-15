import { useCopyToClipboard } from "@codefast/ui/hooks/use-copy-to-clipboard";
import { cn } from "@codefast/ui/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";

interface ImportPathCopyProps {
  readonly path: string;
  readonly className?: string;
}

/** Compact copy control for the gallery card tab bar import path. */
export function ImportPathCopy({ path, className }: ImportPathCopyProps) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  return (
    <button
      type="button"
      onClick={() => void copyToClipboard(path)}
      aria-label={isCopied ? "Copied import path" : "Copy import path"}
      title={path}
      className={cn(
        "flex max-w-[45%] min-w-0 shrink-0 items-center gap-1 rounded border border-ui-border/60 bg-ui-surface px-1.5 py-0.5 font-mono text-xs text-ui-muted transition-colors duration-200 hover:border-ui-brand/40 hover:text-ui-fg",
        className,
      )}
    >
      <span className="truncate">{path}</span>
      {isCopied ? <CheckIcon className="size-3 shrink-0 text-ui-brand" /> : <CopyIcon className="size-3 shrink-0" />}
    </button>
  );
}
