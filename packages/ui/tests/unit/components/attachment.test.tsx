import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "#/components/attachment";

describe("attachment", () => {
  describe("Attachment component", () => {
    test("exposes data-slot with default state, size, and orientation", () => {
      render(<Attachment data-testid="attachment" />);

      const attachment = screen.getByTestId("attachment");

      expect(attachment).toHaveAttribute("data-slot", "attachment");
      expect(attachment).toHaveAttribute("data-state", "done");
      expect(attachment).toHaveAttribute("data-size", "default");
      expect(attachment).toHaveAttribute("data-orientation", "horizontal");
    });

    test("reflects state, size, and orientation overrides", () => {
      render(<Attachment data-testid="attachment" orientation="vertical" size="xs" state="error" />);

      const attachment = screen.getByTestId("attachment");

      expect(attachment).toHaveAttribute("data-state", "error");
      expect(attachment).toHaveAttribute("data-size", "xs");
      expect(attachment).toHaveAttribute("data-orientation", "vertical");
    });
  });

  describe("AttachmentAction component", () => {
    test("renders a ghost icon button by default", () => {
      render(<AttachmentAction aria-label="Remove" />);

      const action = screen.getByRole("button", { name: "Remove" });

      expect(action).toHaveAttribute("data-slot", "attachment-action");
      expect(action).toHaveAttribute("data-variant", "ghost");
      expect(action).toHaveAttribute("data-size", "icon-xs");
    });
  });

  describe("AttachmentTrigger component", () => {
    test("defaults to a button type", () => {
      render(<AttachmentTrigger aria-label="Open" />);
      expect(screen.getByRole("button", { name: "Open" })).toHaveAttribute("type", "button");
    });

    test("renders as a child element when asChild is set", () => {
      render(
        <AttachmentTrigger asChild>
          <a data-testid="trigger" href="#file">
            Open
          </a>
        </AttachmentTrigger>,
      );

      const trigger = screen.getByTestId("trigger");

      expect(trigger.tagName).toBe("A");
      expect(trigger).not.toHaveAttribute("type");
    });
  });

  describe("sub-components", () => {
    test.each([
      ["attachment-media", AttachmentMedia],
      ["attachment-content", AttachmentContent],
      ["attachment-title", AttachmentTitle],
      ["attachment-description", AttachmentDescription],
      ["attachment-actions", AttachmentActions],
      ["attachment-group", AttachmentGroup],
    ])("%s exposes its data-slot", (slot, Component) => {
      render(<Component data-testid="part" />);
      expect(screen.getByTestId("part")).toHaveAttribute("data-slot", slot);
    });
  });

  describe("Accessibility", () => {
    test("has no accessibility violations", async () => {
      const { container } = render(
        <Attachment>
          <AttachmentMedia />
          <AttachmentContent>
            <AttachmentTitle>report.pdf</AttachmentTitle>
            <AttachmentDescription>1.2 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove" />
          </AttachmentActions>
        </Attachment>,
      );

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
