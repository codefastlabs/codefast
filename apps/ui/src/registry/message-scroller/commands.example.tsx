import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Button } from "@codefast/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@codefast/ui/dropdown-menu";
import { Message, MessageContent } from "@codefast/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
} from "@codefast/ui/message-scroller";

interface Turn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const TRANSCRIPT: Array<Turn> = [
  {
    id: "command-activation",
    role: "user",
    text: "We're seeing activation dip after workspace creation. Can you help me find the likely step?",
  },
  {
    id: "command-activation-a",
    role: "assistant",
    text: "The sharpest drop is between creating the workspace and inviting the first teammate.\n\nWorkspace creation is still healthy, but the invite step is where users pause. That suggests the product is asking for collaboration before the user has enough confidence in the workspace.",
  },
  {
    id: "command-compare",
    role: "user",
    text: "What should I compare before we change the onboarding flow?",
  },
  {
    id: "command-compare-a",
    role: "assistant",
    text: "Compare three cohorts:\n\n1. Users who choose a template before inviting teammates.\n2. Users who start from a blank workspace.\n3. Users who skip invites and return within 24 hours.\n\nIf template users invite faster, the fix is probably better first-run guidance rather than a louder invite prompt.",
  },
  {
    id: "command-experiment",
    role: "user",
    text: "Can you turn that into an experiment?",
  },
  {
    id: "command-experiment-a",
    role: "assistant",
    text: "Yes. Create a variant that shows a short checklist after workspace creation:\n\n- Pick a template.\n- Add one project detail.\n- Invite a teammate when the workspace has context.\n\nMeasure first invite completion, 24-hour return rate, and whether teams create a second project.",
  },
  {
    id: "command-risk",
    role: "user",
    text: "What's the risk if we delay the invite prompt?",
  },
  {
    id: "command-risk-a",
    role: "assistant",
    text: "The main risk is reducing team creation for accounts that already know who they want to invite.\n\nTo protect that path, keep the invite action visible in the header and only change the primary empty-state guidance. That gives confident teams a direct route without forcing uncertain users through the invite step too early.",
  },
];

const USER_TURNS = TRANSCRIPT.filter((turn) => turn.role === "user");

function trimText(text: string): string {
  return text.length > 42 ? `${text.slice(0, 39)}...` : text;
}

function CommandMenu() {
  const { scrollToMessage } = useMessageScroller();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="secondary">
          Jump to...
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" side="bottom">
        <DropdownMenuLabel>Conversations</DropdownMenuLabel>
        {USER_TURNS.map((turn) => (
          <DropdownMenuItem
            key={turn.id}
            onSelect={() => {
              scrollToMessage(turn.id, { align: "start", behavior: "smooth" });
            }}
          >
            <span className="line-clamp-1 min-w-0">{trimText(turn.text)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MessageScrollerCommands() {
  return (
    <MessageScrollerProvider defaultScrollPosition="end">
      <div className="relative flex flex-col gap-4">
        <Card className="mx-auto h-140 w-full max-w-sm gap-0">
          <CardHeader className="gap-1 border-b">
            <CardTitle>Commands</CardTitle>
            <CardDescription>Drive the transcript from outside.</CardDescription>
            <CardAction>
              <CommandMenu />
            </CardAction>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="p-6">
                  {TRANSCRIPT.map((turn) => {
                    const isUser = turn.role === "user";

                    return (
                      <MessageScrollerItem key={turn.id} messageId={turn.id} scrollAnchor={isUser}>
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
        <div className="mx-auto max-w-sm px-0.5 text-center text-xs text-balance text-ui-muted">
          Use the controls to jump to any message in the conversation.
        </div>
      </div>
    </MessageScrollerProvider>
  );
}
