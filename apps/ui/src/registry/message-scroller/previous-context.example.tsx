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
import { Slider } from "@codefast/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@codefast/ui/tooltip";
import { ArrowUpIcon, GlobeIcon, ImageIcon, PaperclipIcon, PlusIcon, RotateCwIcon, TelescopeIcon } from "lucide-react";
import * as React from "react";

interface Turn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const DEFAULT_PEEK = 64;
const INITIAL_COUNT = 2;

const TRANSCRIPT: Array<Turn> = [
  {
    id: "context-jarring",
    role: "user",
    text: "I'm building a chat for our app and the scroll behavior is driving me nuts. Every time the AI streams a reply, the whole thread jumps around.",
  },
  {
    id: "context-jarring-a",
    role: "assistant",
    text: "That's the classic streaming scroll problem. Wrap your message list in MessageScroller and turn on autoScroll — the viewport pins to the bottom as tokens arrive, so users always see the latest text land in place.\n\nThe important part: it only auto-scrolls while the reader is already at the bottom. The moment they scroll up to read something earlier, auto-scroll backs off and their position is preserved.",
  },
  {
    id: "context-reload",
    role: "user",
    text: "Okay, but when someone sends a new message the view still feels jarring — like the whole conversation reloads from the top.",
  },
  {
    id: "context-reload-a",
    role: "assistant",
    text: "MessageScrollerItem fixes that with turn anchoring. Set isScrollAnchor on the turn that should settle near the top instead of blindly snapping to the document bottom.\n\nIt also leaves a small peek of the previous exchange visible above the anchor, so context isn't lost.",
  },
  {
    id: "context-scrolled-up",
    role: "user",
    text: "And if they've scrolled up to re-read an older answer? I don't want to yank them back down.",
  },
  {
    id: "context-scrolled-up-a",
    role: "assistant",
    text: "You won't. Auto-scroll only runs when the viewport is already pinned to the bottom, so scrolling up is a deliberate opt-out — their place in the thread stays put even as new tokens keep arriving below.\n\nWhen there is content they haven't seen yet, MessageScrollerButton appears at the bottom of the viewport.",
  },
];

export function MessageScrollerPreviousContext() {
  const [demoKey, setDemoKey] = React.useState(0);
  const [peek, setPeek] = React.useState(DEFAULT_PEEK);
  const [count, setCount] = React.useState(INITIAL_COUNT);
  const messages = TRANSCRIPT.slice(0, count);
  const nextMessage = TRANSCRIPT[count];

  return (
    <MessageScrollerProvider key={demoKey} scrollMargin={24} scrollPreviousItemPeek={peek}>
      <div className="relative flex flex-col gap-4">
        <Card className="mx-auto h-140 w-full max-w-sm gap-0">
          <CardHeader className="gap-1 border-b">
            <CardTitle>Keeping Context Visible</CardTitle>
            <CardDescription>New turns keep part of the previous reply in view.</CardDescription>
            <CardAction>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Reset context example"
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setCount(INITIAL_COUNT);
                      setPeek(DEFAULT_PEEK);
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
          <CardContent className="flex-1 overflow-hidden p-0">
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="p-6">
                  {messages.map((message) => {
                    const isUser = message.role === "user";

                    return (
                      <MessageScrollerItem key={message.id} messageId={message.id} isScrollAnchor={isUser}>
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
                      <span className="text-ui-muted">No messages queued. Reset the context.</span>
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
                  <div className="flex w-28 items-center gap-2">
                    <span className="text-xs text-ui-muted tabular-nums">{peek}px</span>
                    <Slider
                      aria-label="Previous context peek"
                      max={128}
                      min={64}
                      step={1}
                      value={[peek]}
                      onValueChange={(value) => {
                        setPeek(value[0] ?? DEFAULT_PEEK);
                      }}
                    />
                  </div>
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
          Adjust the slider and send. Observe the previous message peek.
        </div>
      </div>
    </MessageScrollerProvider>
  );
}
