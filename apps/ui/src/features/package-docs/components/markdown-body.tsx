import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

interface MarkdownBodyProps extends Omit<ComponentProps<"article">, "children" | "dangerouslySetInnerHTML"> {
  /** Rendered document HTML from the server — repo-authored markdown, never user input. */
  readonly html: string;
}

/** A rendered package document; `.markdown-body` in `styles.css` carries the prose styling. */
export function MarkdownBody({ html, className, ...props }: MarkdownBodyProps) {
  return <article className={cn("markdown-body", className)} dangerouslySetInnerHTML={{ __html: html }} {...props} />;
}
