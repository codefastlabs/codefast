import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";
import {
  Kbd,
  KbdGroup,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@codefast/ui";

export function KbdDemo({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <section className="space-y-2">
        <h3 className="text-muted-foreground text-sm font-medium">Common actions</h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-background/50 flex items-center justify-between rounded-md border p-3">
            <div className="text-sm font-medium">Reload page</div>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>R</Kbd>
            </KbdGroup>
          </div>

          <div className="bg-background/50 flex items-center justify-between rounded-md border p-3">
            <div className="text-sm font-medium">Open command palette</div>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </div>

          <div className="bg-background/50 flex items-center justify-between rounded-md border p-3">
            <div className="text-sm font-medium">Toggle sidebar</div>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>B</Kbd>
            </KbdGroup>
          </div>

          <div className="bg-background/50 flex items-center justify-between rounded-md border p-3">
            <div className="text-sm font-medium">Format document</div>
            <KbdGroup>
              <Kbd>Shift</Kbd>
              <Kbd>⌥</Kbd>
              <Kbd>F</Kbd>
            </KbdGroup>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-muted-foreground text-sm font-medium">Single keys</h3>

        <div className="flex flex-wrap gap-2">
          <Kbd>Esc</Kbd>
          <Kbd>Tab</Kbd>
          <Kbd>Enter</Kbd>
          <Kbd>Space</Kbd>
          <Kbd aria-label="Arrow up">↑</Kbd>
          <Kbd aria-label="Arrow down">↓</Kbd>
          <Kbd aria-label="Arrow left">←</Kbd>
          <Kbd aria-label="Arrow right">→</Kbd>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-muted-foreground text-sm font-medium">With tooltip</h3>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="bg-background/50 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
              Hover to view shortcuts
            </TooltipTrigger>
            <TooltipContent align="end" className="space-y-2" side="top">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground text-xs font-medium">Reload page</span>
                <KbdGroup>
                  <Kbd>⌘</Kbd>
                  <Kbd>R</Kbd>
                </KbdGroup>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground text-xs font-medium">
                  Open command palette
                </span>
                <KbdGroup>
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </KbdGroup>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground text-xs font-medium">Toggle sidebar</span>
                <KbdGroup>
                  <Kbd>⌘</Kbd>
                  <Kbd>B</Kbd>
                </KbdGroup>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </section>
    </div>
  );
}
