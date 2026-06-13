import { Button } from "@codefast/ui/button";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@codefast/ui/sheet";
import { Link } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { AppearanceToggle } from "#/components/layout/appearance-toggle";
import { CommandPalette } from "#/components/layout/command-palette";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/components", label: "Components" },
  { to: "/about", label: "Getting Started" },
] as const;

function Logo() {
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

function GitHubLink({ className }: { className?: string }) {
  return (
    <a
      href="https://github.com/codefastlabs/codefast"
      target="_blank"
      rel="noreferrer"
      aria-label="GitHub repository"
      className={className ?? "rounded-lg p-2 text-ui-muted transition-colors hover:bg-ui-surface hover:text-ui-fg"}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" width="16" height="16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
      </svg>
    </a>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ui-border bg-ui-bg/75 backdrop-blur-[20px] backdrop-saturate-150">
      <div className="container mx-auto flex h-12 items-center gap-8 px-4">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="rounded-lg px-3 py-1.5 text-sm text-ui-muted no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg"
              activeProps={{
                className: "rounded-lg bg-ui-surface px-3 py-1.5 text-sm font-medium text-ui-fg no-underline",
              }}
              activeOptions={{ exact: to === "/" }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="ms-auto flex items-center gap-1.5">
          <CommandPalette />
          <div className="hidden md:block">
            <AppearanceToggle />
          </div>
          <GitHubLink />

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu">
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <SheetBody className="pb-4">
                <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                  {NAV_LINKS.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm text-ui-muted no-underline transition-colors hover:bg-ui-surface hover:text-ui-fg"
                      activeProps={{
                        className: "rounded-lg bg-ui-surface px-3 py-2 text-sm font-medium text-ui-fg no-underline",
                      }}
                      activeOptions={{ exact: to === "/" }}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-6 flex flex-col gap-3 border-t border-ui-border pt-6">
                  <p className="px-3 text-xs font-semibold tracking-widest text-ui-muted uppercase">Appearance</p>
                  <div className="px-3">
                    <AppearanceToggle />
                  </div>
                </div>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
