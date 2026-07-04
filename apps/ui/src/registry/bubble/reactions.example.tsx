import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@codefast/ui/bubble";

export function BubbleReactionsExample() {
  return (
    <BubbleGroup className="w-full max-w-sm">
      <Bubble align="end">
        <BubbleContent>Shipped it 🚀</BubbleContent>
        <BubbleReactions>🎉 3</BubbleReactions>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>Nice work!</BubbleContent>
        <BubbleReactions align="start" side="top">
          👏 2
        </BubbleReactions>
      </Bubble>
    </BubbleGroup>
  );
}
