import { Bubble, BubbleContent, BubbleReactions } from "@codefast/ui/bubble";
import { Button } from "@codefast/ui/button";
import { toast } from "@codefast/ui/sonner";

export function BubbleReactionsDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-12">
      <Bubble align="end" variant="muted">
        <BubbleContent>I don&apos;t need tests, I know my code works.</BubbleContent>
        <BubbleReactions align="start" aria-label="Reactions: thumbs up, surprised" role="img">
          <span>👍</span>
          <span>😮</span>
        </BubbleReactions>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>
          Bold. Fine I&apos;ll add some tests. I&apos;ll let you know when they&apos;re done.
        </BubbleContent>
        <BubbleReactions aria-label="Reactions: eyes, rocket, and 2 more" role="img">
          <span>👀</span>
          <span>🚀</span>
          <span>+2</span>
        </BubbleReactions>
      </Bubble>
      <Bubble align="end" variant="default">
        <BubbleContent>Tests passed on the first try. All 142 of them. Looking good!</BubbleContent>
        <BubbleReactions align="start" aria-label="Reactions: party popper, clapping hands" role="img" side="top">
          <span>🎉</span>
          <span>👏</span>
        </BubbleReactions>
      </Bubble>
      <Bubble variant="destructive">
        <BubbleContent>Are you sure I can run this command?</BubbleContent>
        <BubbleReactions>
          <Button
            onClick={() => {
              toast.success("You clicked yes, running command...");
            }}
            size="xs"
            variant="ghost"
          >
            Yes, run it
          </Button>
        </BubbleReactions>
      </Bubble>
    </div>
  );
}
