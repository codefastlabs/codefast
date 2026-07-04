import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@codefast/ui/card";
import { Message, MessageContent } from "@codefast/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScrollerScrollable,
} from "@codefast/ui/message-scroller";

interface Turn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const MESSAGES: Array<Turn> = Array.from({ length: 12 }, (_, index) => ({
  id: `scrollable-${String(index + 1)}`,
  role: index % 2 === 0 ? "user" : "assistant",
  text:
    index % 2 === 0
      ? `Review scroll checkpoint ${String(index + 1)}.`
      : `Checkpoint ${String(index + 1)} is synced. The scrollable hook updates as the viewport moves.\n\nWhen the reader is at the first message, the footer should only point them down. Once they move into the middle of the transcript, it should explain that both directions are available.\n\nAt the latest message, the footer should switch again and only point them back up.`,
}));

function getScrollStatus({ start, end }: { start: boolean; end: boolean }): string {
  if (start && end) {
    return "You can scroll both ways.";
  }

  if (end) {
    return "You are at the top. You can only scroll down.";
  }

  if (start) {
    return "You are at the bottom. You can only scroll up.";
  }

  return "All messages fit in the viewport.";
}

function ScrollStateFooter() {
  const { start, end } = useMessageScrollerScrollable();

  return (
    <CardFooter className="justify-center border-t text-center text-sm text-ui-muted">
      {getScrollStatus({ start, end })}
    </CardFooter>
  );
}

export function MessageScrollerScrollable() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <Card className="h-140 w-full gap-0 overflow-hidden">
        <CardHeader className="gap-1 border-b">
          <CardTitle>Scroll Status</CardTitle>
          <CardDescription>Where the reader can go scroll to based on current scroll position.</CardDescription>
        </CardHeader>
        <MessageScrollerProvider defaultScrollPosition="start">
          <CardContent className="flex-1 overflow-hidden p-0">
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="gap-4 p-6">
                  {MESSAGES.map((message) => {
                    const isUser = message.role === "user";

                    return (
                      <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={isUser}>
                        <Message align={isUser ? "end" : "start"}>
                          <MessageContent>
                            <Bubble align={isUser ? "end" : "start"} variant={isUser ? "muted" : "ghost"}>
                              <BubbleContent className="space-y-2">
                                {message.text
                                  .split(/\n\s*\n/)
                                  .map((paragraph) => paragraph.trim())
                                  .filter(Boolean)
                                  .map((paragraph) => (
                                    <p key={paragraph} className="whitespace-pre-wrap">
                                      {paragraph}
                                    </p>
                                  ))}
                              </BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    );
                  })}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </CardContent>
          <ScrollStateFooter />
        </MessageScrollerProvider>
      </Card>
      <div className="px-0.5 text-center text-xs text-ui-muted">Scroll the transcript to see the footer update.</div>
    </div>
  );
}
