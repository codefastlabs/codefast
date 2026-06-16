import { Link } from "@tanstack/react-router";

import { AppearanceToggle } from "#/components/layout/appearance-toggle";
import { PRIMARY_NAV, RESOURCE_LINKS } from "#/components/layout/nav-links";

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
              {PRIMARY_NAV.map(({ to, label }) => (
                <Link key={to} to={to} className="text-ui-muted no-underline hover:text-ui-fg">
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-widest text-ui-muted uppercase">Resources</p>
              {RESOURCE_LINKS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ui-muted no-underline hover:text-ui-fg"
                >
                  {label}
                </a>
              ))}
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
