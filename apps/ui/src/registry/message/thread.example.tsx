import { Avatar, AvatarFallback } from "@codefast/ui/avatar";
import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@codefast/ui/message";

export function MessageThread() {
  return (
    <MessageGroup className="w-full max-w-sm">
      <Message>
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
      <Message align="end">
        <MessageContent>
          <Bubble align="end">
            <BubbleContent>Yep — joining now.</BubbleContent>
          </Bubble>
          <MessageFooter>Delivered</MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>
  );
}
