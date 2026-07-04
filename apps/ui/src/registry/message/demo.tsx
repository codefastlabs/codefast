import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";
import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Message, MessageAvatar, MessageContent, MessageHeader } from "@codefast/ui/message";

export function MessageDemo() {
  return (
    <Message className="w-full max-w-sm">
      <MessageAvatar>
        <Avatar size="sm">
          <AvatarImage
            alt="@ada"
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&q=80"
          />
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
