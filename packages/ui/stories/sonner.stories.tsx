import { expect, screen } from "storybook/test";

import { Button } from "#/components/button";
import { Toaster, toast } from "#/components/sonner";

import preview from "../.storybook/preview";

/**
 * Sonner pairs a single `<Toaster />` mount with the imperative `toast()`
 * function. Demoed via `render` (see Accordion) rather than a bound component.
 */
const meta = preview.meta({
  title: "Feedback/Sonner",
});

export const Default = meta.story({
  render: () => (
    <div className="flex flex-wrap justify-center gap-2">
      <Toaster />
      <Button variant="outline" onClick={() => toast("Event has been created.")}>
        Show toast
      </Button>
    </div>
  ),
});

export const Types = meta.story({
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
});

export const WithDescription = meta.story({
  render: () => (
    <div className="flex flex-wrap justify-center gap-2">
      <Toaster />
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Profile updated.", {
            description: "Your changes have been saved.",
          })
        }
      >
        Show toast
      </Button>
    </div>
  ),
});

export const ShowsToastOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test — toasts render to `document.body`, so assert via `screen`. */
ShowsToastOnClick.test("shows toast on click", async ({ canvas, userEvent }) => {
  const button = canvas.getByRole("button", { name: /show toast/i });

  await userEvent.click(button);
  await expect(await screen.findByText("Event has been created.")).toBeInTheDocument();
});
