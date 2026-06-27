import { expect, fn, screen } from "storybook/test";

import { Button } from "#/components/button";
import { Toaster, toast } from "#/components/sonner";

import preview from "../.storybook/preview";

/**
 * Sonner pairs a single `<Toaster />` mount (the styled toast region) with the
 * imperative `toast()` function fired from anywhere — no context threading.
 * The `<Toaster />` root forwards every `sonner` `ToasterProps`, so its enum
 * (`position`) and boolean (`expand`, `closeButton`, `richColors`) props drive
 * the Controls below. Content here is authored for Storybook, not synced with
 * the apps/web registry.
 */
const meta = preview.meta({
  args: { closeButton: false, expand: false, position: "bottom-right", richColors: false },
  argTypes: {
    closeButton: { control: "boolean" },
    expand: { control: "boolean" },
    position: {
      control: "select",
      options: ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"],
    },
    richColors: { control: "boolean" },
  },
  component: Toaster,
  parameters: {
    controls: { include: ["position", "expand", "closeButton", "richColors"] },
    docs: {
      description: {
        component: [
          "An opinionated toast notification region; mount one `<Toaster />` and fire toasts imperatively with `toast()`.",
          "",
          "Call `toast()` / `toast.success()` / `toast.error()` etc. from anywhere — no context or props threading required.",
          "",
          "**Anatomy:** one `<Toaster />` mount + imperative `toast()` calls.",
        ].join("\n"),
      },
    },
  },
  title: "Feedback/Sonner",
});

export const Default = meta.story({
  render: (args) => (
    <div className="flex flex-wrap justify-center gap-2">
      <Toaster {...args} />
      <Button variant="outline" onClick={() => toast("Event has been created.")}>
        Show toast
      </Button>
    </div>
  ),
});

export const RichColors = meta.story({
  args: { richColors: true },
  render: Default.input.render,
});

export const Expanded = meta.story({
  args: { expand: true },
  render: Default.input.render,
});

/** A different composition: one trigger per `toast` severity level. */
export const Types = meta.story({
  render: (args) => (
    <div className="flex flex-wrap justify-center gap-2">
      <Toaster {...args} />
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

/** A different composition: a toast carrying a secondary description line. */
export const WithDescription = meta.story({
  render: (args) => (
    <div className="flex flex-wrap justify-center gap-2">
      <Toaster {...args} />
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

/** A different composition: a toast with an action button that runs a callback. */
export const WithAction = meta.story({
  render: (args) => (
    <div className="flex flex-wrap justify-center gap-2">
      <Toaster {...args} />
      <Button
        variant="outline"
        onClick={() =>
          toast("Event has been created", {
            action: { label: "Undo", onClick: fn() },
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
ShowsToastOnClick.test("renders a toast into the document on click", async ({ canvas, userEvent }) => {
  const button = canvas.getByRole("button", { name: /show toast/i });

  await userEvent.click(button);
  await expect(await screen.findByText("Event has been created.")).toBeInTheDocument();
});

WithAction.test("toast exposes its action button", async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole("button", { name: /show toast/i }));

  await expect(await screen.findByRole("button", { name: "Undo" })).toBeInTheDocument();
});
