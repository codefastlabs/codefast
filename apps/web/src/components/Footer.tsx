import { Link } from "@tanstack/react-router";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer px-4 py-16">
      <div className="page-wrap">
        <div className="mb-10 flex flex-col gap-8 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <p className="mb-2 text-sm font-semibold text-(--sea-ink)">
              codefast<span className="text-(--lagoon)">/ui</span>
            </p>
            <p className="text-sm leading-6 text-(--sea-ink-soft)">
              Accessible, composable React components built on Radix UI and Tailwind CSS v4.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 text-sm">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-widest text-(--sea-ink-soft) uppercase">
                Library
              </p>
              <Link to="/" className="text-(--sea-ink-soft) no-underline hover:text-(--sea-ink)">
                Home
              </Link>
              <Link
                to="/components"
                className="text-(--sea-ink-soft) no-underline hover:text-(--sea-ink)"
              >
                Components
              </Link>
              <Link
                to="/about"
                className="text-(--sea-ink-soft) no-underline hover:text-(--sea-ink)"
              >
                Getting Started
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-widest text-(--sea-ink-soft) uppercase">
                Resources
              </p>
              <a
                href="https://github.com/codefastlabs/codefast"
                target="_blank"
                rel="noreferrer"
                className="text-(--sea-ink-soft) no-underline hover:text-(--sea-ink)"
              >
                GitHub
              </a>
              <a
                href="https://github.com/codefastlabs/codefast/issues"
                target="_blank"
                rel="noreferrer"
                className="text-(--sea-ink-soft) no-underline hover:text-(--sea-ink)"
              >
                Issues
              </a>
              <a
                href="https://www.npmjs.com/package/@codefast/ui"
                target="_blank"
                rel="noreferrer"
                className="text-(--sea-ink-soft) no-underline hover:text-(--sea-ink)"
              >
                npm
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t border-(--line) pt-6 text-xs text-(--sea-ink-soft) sm:flex-row sm:justify-between">
          <p>&copy; {year} Codefast Labs. Released under the MIT License.</p>
          <p>Built with TanStack Start · Tailwind CSS v4 · React 19</p>
        </div>
      </div>
    </footer>
  );
}
