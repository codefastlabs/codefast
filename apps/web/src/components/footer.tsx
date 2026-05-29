import { Link } from "@tanstack/react-router";
import { FooterAppearanceToggle } from "#/components/footer-appearance-toggle";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted px-4 py-16">
      <div className="mx-auto w-[min(1080px,calc(100%-2rem))]">
        <div className="mb-10 flex flex-col gap-8 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <p className="mb-2 text-sm font-semibold text-foreground">
              codefast<span className="text-primary">/ui</span>
            </p>
            <p className="mb-4 text-sm leading-6 text-muted-foreground">
              Accessible, composable React components built on Radix UI and Tailwind CSS v4.
            </p>
            <FooterAppearanceToggle />
          </div>

          {/* Links */}
          <div className="flex gap-16 text-sm">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Library
              </p>
              <Link to="/" className="text-muted-foreground no-underline hover:text-foreground">
                Home
              </Link>
              <Link
                to="/components"
                className="text-muted-foreground no-underline hover:text-foreground"
              >
                Components
              </Link>
              <Link
                to="/about"
                className="text-muted-foreground no-underline hover:text-foreground"
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
                className="text-muted-foreground no-underline hover:text-foreground"
              >
                GitHub
              </a>
              <a
                href="https://github.com/codefastlabs/codefast/issues"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground no-underline hover:text-foreground"
              >
                Issues
              </a>
              <a
                href="https://www.npmjs.com/package/@codefast/ui"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground no-underline hover:text-foreground"
              >
                npm
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>&copy; {year} Codefast Labs. Released under the MIT License.</p>
          <p className="sm:text-right">Built with TanStack Start · Tailwind CSS v4 · React 19</p>
        </div>
      </div>
    </footer>
  );
}
