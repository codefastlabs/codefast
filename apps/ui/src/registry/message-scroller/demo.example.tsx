import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Button } from "@codefast/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@codefast/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@codefast/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@codefast/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupButton } from "@codefast/ui/input-group";
import { Message, MessageContent } from "@codefast/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@codefast/ui/message-scroller";
import { Tooltip, TooltipContent, TooltipTrigger } from "@codefast/ui/tooltip";
import {
  ArrowUpIcon,
  GlobeIcon,
  ImageIcon,
  MessageCircleDashedIcon,
  PaperclipIcon,
  PlusIcon,
  RotateCwIcon,
  TelescopeIcon,
} from "lucide-react";
import * as React from "react";

interface Turn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const TRANSCRIPT: Array<Turn> = [
  {
    id: "demo-jarring",
    role: "user",
    text: "I'm building a chat for our app and the scroll behavior is driving me nuts. Every time the AI streams a reply, the whole thread jumps around.",
  },
  {
    id: "demo-jarring-a",
    role: "assistant",
    text: "That's the classic streaming scroll problem. Wrap your message list in MessageScroller and turn on autoScroll — the viewport pins to the bottom as tokens arrive, so users always see the latest text land in place.\n\nThe important part: it only auto-scrolls while the reader is already at the bottom. The moment they scroll up to read something earlier, auto-scroll backs off and their position is preserved.",
  },
  {
    id: "demo-reload",
    role: "user",
    text: "Okay, but when someone sends a new message the view still feels jarring — like the whole conversation reloads from the top.",
  },
  {
    id: "demo-reload-a",
    role: "assistant",
    text: "MessageScrollerItem fixes that with turn anchoring. Set scrollAnchor on the turn that should settle near the top instead of blindly snapping to the document bottom.\n\nIt also leaves a small peek of the previous exchange visible above the anchor, so context isn't lost.",
  },
  {
    id: "demo-scrolled-up",
    role: "user",
    text: "And if they've scrolled up to re-read an older answer? I don't want to yank them back down.",
  },
  {
    id: "demo-scrolled-up-a",
    role: "assistant",
    text: "You won't. Auto-scroll only runs when the viewport is already pinned to the bottom, so scrolling up is a deliberate opt-out — their place in the thread stays put even as new tokens keep arriving below.\n\nWhen there is content they haven't seen yet, MessageScrollerButton appears at the bottom of the viewport. One tap jumps them back to the newest message and re-engages auto-scroll.",
  },
  {
    id: "demo-a11y",
    role: "user",
    text: "Last one — does this work with assistive tech?",
  },
  {
    id: "demo-a11y-a",
    role: "assistant",
    text: 'MessageScrollerContent sets role="log" and aria-relevant="additions" by default, so screen readers announce new messages as they stream in.\n\nThe scroll button is a real button with an sr-only label, and it\'s removed from the tab order when you\'re already at the bottom — no ghost focus stops.',
  },
];

export function MessageScrollerDemo() {
  const [count, setCount] = React.useState(0);
  const messages = TRANSCRIPT.slice(0, count);
  const nextMessage = TRANSCRIPT[count];

  return (
    <MessageScrollerProvider autoScroll>
      <div className="relative flex flex-col gap-4">
        <Card className="mx-auto h-140 w-full max-w-sm gap-0">
          <CardHeader className="gap-1 border-b">
            <CardTitle>New Chat</CardTitle>
            <CardDescription>How can I help you today?</CardDescription>
            <CardAction>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Reset conversation"
                    disabled={count === 0}
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setCount(0);
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
          <CardContent className="flex-1 overflow-hidden p-0">
            {messages.length === 0 ? (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageCircleDashedIcon />
                  </EmptyMedia>
                  <EmptyTitle>Morning, codefast!</EmptyTitle>
                  <EmptyDescription>
                    What are we working on today? Press send to start a new conversation.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent className="p-6">
                    {messages.map((message) => {
                      const isUser = message.role === "user";

                      return (
                        <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={isUser}>
                          <Message align={isUser ? "end" : "start"}>
                            <MessageContent>
                              <Bubble align={isUser ? "end" : "start"} variant={isUser ? "muted" : "ghost"}>
                                <BubbleContent className="space-y-2">
                                  {message.text
                                    .split(/\n\s*\n/)
                                    .map((paragraph) => paragraph.trim())
                                    .filter(Boolean)
                                    .map((paragraph) => (
                                      <p key={paragraph} className="whitespace-pre-wrap">
                                        {paragraph}
                                      </p>
                                    ))}
                                </BubbleContent>
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
            )}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <form
              className="w-full"
              onSubmit={(event) => {
                event.preventDefault();

                if (!nextMessage) {
                  return;
                }

                setCount((value) => value + 1);
              }}
            >
              <InputGroup>
                <div className="h-14 w-full px-3 py-2.5">
                  <span className="line-clamp-2 text-ui-fg">
                    {nextMessage ? (
                      nextMessage.text
                    ) : (
                      <span className="text-ui-muted">No messages queued. Reset the conversation.</span>
                    )}
                  </span>
                </div>
                <InputGroupAddon align="block-end" className="pt-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <InputGroupButton aria-label="Add files" size="icon-sm" type="button" variant="outline">
                        <PlusIcon />
                      </InputGroupButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44" side="top">
                      <DropdownMenuItem>
                        <PaperclipIcon />
                        Add Photos &amp; Files
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <ImageIcon />
                        Create Image
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <TelescopeIcon />
                        Deep Research
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <GlobeIcon />
                        Web Search
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <InputGroupButton
                    className="ml-auto"
                    disabled={!nextMessage}
                    size="icon-sm"
                    type="submit"
                    variant="default"
                  >
                    <ArrowUpIcon />
                    <span className="sr-only">Send</span>
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </form>
          </CardFooter>
        </Card>
        <div className="px-0.5 text-center text-xs text-ui-muted">
          Demo is read only. Press send to reveal each turn.
        </div>
      </div>
    </MessageScrollerProvider>
  );
}
