import { cn } from "@codefast/ui/lib/utils";

interface ImportPathLabelProps {
  readonly path: string;
  readonly className?: string;
}

/** Static import-path label shown in the gallery card tab bar. */
export function ImportPathLabel({ path, className }: ImportPathLabelProps) {
  return (
    <span
      title={path}
      className={cn(
        "flex max-w-[45%] min-w-0 shrink-0 items-center self-center rounded border border-ui-border/60 bg-ui-surface px-1.5 py-0.5 font-mono text-xs text-ui-muted",
        className,
      )}
    >
      <span className="truncate">{path}</span>
    </span>
  );
}
