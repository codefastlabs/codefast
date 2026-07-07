import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Button } from "@codefast/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@codefast/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@codefast/ui/empty";
import { Message, MessageContent } from "@codefast/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@codefast/ui/message-scroller";
import { ToggleGroup, ToggleGroupItem } from "@codefast/ui/toggle-group";
import { ArrowUpIcon, MessageCircleDashedIcon, RotateCwIcon } from "lucide-react";
import * as React from "react";

type AnchorRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: AnchorRole;
  text: string;
}

const SCRIPTED_MESSAGES: Array<ChatMessage> = [
  {
    id: "anchor-1-user",
    role: "user",
    text: "Can you show me how anchoring behaves when a new prompt starts the turn?",
  },
  {
    id: "anchor-1-assistant",
    role: "assistant",
    text: "Append the user prompt first, then append the assistant response. With User selected, the prompt settles near the top and the assistant response fills in below it.",
  },
  {
    id: "anchor-2-user",
    role: "user",
    text: "What changes when assistant messages are the anchor?",
  },
  {
    id: "anchor-2-assistant",
    role: "assistant",
    text: "Now each assistant response is the item MessageScroller keeps in view. This is useful when the reply is the moment you want readers to land on after each turn.",
  },
  {
    id: "anchor-3-user",
    role: "user",
    text: "Can I switch roles and keep adding turns?",
  },
  {
    id: "anchor-3-assistant",
    role: "assistant",
    text: "Yes. The next appended message with the selected role becomes the anchor, so you can compare user and assistant anchoring without resetting the demo.",
  },
];

export function MessageScrollerAnchoring() {
  const [anchorRole, setAnchorRole] = React.useState<AnchorRole>("user");
  const [count, setCount] = React.useState(0);
  const messages = SCRIPTED_MESSAGES.slice(0, count);
  const nextMessage = SCRIPTED_MESSAGES[count];

  return (
    <div className="relative flex flex-col gap-4">
      <Card className="mx-auto h-140 w-full max-w-sm gap-0">
        <CardHeader className="border-b">
          <CardTitle>Anchoring Turns</CardTitle>
          <CardDescription>Choose which role settles near the top edge.</CardDescription>
          <CardAction>
            <Button
              aria-label="Reset anchored turns"
              disabled={count === 0}
              size="icon"
              type="button"
              variant="outline"
              onClick={() => {
                setCount(0);
              }}
            >
              <RotateCwIcon />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
          {messages.length === 0 ? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageCircleDashedIcon />
                </EmptyMedia>
                <EmptyTitle>No anchored messages yet</EmptyTitle>
                <EmptyDescription>Send the first message to see the selected role anchor.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <MessageScrollerProvider>
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent className="p-6">
                    {messages.map((message) => {
                      const isUser = message.role === "user";

                      return (
                        <MessageScrollerItem
                          key={message.id}
                          messageId={message.id}
                          isScrollAnchor={message.role === anchorRole}
                        >
                          <Message align={isUser ? "end" : "start"}>
                            <MessageContent>
                              <Bubble align={isUser ? "end" : "start"} variant={isUser ? "muted" : "ghost"}>
                                <BubbleContent>{message.text}</BubbleContent>
                              </Bubble>
                            </MessageContent>
                          </Message>
                        </MessageScrollerItem>
                      );
                    })}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </MessageScrollerProvider>
          )}
        </CardContent>
        <CardFooter>
          <ToggleGroup
            aria-label="Select scroll anchor role"
            type="single"
            value={anchorRole}
            onValueChange={(value) => {
              if (value === "user" || value === "assistant") {
                setAnchorRole(value);
                setCount(0);
              }
            }}
          >
            <ToggleGroupItem aria-label="Anchor user messages" value="user">
              User
            </ToggleGroupItem>
            <ToggleGroupItem aria-label="Anchor assistant messages" value="assistant">
              Assistant
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            className="ml-auto"
            disabled={!nextMessage}
            size="icon"
            type="button"
            onClick={() => {
              if (!nextMessage) {
                return;
              }

              setCount((value) => value + 1);
            }}
          >
            <ArrowUpIcon />
            <span className="sr-only">Send Message</span>
          </Button>
        </CardFooter>
      </Card>
      <div className="mx-auto max-w-xs px-0.5 text-center text-xs text-ui-muted">
        Toggle the anchor role, then send messages to compare where turns settle.
      </div>
    </div>
  );
}
