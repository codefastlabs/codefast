import { Link } from "@tanstack/react-router";

/** Wordmark + glyph linking back to the home page. */
export function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-1.5 no-underline" aria-label="@codefast/ui home">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-ui-fg" aria-hidden="true">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.15" />
      </svg>
      <span className="text-sm font-semibold tracking-tight text-ui-fg">
        codefast<span className="text-ui-brand">/ui</span>
      </span>
    </Link>
  );
}
