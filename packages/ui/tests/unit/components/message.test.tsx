import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "#/components/message";

describe("message", () => {
  describe("Message component", () => {
    test("exposes the message data-slot and defaults to start alignment", () => {
      render(<Message data-testid="message" />);

      const message = screen.getByTestId("message");

      expect(message).toHaveAttribute("data-slot", "message");
      expect(message).toHaveAttribute("data-align", "start");
    });

    test("reverses the row when aligned to the end", () => {
      render(<Message align="end" data-testid="message" />);

      const message = screen.getByTestId("message");

      expect(message).toHaveAttribute("data-align", "end");
      expect(message).toHaveClass("data-[align=end]:flex-row-reverse");
    });

    test("merges a custom className", () => {
      render(<Message className="custom-class" data-testid="message" />);
      expect(screen.getByTestId("message")).toHaveClass("custom-class");
    });
  });

  describe("sub-components", () => {
    test.each([
      ["message-group", MessageGroup],
      ["message-avatar", MessageAvatar],
      ["message-content", MessageContent],
      ["message-header", MessageHeader],
      ["message-footer", MessageFooter],
    ])("%s exposes its data-slot", (slot, Component) => {
      render(<Component data-testid="part" />);
      expect(screen.getByTestId("part")).toHaveAttribute("data-slot", slot);
    });
  });

  describe("Accessibility", () => {
    test("has no accessibility violations", async () => {
      const { container } = render(
        <MessageGroup>
          <Message>
            <MessageAvatar />
            <MessageContent>
              <MessageHeader>Ada</MessageHeader>
              <p>Hello there</p>
              <MessageFooter>Delivered</MessageFooter>
            </MessageContent>
          </Message>
        </MessageGroup>,
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
