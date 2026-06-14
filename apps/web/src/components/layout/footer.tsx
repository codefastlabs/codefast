import { Link } from "@tanstack/react-router";

import { AppearanceToggle } from "#/components/layout/appearance-toggle";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ui-border bg-ui-surface py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-8 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <p className="mb-2 text-sm font-semibold text-ui-fg">
              codefast<span className="text-ui-brand">/ui</span>
            </p>
            <p className="mb-4 text-sm leading-6 text-ui-muted">
              Accessible, composable React components built on Radix UI and Tailwind CSS v4.
            </p>
            <AppearanceToggle />
          </div>

          {/* Links */}
          <div className="flex gap-16 text-sm">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-widest text-ui-muted uppercase">Library</p>
              <Link to="/" className="text-ui-muted no-underline hover:text-ui-fg">
                Home
              </Link>
              <Link to="/components" className="text-ui-muted no-underline hover:text-ui-fg">
                Components
              </Link>
              <Link to="/about" className="text-ui-muted no-underline hover:text-ui-fg">
                Getting Started
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-widest text-ui-muted uppercase">Resources</p>
              <a
                href="https://github.com/codefastlabs/codefast"
                target="_blank"
                rel="noreferrer"
                className="text-ui-muted no-underline hover:text-ui-fg"
              >
                GitHub
              </a>
              <a
                href="https://github.com/codefastlabs/codefast/issues"
                target="_blank"
                rel="noreferrer"
                className="text-ui-muted no-underline hover:text-ui-fg"
              >
                Issues
              </a>
              <a
                href="https://www.npmjs.com/package/@codefast/ui"
                target="_blank"
                rel="noreferrer"
                className="text-ui-muted no-underline hover:text-ui-fg"
              >
                npm
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t border-ui-border pt-6 text-xs text-ui-muted sm:flex-row sm:justify-between">
          <p>&copy; {year} Codefast Labs. Released under the MIT License.</p>
          <p className="sm:text-end">Built with TanStack Start · Tailwind CSS v4 · React 19</p>
        </div>
      </div>
    </footer>
  );
}
