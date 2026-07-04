import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Button } from "@codefast/ui/button";
import { Message, MessageContent, MessageFooter } from "@codefast/ui/message";
import { CopyIcon, RefreshCcwIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";

export function MessageActions() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Message>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>The install failure is coming from the workspace package.</BubbleContent>
          </Bubble>
          <MessageFooter>
            <Button aria-label="Copy" size="icon-xs" title="Copy" variant="ghost">
              <CopyIcon />
            </Button>
            <Button aria-label="Like" size="icon-xs" title="Like" variant="ghost">
              <ThumbsUpIcon />
            </Button>
            <Button aria-label="Dislike" size="icon-xs" title="Dislike" variant="ghost">
              <ThumbsDownIcon />
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <Bubble align="end">
            <BubbleContent>Okay drop me a link. Taking a look…</BubbleContent>
          </Bubble>
          <MessageFooter className="gap-2">
            <span className="font-normal text-destructive">Failed to send</span>
            <Button aria-label="Retry" size="icon-xs" title="Retry" variant="ghost">
              <RefreshCcwIcon />
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>
    </div>
  );
}
