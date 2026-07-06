import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Message, MessageContent, MessageFooter, MessageHeader } from "@codefast/ui/message";

export function MessageHeaderFooter() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Message>
        <MessageContent>
          <MessageHeader>Olivia</MessageHeader>
          <Bubble variant="muted">
            <BubbleContent>I already checked the logs.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <Bubble>
            <BubbleContent>Send the report to the team. Ping @olivia if you need help.</BubbleContent>
          </Bubble>
          <MessageFooter>
            <div>
              Read <span className="font-normal">Yesterday</span>
            </div>
          </MessageFooter>
        </MessageContent>
      </Message>
    </div>
  );
}
