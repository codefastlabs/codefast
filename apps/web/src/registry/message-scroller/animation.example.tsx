import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Button } from "@codefast/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@codefast/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@codefast/ui/empty";
import { cn } from "@codefast/ui/lib/utils";
import { Message, MessageContent } from "@codefast/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@codefast/ui/message-scroller";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@codefast/ui/select";
import { ArrowUpIcon, MessageCircleDashedIcon, RotateCwIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type AnimationId = "fade" | "pop" | "tilt";

interface AnimationPreset {
  id: AnimationId;
  name: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const STREAM_DELAY_MS = 15;
const THINK_DELAY_MS = 1000;

const PRESETS: Array<AnimationPreset> = [
  { id: "fade", name: "Fade" },
  { id: "pop", name: "Pop" },
  { id: "tilt", name: "Tilt" },
];

const SCRIPTED_MESSAGES: Array<ChatMessage> = [
  {
    id: "animation-1-user",
    role: "user",
    text: "Can user messages pop in like iMessage without breaking anchoring?",
  },
  {
    id: "animation-1-assistant",
    role: "assistant",
    text: "Yes. Animate the user row with transform and opacity, and let the assistant response settle normally below it. That keeps the row measurement predictable while still giving the newly sent bubble a more tactile entrance.",
  },
  {
    id: "animation-2-user",
    role: "user",
    text: "What makes the animation feel more like iMessage?",
  },
  {
    id: "animation-2-assistant",
    role: "assistant",
    text: "Use a quick spring from the trailing edge: a little scale, a small upward move, and no layout animation. The bubble feels tactile, but the measured row stays predictable, so anchoring and auto-scroll do not have to fight a changing layout.",
  },
  {
    id: "animation-3-user",
    role: "user",
    text: "Can I switch between presets while testing the same thread?",
  },
  {
    id: "animation-3-assistant",
    role: "assistant",
    text: "Yes. Keep the conversation in place while you change the preset, then send the next message to compare the new entrance against the same context.",
  },
];

function getAnimationClassName(preset: AnimationId): string {
  if (preset === "pop") {
    return "animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out";
  }

  if (preset === "tilt") {
    return "animate-in fade-in slide-in-from-bottom-4 spin-in-1 duration-500 ease-out";
  }

  return "animate-in fade-in duration-500 ease-out";
}

export function MessageScrollerAnimation() {
  const [presetId, setPresetId] = useState<AnimationId>("fade");
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const thinkTimeoutRef = useRef<number | null>(null);
  const streamIntervalRef = useRef<number | null>(null);
  const nextMessage = SCRIPTED_MESSAGES.find((turn, index) => index >= messages.length && turn.role === "user");
  const preset = PRESETS.find((item) => item.id === presetId) ?? PRESETS[0]!;

  const clearStreamTimers = useCallback(() => {
    if (thinkTimeoutRef.current !== null) {
      window.clearTimeout(thinkTimeoutRef.current);
      thinkTimeoutRef.current = null;
    }

    if (streamIntervalRef.current !== null) {
      window.clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  }, []);

  useEffect(() => clearStreamTimers, [clearStreamTimers]);

  const streamAssistantTurn = (turn: ChatMessage) => {
    // Chunks keep their trailing whitespace so joining them reproduces the text.
    const chunks = turn.text.split(/(?<=\s)/);
    let visible = 0;

    setMessages((current) => [...current, { ...turn, text: "" }]);
    streamIntervalRef.current = window.setInterval(() => {
      visible += 1;
      const text = chunks.slice(0, visible).join("");

      setMessages((current) => [...current.slice(0, -1), { ...turn, text }]);

      if (visible >= chunks.length) {
        clearStreamTimers();
        setIsStreaming(false);
      }
    }, STREAM_DELAY_MS);
  };

  return (
    <div className="relative flex flex-col gap-4">
      <Card className="mx-auto h-140 w-full max-w-sm gap-0">
        <CardHeader className="border-b">
          <CardTitle>Animation</CardTitle>
          <CardDescription>
            Choose how user messages are animated when they are added to the conversation.
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Button
              aria-label="Reset animated messages"
              disabled={messages.length === 0}
              size="icon"
              type="button"
              variant="outline"
              onClick={() => {
                clearStreamTimers();
                setIsStreaming(false);
                setMessages([]);
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
                <EmptyTitle>No Messages Yet</EmptyTitle>
                <EmptyDescription>Click the button below to send the first message.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <MessageScrollerProvider>
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent aria-busy={isStreaming} className="p-6">
                    {messages.map((message) => {
                      const isUser = message.role === "user";

                      return (
                        <MessageScrollerItem key={message.id} messageId={message.id} isScrollAnchor={isUser}>
                          <Message
                            align={isUser ? "end" : "start"}
                            className={cn(isUser && getAnimationClassName(presetId))}
                          >
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
        <CardFooter className="border-t">
          <Select
            value={presetId}
            onValueChange={(value) => {
              setPresetId(value as AnimationId);
            }}
          >
            <SelectTrigger aria-label="Animation preset">
              <SelectValue>{preset.name}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start" position="popper" side="top">
              <SelectGroup>
                {PRESETS.map((animation) => (
                  <SelectItem key={animation.id} value={animation.id}>
                    {animation.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            className="ml-auto"
            disabled={!nextMessage || isStreaming}
            size="icon"
            type="button"
            onClick={() => {
              if (!nextMessage || isStreaming) {
                return;
              }

              const assistantTurn = SCRIPTED_MESSAGES[SCRIPTED_MESSAGES.indexOf(nextMessage) + 1];

              setMessages((current) => [...current, nextMessage]);

              if (!assistantTurn) {
                return;
              }

              setIsStreaming(true);
              thinkTimeoutRef.current = window.setTimeout(() => {
                thinkTimeoutRef.current = null;
                streamAssistantTurn(assistantTurn);
              }, THINK_DELAY_MS);
            }}
          >
            <ArrowUpIcon />
            <span className="sr-only">Send Message</span>
          </Button>
        </CardFooter>
      </Card>
      <div className="mx-auto max-w-sm px-0.5 text-center text-xs text-balance text-ui-muted">
        Select an animation then click send to see it in action.
      </div>
    </div>
  );
}
