import { Bubble, BubbleContent } from "@codefast/ui/bubble";

export function BubbleInteractive() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Bubble variant="outline">
        <BubbleContent asChild>
          <button type="button">Retry sending</button>
        </BubbleContent>
      </Bubble>
      <Bubble align="end" variant="secondary">
        <BubbleContent asChild>
          <a href="#thread">Open thread</a>
        </BubbleContent>
      </Bubble>
    </div>
  );
}
