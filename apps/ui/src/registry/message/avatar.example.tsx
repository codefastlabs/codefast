import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";
import { Bubble, BubbleContent, BubbleGroup } from "@codefast/ui/bubble";
import { Message, MessageAvatar, MessageContent } from "@codefast/ui/message";

export function MessageAvatarDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarImage alt="@rocky" src="https://avatar.vercel.sh/rocky" />
            <AvatarFallback>R</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>The build failed during dependency installation.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageAvatar>
          <Avatar>
            <AvatarImage alt="@grace" src="https://avatar.vercel.sh/grace" />
            <AvatarFallback>G</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble>
            <BubbleContent>Can you share the exact error?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageAvatar>
          <Avatar>
            <AvatarImage alt="@rocky" src="https://avatar.vercel.sh/rocky" />
            <AvatarFallback>R</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <BubbleGroup>
            <Bubble variant="muted">
              <BubbleContent>Here’s the error from the logs</BubbleContent>
            </Bubble>
            <Bubble variant="muted">
              <BubbleContent>
                Something went wrong with the build. The libraries are not installed correctly. Try running the build
                again.
              </BubbleContent>
            </Bubble>
          </BubbleGroup>
        </MessageContent>
      </Message>
    </div>
  );
}
