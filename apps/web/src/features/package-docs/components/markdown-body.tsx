import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";
import { useEffect, useRef } from "react";

import { useMermaidDiagrams } from "#/features/package-docs/lib/use-mermaid-diagrams";
import { track } from "#/features/tracking/lib/tracking";

interface MarkdownBodyProps extends Omit<ComponentProps<"article">, "children" | "dangerouslySetInnerHTML"> {
  /** Rendered document HTML from the server — repo-authored markdown, never user input. */
  readonly html: string;
  /** Identifies the document in `copy_code` events, e.g. `di/spec`; never the copied text. */
  readonly analyticsName: string;
}

const COPIED_FEEDBACK_MS = 2000;

/**
 * A rendered package document; `.markdown-body` in `styles.css` carries the prose styling. The
 * renderer emits a `data-copy-code` button after every code block; one delegated handler here
 * copies the block's text and flips the button into its "Copied" state, so the static HTML needs
 * no per-block React.
 */
export function MarkdownBody({ html, analyticsName, className, ...props }: MarkdownBodyProps) {
  const articleRef = useRef<HTMLElement>(null);

  useMermaidDiagrams(articleRef, html);

  // Listener on the container, not a JSX handler: the clickable element is the real `<button>` in
  // the HTML, so keyboard access comes for free and the article itself stays non-interactive.
  useEffect(() => {
    const article = articleRef.current;

    if (!article) {
      return;
    }

    const onClick = (event: Event): void => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-copy-code]");
      const code = button?.parentElement?.querySelector("pre")?.textContent;

      if (!button || !code || !("clipboard" in navigator)) {
        return;
      }

      void navigator.clipboard.writeText(code).then(() => {
        button.dataset["copied"] = "true";
        button.textContent = "Copied";
        track("copy_code", { kind: "doc-snippet", name: analyticsName });

        setTimeout(() => {
          delete button.dataset["copied"];
          button.textContent = "Copy";
        }, COPIED_FEEDBACK_MS);
      });
    };

    article.addEventListener("click", onClick);

    return () => {
      article.removeEventListener("click", onClick);
    };
  }, [analyticsName]);

  return (
    <article
      ref={articleRef}
      className={cn("markdown-body", className)}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
}
