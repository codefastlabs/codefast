import { HoverCard, HoverCardContent, HoverCardTrigger } from "@codefast/ui/hover-card";
import { CalendarIcon } from "lucide-react";

export function HoverCardDemo() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          className="cursor-pointer text-sm font-medium underline underline-offset-4 hover:text-ui-brand"
          type="button"
        >
          @codefast
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-72">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ui-brand text-sm font-bold text-white">
            CF
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">Codefast Labs</p>
            <p className="text-xs text-ui-muted">Building fast, accessible UI components for modern web apps.</p>
            <div className="flex items-center gap-1 text-xs text-ui-muted">
              <CalendarIcon className="size-3" />
              <span>Joined January 2024</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
