import type { ComponentProps } from "react";

import { track } from "#/features/tracking/lib/tracking";
import { GITHUB_URL } from "#/lib/nav-links";

/** Outbound link to the GitHub repository. */
export function GitHubLink({ className, onClick, ...props }: ComponentProps<"a">) {
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="GitHub repository"
      className={className ?? "rounded-lg p-2 text-ui-muted transition-colors hover:bg-ui-surface hover:text-ui-fg"}
      {...props}
      onClick={(event) => {
        track("open_external", { destination: "github", surface: "header" });
        onClick?.(event);
      }}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" width="16" height="16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
      </svg>
    </a>
  );
}
