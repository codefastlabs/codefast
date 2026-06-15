import { cn } from "@codefast/ui/lib/utils";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  readonly eyebrow?: string;
  readonly title: ReactNode;
  readonly description?: string;
  readonly inverted?: boolean;
  readonly className?: string;
  readonly titleId?: string;
}

/** Section heading pattern for marketing and docs pages. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  inverted = false,
  className,
  titleId,
}: SectionHeaderProps) {
  return (
    <header className={cn("max-w-2xl", className)}>
      {eyebrow ? (
        <p
          className={cn(
            "mb-4 text-xs font-semibold tracking-widest uppercase",
            inverted ? "text-ui-brand" : "text-ui-muted",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={titleId}
        className={cn("leading-none font-bold tracking-tighter", inverted ? "text-ui-inverse" : "text-ui-fg")}
        style={{ fontSize: "clamp(36px,4.5vw,56px)" }}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn("mt-5 text-base leading-relaxed", inverted ? "text-ui-inverse/55" : "text-ui-muted")}>
          {description}
        </p>
      ) : null}
    </header>
  );
}
