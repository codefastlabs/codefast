import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@codefast/ui/bubble";
import { Marker, MarkerContent } from "@codefast/ui/marker";
import { Message, MessageAvatar, MessageContent, MessageFooter } from "@codefast/ui/message";

const meAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&q=80";
const rabbitAvatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&h=128&fit=crop&q=80";

export function MessageDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6 py-4">
      <Message align="end">
        <MessageAvatar>
          <Avatar>
            <AvatarImage alt="@me" src={meAvatar} />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble>
            <BubbleContent>Deploying to prod real quick.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarImage alt="@rabbit" src={rabbitAvatar} />
            <AvatarFallback>R</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>It&apos;s 4:55 PM. On a Friday.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageAvatar>
          <Avatar>
            <AvatarImage alt="@me" src={meAvatar} />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble>
            <BubbleContent>It&apos;s a one-line change.</BubbleContent>
          </Bubble>
          <MessageFooter>Delivered</MessageFooter>
        </MessageContent>
      </Message>
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarImage alt="@rabbit" src={rabbitAvatar} />
            <AvatarFallback>R</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <BubbleGroup>
            <Bubble variant="muted">
              <BubbleContent>It&apos;s always a one-line change 😭.</BubbleContent>
            </Bubble>
            <Bubble variant="muted">
              <BubbleContent>Alright, let me take a look.</BubbleContent>
              <BubbleReactions aria-label="Reactions: thumbs up">
                <span>👍</span>
              </BubbleReactions>
            </Bubble>
          </BubbleGroup>
        </MessageContent>
      </Message>
      <Marker role="status">
        <MarkerContent className="shimmer">
          <span className="font-medium">Oliver</span> is typing...
        </MarkerContent>
      </Marker>
    </div>
  );
}
