import { Button } from "@codefast/ui/button";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@codefast/ui/sheet";
import { Link } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { AppearanceToggle } from "#/components/layout/appearance-toggle";
import { CommandPalette } from "#/components/layout/command-palette";
import { GitHubLink } from "#/components/layout/github-link";
import { Logo } from "#/components/layout/logo";
import { PRIMARY_NAV } from "#/lib/nav-links";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ui-border/60 bg-ui-bg/75 backdrop-blur-lg backdrop-saturate-150">
      <div className="container mx-auto flex h-header items-center gap-8 px-4">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main navigation">
          {PRIMARY_NAV.map(({ to, label }) => (
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
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 md:hidden"
                aria-label="Open navigation menu"
              >
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
                  {PRIMARY_NAV.map(({ to, label }) => (
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
