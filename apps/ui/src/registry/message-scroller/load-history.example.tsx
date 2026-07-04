import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Button } from "@codefast/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@codefast/ui/card";
import { Marker, MarkerContent } from "@codefast/ui/marker";
import { Message, MessageContent } from "@codefast/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@codefast/ui/message-scroller";
import { toast } from "@codefast/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@codefast/ui/tooltip";
import { RotateCwIcon } from "lucide-react";
import * as React from "react";

interface Turn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const HISTORY: Array<Turn> = [
  { id: "history-summary", role: "user", text: "Can you summarize the incident channel?" },
  {
    id: "history-summary-a",
    role: "assistant",
    text: "The first alert was a delayed export job. It started backing up around 09:42 UTC and triggered the warning once the retry queue crossed the threshold.\n\nNo customer-facing checkout paths were affected, but exports for larger workspaces were running about 12 minutes behind.",
  },
  { id: "history-checkout", role: "user", text: "Was checkout affected?" },
  {
    id: "history-checkout-a",
    role: "assistant",
    text: "No checkout errors were reported. Payment authorization, order creation, and confirmation emails stayed inside their normal latency bands.\n\nThe only elevated metric was export queue depth, which maps to analytics downloads instead of checkout.",
  },
  { id: "history-deploy", role: "user", text: "What changed in the last deploy?" },
  {
    id: "history-deploy-a",
    role: "assistant",
    text: "Only the export queue worker changed. The deploy moved large CSV jobs onto the shared retry policy, which made each failed attempt hold a worker slot longer than before.\n\nThe app deploy did not include checkout, pricing, or billing API changes.",
  },
  { id: "history-rollback", role: "user", text: "Do we need to roll back?" },
  {
    id: "history-rollback-a",
    role: "assistant",
    text: "Not yet. Queue depth is recovering after we reduced retry concurrency, and the oldest pending job is now under five minutes old.\n\nKeep rollback ready if the queue starts climbing again, but the current trend points toward recovery.",
  },
  { id: "history-watch", role: "user", text: "Keep watching for customer-visible issues." },
  {
    id: "history-watch-a",
    role: "assistant",
    text: "I will watch the queue and support tags for another 15 minutes. I am tracking export failures, delayed download requests, and any support thread that mentions missing reports.\n\nIf those stay quiet through the next batch window, we can close this as an internal degradation.",
  },
];

const INITIAL_VISIBLE_COUNT = 5;

export function MessageScrollerLoadHistory() {
  const [demoKey, setDemoKey] = React.useState(0);
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE_COUNT);
  const visibleMessages = HISTORY.slice(-visibleCount);
  const canLoadHistory = visibleCount < HISTORY.length;

  return (
    <div className="relative flex flex-col gap-4">
      <Card className="mx-auto h-140 w-full max-w-sm gap-0">
        <CardHeader className="gap-1 border-b">
          <CardTitle>Load History</CardTitle>
          <CardDescription>Prepended messages keep your place.</CardDescription>
          <CardAction>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Reset loaded messages"
                  disabled={visibleCount === INITIAL_VISIBLE_COUNT}
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setVisibleCount(INITIAL_VISIBLE_COUNT);
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
          <MessageScrollerProvider>
            <MessageScroller key={demoKey}>
              <MessageScrollerViewport>
                <MessageScrollerContent className="p-6">
                  {visibleMessages.map((message) => {
                    const isUser = message.role === "user";

                    return (
                      <MessageScrollerItem key={message.id} messageId={message.id}>
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
                  <MessageScrollerItem scrollAnchor={false}>
                    <Marker variant="separator">
                      <MarkerContent>End of Conversation</MarkerContent>
                    </Marker>
                  </MessageScrollerItem>
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 border-t">
          <Button
            className="w-full"
            disabled={!canLoadHistory}
            type="button"
            variant="secondary"
            onClick={() => {
              setVisibleCount(HISTORY.length);
              toast("History loaded", {
                description: "Scroll up to see earlier messages.",
              });
            }}
          >
            {canLoadHistory ? "Load History" : "History Loaded"}
          </Button>
          <p className="text-xs text-ui-muted">Restore earlier messages while keeping your place.</p>
        </CardFooter>
      </Card>
      <div className="mx-auto max-w-sm px-0.5 text-center text-xs text-balance text-ui-muted">
        Click Load History to load the entire conversation.
      </div>
    </div>
  );
}
