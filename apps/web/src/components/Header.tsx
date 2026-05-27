import { Link } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { to: "/", label: "Home", exact: true },
  { to: "/components", label: "Components", exact: false },
  { to: "/about", label: "Getting Started", exact: false },
] as const;

export default function Header() {
  return (
    <header className="site-header-nav sticky top-0 z-50 border-b border-(--line)">
      <div className="page-wrap flex h-12 items-center gap-8 px-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-1.5 no-underline"
          aria-label="@codefast/ui home"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="6" height="6" rx="1.5" fill="var(--sea-ink)" />
            <rect x="9" y="1" width="6" height="6" rx="1.5" fill="var(--sea-ink)" opacity="0.4" />
            <rect x="1" y="9" width="6" height="6" rx="1.5" fill="var(--sea-ink)" opacity="0.4" />
            <rect x="9" y="9" width="6" height="6" rx="1.5" fill="var(--sea-ink)" opacity="0.15" />
          </svg>
          <span className="text-sm font-semibold tracking-tight text-(--sea-ink)">
            codefast<span className="text-(--lagoon)">/ui</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-0.5 sm:flex" aria-label="Main navigation">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="rounded-lg px-3 py-1.5 text-[13px] text-(--sea-ink-soft) no-underline transition-colors hover:bg-(--link-bg-hover) hover:text-(--sea-ink)"
              activeProps={{
                className:
                  "rounded-lg px-3 py-1.5 text-[13px] no-underline font-medium text-[var(--sea-ink)] bg-[var(--link-bg-hover)]",
              }}
              activeOptions={{ exact: to === "/" }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="ml-auto flex items-center gap-1">
          <a
            href="https://github.com/codefastlabs/codefast"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="rounded-lg p-2 text-(--sea-ink-soft) transition-colors hover:bg-(--link-bg-hover) hover:text-(--sea-ink)"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" width="16" height="16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
