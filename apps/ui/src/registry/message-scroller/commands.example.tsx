import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Button } from "@codefast/ui/button";
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
  { id: "activation", role: "user", text: "Activation dips after workspace creation — where's the likely step?" },
  {
    id: "activation-a",
    role: "assistant",
    text: "The sharpest drop is between creating the workspace and inviting the first teammate.",
  },
  { id: "compare", role: "user", text: "What should I compare before changing onboarding?" },
  {
    id: "compare-a",
    role: "assistant",
    text: "Compare template-first users, blank-workspace users, and invite-skippers who return within a day.",
  },
  { id: "experiment", role: "user", text: "Can you turn that into an experiment?" },
  {
    id: "experiment-a",
    role: "assistant",
    text: "Show a short checklist after workspace creation and measure first-invite completion.",
  },
  { id: "risk", role: "user", text: "What's the risk if we delay the invite prompt?" },
  {
    id: "risk-a",
    role: "assistant",
    text: "Confident teams may invite less — keep the invite action visible in the header.",
  },
];

const USER_TURNS = TRANSCRIPT.filter((turn) => turn.role === "user");

function JumpMenu() {
  const { scrollToMessage } = useMessageScroller();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" type="button" variant="secondary">
          Jump to…
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Questions</DropdownMenuLabel>
        {USER_TURNS.map((turn) => (
          <DropdownMenuItem
            key={turn.id}
            onSelect={() => {
              scrollToMessage(turn.id, { align: "start", behavior: "smooth" });
            }}
          >
            <span className="line-clamp-1 min-w-0">{turn.text}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MessageScrollerCommands() {
  return (
    <MessageScrollerProvider defaultScrollPosition="end">
      <div className="flex w-full max-w-sm flex-col gap-2">
        <JumpMenu />
        <MessageScroller className="h-72 rounded-xl border p-2">
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {TRANSCRIPT.map((turn) => {
                const isUser = turn.role === "user";

                return (
                  <MessageScrollerItem key={turn.id} messageId={turn.id} scrollAnchor={isUser}>
                    <Message align={isUser ? "end" : "start"}>
                      <MessageContent>
                        <Bubble align={isUser ? "end" : "start"} variant={isUser ? "default" : "muted"}>
                          <BubbleContent>{turn.text}</BubbleContent>
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
      </div>
    </MessageScrollerProvider>
  );
}
