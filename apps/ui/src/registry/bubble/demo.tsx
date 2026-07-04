import { Bubble, BubbleContent } from "@codefast/ui/bubble";

export function BubbleDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Bubble variant="muted">
        <BubbleContent>Hey! Are we still on for tomorrow?</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>Absolutely — 10am works for me.</BubbleContent>
      </Bubble>
    </div>
  );
}
