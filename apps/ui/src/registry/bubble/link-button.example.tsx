import { Bubble, BubbleContent, BubbleGroup } from "@codefast/ui/bubble";
import { toast } from "@codefast/ui/sonner";

export function BubbleLinkButton() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Bubble variant="muted">
        <BubbleContent>How can I help you today?</BubbleContent>
      </Bubble>
      <BubbleGroup>
        <Bubble align="end" variant="tinted">
          <BubbleContent asChild>
            <button
              onClick={() => {
                toast("You clicked forgot password");
              }}
              type="button"
            >
              I forgot my password
            </button>
          </BubbleContent>
        </Bubble>
        <Bubble align="end" variant="tinted">
          <BubbleContent asChild>
            <button
              onClick={() => {
                toast("You clicked help with subscription");
              }}
              type="button"
            >
              I need help with my subscription
            </button>
          </BubbleContent>
        </Bubble>
        <Bubble align="end" variant="tinted">
          <BubbleContent asChild>
            <button
              onClick={() => {
                toast("You clicked something else. Talk to a human.");
              }}
              type="button"
            >
              Something else. Talk to a human.
            </button>
          </BubbleContent>
        </Bubble>
      </BubbleGroup>
    </div>
  );
}
