import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Message, MessageContent } from "@codefast/ui/message";

export function MessageAlignment() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Message align="start">
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>Incoming — aligned to the start.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <Bubble align="end">
            <BubbleContent>Outgoing — the row mirrors to the end.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </div>
  );
}
