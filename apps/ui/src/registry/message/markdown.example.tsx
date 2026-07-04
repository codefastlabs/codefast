import { Bubble, BubbleContent } from "@codefast/ui/bubble";
import { Message, MessageContent } from "@codefast/ui/message";

const response = `Here's how to render markdown in a message:

1. Render assistant text through Markdown.
2. Keep user messages as plain text.
3. Use a ghost bubble so the response is unframed.`;

export function MessageMarkdown() {
  const paragraphs = response.split("\n\n");

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Message align="end">
        <MessageContent>
          <Bubble>
            <BubbleContent>How do I render markdown in a message?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageContent>
          <Bubble variant="ghost">
            <BubbleContent>
              {paragraphs.map((paragraph) => (
                <p key={paragraph} className="whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </div>
  );
}
