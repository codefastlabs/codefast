import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@codefast/ui/hover-card";
import { Message, MessageContent } from "@codefast/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerVisibility,
} from "@codefast/ui/message-scroller";

interface Turn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const TRANSCRIPT: Array<Turn> = [
  {
    id: "vis-brief",
    role: "user",
    text: "Review the incident handoff and tell me what to read first.",
  },
  {
    id: "vis-brief-a",
    role: "assistant",
    text: "Start with the summary and the impact section. The regression affected the upload queue, but the recovery path completed for every queued job.",
  },
  {
    id: "vis-impact",
    role: "user",
    text: "What was the customer impact?",
  },
  {
    id: "vis-impact-a",
    role: "assistant",
    text: "Impact was limited to delayed processing.\n\nNo records were dropped, and the reconciliation worker confirmed each retry batch. Support saw confusion from two customers, but there were no checkout or billing errors.",
  },
  {
    id: "vis-actions",
    role: "user",
    text: "What actions are open?",
  },
  {
    id: "vis-actions-a",
    role: "assistant",
    text: "Keep the retry window enabled until the next deploy, then add a queue-depth alert as the long-term fix.\n\nThe alert should fire on sustained queue growth, not a single short spike.",
  },
  {
    id: "vis-checklist",
    role: "user",
    text: "Give me the follow-up checklist.",
  },
  {
    id: "vis-checklist-a",
    role: "assistant",
    text: "After that, compare the queue recovery graph with the deploy timeline so the handoff shows exactly when processing returned to baseline. That makes it easier for support and engineering to answer the same customer questions without re-reading the whole incident thread.\n\nI would also add a short owner note beside each follow-up item. The checklist is small, but ownership keeps the retry-window decision, alert tuning, and support macro from drifting into separate follow-up conversations.\n\nKeep the retry window enabled until the next deploy, then add a queue-depth alert as the long-term fix.\n\nThe alert should fire on sustained queue growth, not a single short spike.",
  },
];

const USER_TURNS = TRANSCRIPT.filter((turn) => turn.role === "user");

function trimText(text: string): string {
  return text.length > 42 ? `${text.slice(0, 39)}...` : text;
}

function TranscriptOutline() {
  const { scrollToMessage } = useMessageScroller();
  const { currentAnchorId } = useMessageScrollerVisibility();

  return (
    <HoverCard closeDelay={0} openDelay={0}>
      <HoverCardTrigger asChild>
        <button
          aria-label="Open transcript outline"
          className="flex h-9 w-9 flex-col items-center justify-center gap-1 rounded-md transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          type="button"
        >
          {USER_TURNS.map((turn) => (
            <span
              key={turn.id}
              className="h-0.5 w-4 rounded-full bg-muted-foreground/40 data-[current=true]:bg-foreground"
              data-current={turn.id === currentAnchorId}
            />
          ))}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        align="center"
        className="flex w-64 flex-col gap-1 rounded-2xl p-1"
        side="left"
        sideOffset={-28}
      >
        {USER_TURNS.map((turn) => (
          <button
            key={turn.id}
            aria-current={currentAnchorId === turn.id ? "location" : undefined}
            className="flex min-h-7 items-center rounded-xl px-2 py-1.5 text-left text-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground aria-current:bg-accent aria-current:text-accent-foreground"
            type="button"
            onClick={() => {
              scrollToMessage(turn.id, { align: "start", behavior: "smooth" });
            }}
          >
            <span className="line-clamp-1 min-w-0">{trimText(turn.text)}</span>
          </button>
        ))}
      </HoverCardContent>
    </HoverCard>
  );
}

export function MessageScrollerVisibility() {
  return (
    <MessageScrollerProvider scrollMargin={12}>
      <div className="relative flex flex-col gap-4">
        <div className="relative mx-auto w-full max-w-sm">
          <Card className="h-140 w-full gap-0">
            <CardHeader className="gap-1 border-b">
              <CardTitle>Transcript Outline</CardTitle>
              <CardDescription>Track the current anchored turn.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent className="p-6">
                    {TRANSCRIPT.map((turn) => {
                      const isUser = turn.role === "user";

                      return (
                        <MessageScrollerItem key={turn.id} messageId={turn.id} isScrollAnchor={isUser}>
                          <Message align={isUser ? "end" : "start"}>
                            <MessageContent>
                              <Bubble align={isUser ? "end" : "start"} variant={isUser ? "muted" : "ghost"}>
                                <BubbleContent className="space-y-2">
                                  {turn.text
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
          </Card>
          <div className="absolute top-1/2 -right-12 -translate-y-1/2">
            <TranscriptOutline />
          </div>
        </div>
        <div className="mx-auto max-w-sm px-0.5 text-center text-xs text-ui-muted">
          Open the outline to jump between anchored turns as you read.
        </div>
      </div>
    </MessageScrollerProvider>
  );
}
