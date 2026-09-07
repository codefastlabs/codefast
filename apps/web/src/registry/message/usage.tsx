import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Message, MessageContent } from "@codefast/ui/message";

export function MessageUsage() {
  return (
    <Message>
      <MessageContent>
        <Bubble>
          <BubbleContent>Hey, how&apos;s it going?</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}
