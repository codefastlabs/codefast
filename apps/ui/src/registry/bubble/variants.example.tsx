import { Bubble, BubbleContent, BubbleReactions } from "@codefast/ui/bubble";

const ghostText = `Ghost bubbles work for assistant text, markdown, and other content that should not be framed.

This is perfect for assistant messages that should not have a frame and can take the full width of the container. You can also render code in it.

Ghost bubbles are full width and can take the full width of the container.`;

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((paragraph) => (
        <p key={paragraph} className="whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}
    </>
  );
}

export function BubbleVariants() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-12">
      <Bubble>
        <BubbleContent>This is the default primary bubble.</BubbleContent>
      </Bubble>
      <Bubble align="end" variant="secondary">
        <BubbleContent>This is the secondary variant.</BubbleContent>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>This one is muted. It uses a lower emphasis color for the chat bubble.</BubbleContent>
        <BubbleReactions aria-label="Reaction: thumbs up" role="img">
          <span>👍</span>
        </BubbleReactions>
      </Bubble>
      <Bubble align="end" variant="tinted">
        <BubbleContent>This one is tinted. The tint is a softer color derived from the primary color.</BubbleContent>
      </Bubble>
      <Bubble variant="outline">
        <BubbleContent>We can also use an outlined variant.</BubbleContent>
      </Bubble>
      <Bubble align="end" variant="destructive">
        <BubbleContent>Or a destructive variant with a reaction.</BubbleContent>
        <BubbleReactions aria-label="Reaction: fire" role="img">
          <span>🔥</span>
        </BubbleReactions>
      </Bubble>
      <Bubble variant="ghost">
        <BubbleContent>
          <Paragraphs text={ghostText} />
        </BubbleContent>
      </Bubble>
    </div>
  );
}
