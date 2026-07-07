import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Button } from "@codefast/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@codefast/ui/card";
import { Marker, MarkerContent } from "@codefast/ui/marker";
import { Message, MessageContent, MessageHeader } from "@codefast/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@codefast/ui/message-scroller";
import { Tooltip, TooltipContent, TooltipTrigger } from "@codefast/ui/tooltip";
import { RotateCwIcon } from "lucide-react";
import * as React from "react";

type GroupChatItem =
  | {
      id: string;
      type: "event";
      text: string;
      isScrollAnchor?: boolean | undefined;
    }
  | {
      id: string;
      type: "message";
      sender: string;
      role: "assistant" | "participant";
      text: string;
      isScrollAnchor?: boolean | undefined;
    };

const CURRENT_USER = "Grace";

const INITIAL_ITEMS: Array<GroupChatItem> = [
  {
    id: "group-1",
    type: "message",
    sender: "Grace",
    role: "participant",
    text: "@mary, the astrophage line keeps matching Venus energy output. Can you check my math?",
  },
  {
    id: "group-2",
    type: "message",
    sender: "Mary (Agent)",
    role: "assistant",
    text: "Yes. Confirmed. The curve points to a microorganism harvesting stellar energy and breeding near carbon dioxide. If @rocky agrees, this is the clue we need.",
  },
  {
    id: "group-3",
    type: "message",
    sender: "Grace",
    role: "participant",
    text: "ping @rocky",
    isScrollAnchor: true,
  },
];

const ROCKY_MARKER: GroupChatItem = {
  id: "group-4",
  type: "event",
  text: "Rocky has joined the chat",
  isScrollAnchor: true,
};

const ROCKY_MESSAGE: GroupChatItem = {
  id: "group-5",
  type: "message",
  sender: "Rocky",
  role: "participant",
  text: "Amaze. Astrophage eats light, makes heat, goes to carbon dioxide. Rocky has fuel model. Grace is smart.",
};

function GroupChatMessage({ item }: { item: Extract<GroupChatItem, { type: "message" }> }) {
  const isCurrentUser = item.sender === CURRENT_USER;
  const variant = isCurrentUser ? "muted" : item.role === "assistant" ? "ghost" : "tinted";

  return (
    <MessageScrollerItem messageId={item.id} isScrollAnchor={item.isScrollAnchor ?? false}>
      <Message align={isCurrentUser ? "end" : "start"}>
        <MessageContent>
          {!isCurrentUser && <MessageHeader>{item.sender}</MessageHeader>}
          <Bubble align={isCurrentUser ? "end" : "start"} variant={variant}>
            <BubbleContent>{item.text}</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

function GroupChatMarker({
  item,
  isScrollAnchor = false,
}: {
  item: Extract<GroupChatItem, { type: "event" }>;
  isScrollAnchor?: boolean | undefined;
}) {
  return (
    <MessageScrollerItem isScrollAnchor={isScrollAnchor}>
      <Marker variant="separator">
        <MarkerContent>{item.text}</MarkerContent>
      </Marker>
    </MessageScrollerItem>
  );
}

export function MessageScrollerGroupChat() {
  const [demoKey, setDemoKey] = React.useState(0);
  const [rockyTurn, setRockyTurn] = React.useState<"idle" | "marker" | "message">("idle");
  const items =
    rockyTurn === "message"
      ? [...INITIAL_ITEMS, ROCKY_MARKER, ROCKY_MESSAGE]
      : rockyTurn === "marker"
        ? [...INITIAL_ITEMS, ROCKY_MARKER]
        : INITIAL_ITEMS;
  const buttonLabel = rockyTurn === "idle" ? "Add Rocky" : "Send Message as Rocky";
  const isComplete = rockyTurn === "message";

  return (
    <div className="relative flex flex-col gap-4">
      <Card className="mx-auto h-140 w-full max-w-sm gap-0">
        <CardHeader className="gap-1 border-b">
          <CardTitle>Group Chat</CardTitle>
          <CardDescription>
            A group chat with several participants and an assistant. The Marker is marked as a turn.
          </CardDescription>
          <CardAction>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Reset conversation"
                  disabled={rockyTurn === "idle"}
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRockyTurn("idle");
                    setDemoKey((key) => key + 1);
                  }}
                >
                  <RotateCwIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset</p>
              </TooltipContent>
            </Tooltip>
          </CardAction>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 p-0">
          <MessageScrollerProvider>
            <MessageScroller key={demoKey}>
              <MessageScrollerViewport>
                <MessageScrollerContent className="p-6">
                  {items.map((item) =>
                    item.type === "message" ? (
                      <GroupChatMessage key={item.id} item={item} />
                    ) : (
                      <GroupChatMarker key={item.id} item={item} isScrollAnchor={item.isScrollAnchor} />
                    ),
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 border-t">
          <Button
            className="w-full"
            disabled={isComplete}
            type="button"
            variant="secondary"
            onClick={() => {
              setRockyTurn((turn) => (turn === "idle" ? "marker" : "message"));
            }}
          >
            {buttonLabel}
          </Button>
          <p className="text-xs text-ui-muted">
            {rockyTurn === "idle"
              ? "This will create a marker and make it the anchor"
              : "Now send Rocky's reply into the conversation"}
          </p>
        </CardFooter>
      </Card>
      <div className="mx-auto max-w-sm px-0.5 text-center text-xs text-balance text-ui-muted">
        When a user joins, a marker is created. isScrollAnchor on the marker marks it as the next turn.
      </div>
    </div>
  );
}
