import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, within } from "storybook/test";

import { Button } from "#/components/button";
import { Toaster, toast } from "#/components/sonner";

/**
 * Sonner pairs a single `<Toaster />` mount with the imperative `toast()`
 * function. Demoed via `render` (see Accordion) rather than a bound component.
 */
const meta = {
  title: "Feedback/Sonner",
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap justify-center gap-2">
      <Toaster />
      <Button variant="outline" onClick={() => toast("Event has been created.")}>
        Show toast
      </Button>
    </div>
  ),
};

export const Types: Story = {
  render: () => (
    <div className="flex flex-wrap justify-center gap-2">
      <Toaster />
      <Button variant="outline" onClick={() => toast("Event has been created")}>
        Default
      </Button>
      <Button variant="outline" onClick={() => toast.success("Event has been created")}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.info("Be at the area 10 minutes before the event time")}>
        Info
      </Button>
      <Button variant="outline" onClick={() => toast.warning("Event start time cannot be earlier than 8am")}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.error("Event has not been created")}>
        Error
      </Button>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex flex-wrap justify-center gap-2">
      <Toaster />
      <Button
        variant="outline"
        onClick={() => toast.success("Profile updated.", { description: "Your changes have been saved." })}
      >
        Show toast
      </Button>
    </div>
  ),
};

/** Interaction test — toasts render to `document.body`, so assert via `screen`. */
export const ShowsToastOnClick: Story = {
  render: Default.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /show toast/i });

    await userEvent.click(button);
    await expect(await screen.findByText("Event has been created.")).toBeInTheDocument();
  },
};
