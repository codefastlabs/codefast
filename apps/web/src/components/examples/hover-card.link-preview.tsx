import { HoverCard, HoverCardContent, HoverCardTrigger } from "@codefast/ui/hover-card";
import { ExternalLinkIcon } from "lucide-react";

export function HoverCardLinkPreview() {
  return (
    <p className="max-w-xs text-center text-sm text-ui-muted">
      Built on{" "}
      <HoverCard>
        <HoverCardTrigger asChild>
          <a
            href="https://www.radix-ui.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-ui-fg underline underline-offset-4"
          >
            Radix UI
          </a>
        </HoverCardTrigger>
        <HoverCardContent className="w-64 text-left">
          <p className="text-sm font-semibold text-ui-fg">Radix Primitives</p>
          <p className="mt-1 text-xs text-ui-muted">
            Unstyled, accessible components for building high-quality design systems.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-ui-brand">
            <ExternalLinkIcon className="size-3" />
            radix-ui.com
          </span>
        </HoverCardContent>
      </HoverCard>{" "}
      primitives.
    </p>
  );
}
