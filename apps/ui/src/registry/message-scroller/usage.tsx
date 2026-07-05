import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@codefast/ui/message-scroller";

export function MessageScrollerUsage() {
  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller className="h-72 rounded-lg border">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            {Array.from({ length: 10 }, (_, index) => (
              <MessageScrollerItem key={index}>Message {index + 1}</MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
