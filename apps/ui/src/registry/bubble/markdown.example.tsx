import { Bubble, BubbleContent } from "@codefast/ui/bubble";

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

export function BubbleMarkdown() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Bubble align="end" variant="muted">
        <BubbleContent>
          <Paragraphs text="Hello! Are you actually thinking?" />
        </BubbleContent>
      </Bubble>
      <Bubble variant="ghost">
        <BubbleContent>
          <Paragraphs text={ghostText} />
        </BubbleContent>
      </Bubble>
    </div>
  );
}
