import { Button } from "@codefast/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@codefast/ui/empty";
import { InboxIcon } from "lucide-react";

export function EmptyDemo() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia>
          <InboxIcon className="size-10 text-ui-muted" />
        </EmptyMedia>
        <EmptyTitle>No messages yet</EmptyTitle>
        <EmptyDescription>When you receive messages, they will appear here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Compose message</Button>
      </EmptyContent>
    </Empty>
  );
}
