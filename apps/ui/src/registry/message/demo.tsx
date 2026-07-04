import { Avatar, AvatarFallback } from "@codefast/ui/avatar";
import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Message, MessageAvatar, MessageContent, MessageHeader } from "@codefast/ui/message";

export function MessageDemo() {
  return (
    <Message className="w-full max-w-sm">
      <MessageAvatar>
        <Avatar size="sm">
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader>Ada</MessageHeader>
        <Bubble variant="muted">
          <BubbleContent>Morning! Ready for the demo?</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}
