import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScrollerScrollable,
} from "@codefast/ui/message-scroller";

const LINES = Array.from({ length: 16 }, (_, index) => `Line ${String(index + 1)} of the transcript.`);

function ScrollableStatus() {
  const scrollable = useMessageScrollerScrollable();

  return (
    <p className="text-xs text-ui-muted">
      More above: {scrollable.start ? "yes" : "no"} · More below: {scrollable.end ? "yes" : "no"}
    </p>
  );
}

export function MessageScrollerScrollable() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <MessageScrollerProvider>
        <ScrollableStatus />
        <MessageScroller className="h-56 rounded-xl border p-2">
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {LINES.map((line) => (
                <MessageScrollerItem key={line}>
                  <Bubble variant="muted">
                    <BubbleContent>{line}</BubbleContent>
                  </Bubble>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
}
