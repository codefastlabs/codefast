import { TooltipProvider } from "@codefast/ui/tooltip";
import type { ComponentType } from "react";

/** A registry demo with the caption it is shown under; the first section carries none. */
export interface PreviewSection {
  Demo: ComponentType;
  title: string;
}

interface PreviewFrameProps {
  sections: Array<PreviewSection>;
}

/** Stacks a card's demo and examples inside the app-level `TooltipProvider` the site supplies. */
export function PreviewFrame({ sections }: PreviewFrameProps) {
  return (
    <TooltipProvider>
      <div className="flex min-h-full w-full flex-col items-stretch gap-8 p-6">
        {sections.map(({ Demo, title }) => (
          <section className="flex w-full flex-col gap-3" key={title}>
            {title ? <p className="text-xs font-medium text-muted-foreground">{title}</p> : null}
            <div className="flex w-full items-center justify-center">
              <Demo />
            </div>
          </section>
        ))}
      </div>
    </TooltipProvider>
  );
}
