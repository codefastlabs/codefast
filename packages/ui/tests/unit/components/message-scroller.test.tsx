import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import type { ReactNode } from "react";

import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "#/components/message-scroller";

// jsdom has no layout, so these cover rendering, slot wiring, and the
// primitive context contract; the scroll math is covered by the geometry unit
// tests under tests/unit/lib/message-scroller.
function renderScroller(children: ReactNode) {
  return render(
    <MessageScrollerProvider>
      <MessageScroller data-testid="scroller">
        <MessageScrollerViewport data-testid="viewport">
          <MessageScrollerContent data-testid="content">{children}</MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>,
  );
}

describe("message-scroller", () => {
  test("wires the frame, viewport, and content data-slots", () => {
    renderScroller(<MessageScrollerItem data-testid="item">Hello</MessageScrollerItem>);

    expect(screen.getByTestId("scroller")).toHaveAttribute("data-slot", "message-scroller");
    expect(screen.getByTestId("viewport")).toHaveAttribute("data-slot", "message-scroller-viewport");
    expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "message-scroller-content");
    expect(screen.getByTestId("item")).toHaveAttribute("data-slot", "message-scroller-item");
  });

  test("renders the scroll button toward the end by default with an accessible label", () => {
    renderScroller(<MessageScrollerItem>Hello</MessageScrollerItem>);

    const button = screen.getByRole("button", { name: "Scroll to end" });

    expect(button).toHaveAttribute("data-slot", "message-scroller-button");
    expect(button).toHaveAttribute("data-direction", "end");
  });

  test("labels a start-direction button toward the start", () => {
    render(
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              <MessageScrollerItem>Hello</MessageScrollerItem>
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton direction="start" />
        </MessageScroller>
      </MessageScrollerProvider>,
    );

    expect(screen.getByRole("button", { name: "Scroll to start" })).toHaveAttribute("data-direction", "start");
  });

  test("has no accessibility violations", async () => {
    const { container } = renderScroller(
      <>
        <MessageScrollerItem>First</MessageScrollerItem>
        <MessageScrollerItem scrollAnchor>Second</MessageScrollerItem>
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
