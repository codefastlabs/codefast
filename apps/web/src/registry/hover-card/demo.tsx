import { Button } from "@codefast/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@codefast/ui/hover-card";

export function HoverCardDemo() {
  return (
    <HoverCard closeDelay={100} openDelay={10}>
      <HoverCardTrigger asChild>
        <Button variant="link">Hover Here</Button>
      </HoverCardTrigger>
      <HoverCardContent className="flex w-64 flex-col gap-0.5">
        <div className="font-semibold">@nextjs</div>
        <div>The React Framework – created and maintained by @vercel.</div>
        <div className="mt-1 text-xs text-ui-muted">Joined December 2021</div>
      </HoverCardContent>
    </HoverCard>
  );
}
