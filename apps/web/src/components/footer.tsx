import { cn } from "@codefast/tailwind-variants";
import { Link } from "@tanstack/react-router";
import { AppearanceToggle } from "#/components/appearance-toggle.tsx";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("py-16", "border-t border-border", "bg-muted")}>
      <div className={cn("container", "mx-auto px-4")}>
        <div className={cn("flex flex-col gap-8", "mb-10", "sm:flex-row sm:justify-between")}>
          {/* Brand */}
          <div className="max-w-xs">
            <p className={cn("mb-2", "text-sm font-semibold text-foreground")}>
              codefast<span className="text-primary">/ui</span>
            </p>
            <p className={cn("mb-4", "text-sm leading-6 text-muted-foreground")}>
              Accessible, composable React components built on Radix UI and Tailwind CSS v4.
            </p>
            <AppearanceToggle />
          </div>

          {/* Links */}
          <div className="flex gap-16 text-sm">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Library
              </p>
              <Link
                to="/"
                className={cn("text-muted-foreground no-underline", "hover:text-foreground")}
              >
                Home
              </Link>
              <Link
                to="/components"
                className={cn("text-muted-foreground no-underline", "hover:text-foreground")}
              >
                Components
              </Link>
              <Link
                to="/about"
                className={cn("text-muted-foreground no-underline", "hover:text-foreground")}
              >
                Getting Started
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Resources
              </p>
              <a
                href="https://github.com/codefastlabs/codefast"
                target="_blank"
                rel="noreferrer"
                className={cn("text-muted-foreground no-underline", "hover:text-foreground")}
              >
                GitHub
              </a>
              <a
                href="https://github.com/codefastlabs/codefast/issues"
                target="_blank"
                rel="noreferrer"
                className={cn("text-muted-foreground no-underline", "hover:text-foreground")}
              >
                Issues
              </a>
              <a
                href="https://www.npmjs.com/package/@codefast/ui"
                target="_blank"
                rel="noreferrer"
                className={cn("text-muted-foreground no-underline", "hover:text-foreground")}
              >
                npm
              </a>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col gap-1",
            "pt-6",
            "border-t border-border",
            "text-xs text-muted-foreground",
            "sm:flex-row sm:justify-between",
          )}
        >
          <p>&copy; {year} Codefast Labs. Released under the MIT License.</p>
          <p className="sm:text-right">Built with TanStack Start · Tailwind CSS v4 · React 19</p>
        </div>
      </div>
    </footer>
  );
}
