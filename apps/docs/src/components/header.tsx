import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@codefast/tailwind-variants";
import { Button } from "@codefast/ui/button";
import { Separator } from "@codefast/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@codefast/ui/sheet";
import { IconBrandGithub } from "@tabler/icons-react";
import type { LucideIcon } from "lucide-react";
import { CodeIcon, HomeIcon, MenuIcon, PackageIcon, PaletteIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { ModeSwitcher } from "@/components/mode-switcher";

interface NavItem {
  to: ComponentProps<typeof Link>["to"];
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/theme", label: "Appearance", icon: PaletteIcon },
  { to: "/sink", label: "Components", icon: CodeIcon },
];

const GITHUB_URL = "https://github.com/codefastlabs/codefast";

function NavLinks({
  className,
  onNavigate,
  variant = "desktop",
}: {
  className?: string;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className={cn(
        "flex",
        variant === "desktop" ? "items-center gap-0.5" : "flex-col gap-1",
        className,
      )}
      aria-label="Primary"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.to === "/"
            ? pathname === "/" || pathname === ""
            : pathname === item.to || pathname.startsWith(`${String(item.to)}/`);

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              variant === "desktop"
                ? "relative rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                : "flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted",
              isActive &&
                (variant === "desktop"
                  ? "bg-muted text-foreground shadow-sm"
                  : "border-border bg-muted/80 shadow-sm"),
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {variant === "mobile" ? (
              <item.icon className="size-5 shrink-0 text-primary" aria-hidden />
            ) : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 max-w-350 items-center gap-3 px-4 sm:px-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              aria-label="Open navigation menu"
            >
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex w-[min(100%,20rem)] flex-col gap-0 p-0 sm:max-w-sm"
          >
            <SheetHeader className="border-b border-border px-6 py-5 text-left">
              <SheetTitle className="flex items-center gap-2 font-semibold tracking-tight">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PackageIcon className="size-5" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-base">@codefast/ui</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Docs &amp; showcase
                  </span>
                </span>
              </SheetTitle>
              <SheetDescription className="sr-only">
                Site navigation: home, appearance, and components.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
              <NavLinks variant="mobile" onNavigate={() => setMobileOpen(false)} />
              <Separator />
              <div className="space-y-2 px-1">
                <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Quick links
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 w-full justify-start gap-2 font-normal"
                  size="sm"
                >
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                  >
                    <IconBrandGithub className="size-4" aria-hidden />
                    Repository on GitHub
                  </a>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-initial">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5 rounded-lg ring-offset-background transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="sr-only sm:hidden">@codefast/ui documentation home</span>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <PackageIcon className="size-4.5" aria-hidden />
            </span>
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                @codefast/ui
              </span>
              <span className="truncate text-xs text-muted-foreground">
                React component library
              </span>
            </span>
          </Link>
        </div>

        <NavLinks variant="desktop" className="hidden md:flex" />

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden text-muted-foreground sm:inline-flex"
            asChild
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
            >
              <IconBrandGithub className="size-4.5" aria-hidden />
            </a>
          </Button>
          <ModeSwitcher />
        </div>
      </div>
    </header>
  );
}
