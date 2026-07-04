import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Message, MessageContent } from "@codefast/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@codefast/ui/message-scroller";

const TURNS = Array.from({ length: 12 }, (_, index) => ({
  align: index % 2 === 0 ? ("start" as const) : ("end" as const),
  text: index % 2 === 0 ? `Message ${String(index + 1)} in the transcript.` : `Reply ${String(index + 1)}.`,
}));

export function MessageScrollerDemo() {
  return (
    <div className="h-80 w-full max-w-sm rounded-xl border p-2">
      <MessageScrollerProvider autoScroll defaultScrollPosition="end">
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {TURNS.map((turn, index) => (
                <MessageScrollerItem
                  key={turn.text}
                  messageId={`m${String(index)}`}
                  scrollAnchor={turn.align === "start"}
                >
                  <Message align={turn.align}>
                    <MessageContent>
                      <Bubble align={turn.align} variant={turn.align === "start" ? "muted" : "default"}>
                        <BubbleContent>{turn.text}</BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
}
