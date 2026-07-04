import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";
import { Bubble, BubbleContent, BubbleReactions } from "@codefast/ui/bubble";
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
            <AvatarImage
              alt="@ada"
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&q=80"
            />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>Ada Lovelace</MessageHeader>
          <Bubble variant="muted">
            <BubbleContent>Morning! The new registry docs are live — want to review before we ship?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <Bubble align="end">
            <BubbleContent>Yes! Joining now.</BubbleContent>
            <BubbleReactions aria-label="Reaction: thumbs up" role="img">
              👍
            </BubbleReactions>
          </Bubble>
          <MessageFooter>9:41 AM · Read</MessageFooter>
        </MessageContent>
      </Message>
      <Message>
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
          <Bubble variant="muted">
            <BubbleContent>Great — starting with the chat components.</BubbleContent>
          </Bubble>
          <MessageFooter>9:42 AM</MessageFooter>
        </MessageContent>
      </Message>
    </MessageGroup>
  );
}
