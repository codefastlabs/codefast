import { CheckCircle2Icon, InfoIcon, XIcon } from "lucide-react";
import { expect, fn } from "storybook/test";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "#/components/alert";
import { Button } from "#/components/button";

import preview from "../.storybook/preview";

/**
 * Alert — a prop-driven COMPOSITE. The `Alert` root owns the only interesting prop
 * (`variant`), while title/description/action are composed slots. Content here is
 * authored against the component's own public API, independent of the apps/web registry.
 */
const meta = preview.meta({
  args: { variant: "default" },
  argTypes: {
    variant: { control: "radio", options: ["default", "destructive"] },
  },
  component: Alert,
  parameters: {
    controls: { include: ["variant"] },
    docs: {
      description: {
        component: [
          "A callout that draws attention to a short, important message.",
          "",
          "**Anatomy:** `Alert > (icon + AlertTitle + AlertDescription + AlertAction)`.",
          'Set `variant="destructive"` for error states; drop in a leading icon and the layout adjusts automatically.',
        ].join("\n"),
      },
    },
  },
  subcomponents: { AlertAction, AlertDescription, AlertTitle },
  title: "Display/Alert",
});

export const Default = meta.story({
  render: (args) => (
    <Alert {...args} className="w-full max-w-sm">
      <InfoIcon />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>You can add components using the CLI.</AlertDescription>
      <AlertAction>
        <Button aria-label="Dismiss" size="icon-xs" variant="ghost">
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  ),
});

/** Error state — only the `variant` arg changes; the composition is reused. */
export const Destructive = meta.story({
  args: { variant: "destructive" },
  render: Default.input.render,
});

/** A genuinely different composition: no trailing action, success messaging. */
export const Basic = meta.story({
  render: (args) => (
    <Alert {...args} className="w-full max-w-sm">
      <CheckCircle2Icon />
      <AlertTitle>Account updated successfully</AlertTitle>
      <AlertDescription>
        Your profile information has been saved. Changes will be reflected immediately.
      </AlertDescription>
    </Alert>
  ),
});

const onDismiss = fn();

export const Dismissible = meta.story({
  render: (args) => (
    <Alert {...args} className="w-full max-w-sm">
      <InfoIcon />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>You can add components using the CLI.</AlertDescription>
      <AlertAction>
        <Button aria-label="Dismiss" onClick={onDismiss} size="icon-xs" variant="ghost">
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  ),
});

Dismissible.test("invokes the dismiss handler when the action button is pressed", async ({ canvas, userEvent }) => {
  onDismiss.mockClear();

  const dismiss = canvas.getByRole("button", { name: "Dismiss" });

  await userEvent.click(dismiss);

  await expect(onDismiss).toHaveBeenCalledTimes(1);
});
