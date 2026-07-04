import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";
import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Message, MessageAvatar, MessageContent, MessageGroup } from "@codefast/ui/message";

export function MessageGroupDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <MessageGroup>
        <Message>
          <MessageAvatar />
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>I checked the registry addresses.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message>
          <MessageAvatar>
            <Avatar>
              <AvatarImage
                alt="@rocky"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&q=80"
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>The component and example JSON now live under the UI registry.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageGroup>
    </div>
  );
}
