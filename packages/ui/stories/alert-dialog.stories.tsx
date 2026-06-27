import { TriangleAlertIcon } from "lucide-react";
import { expect, screen, waitFor } from "storybook/test";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/alert-dialog";
import { Button } from "#/components/button";

import preview from "../.storybook/preview";

/**
 * AlertDialog — a COMPOSITE modal that interrupts the user with a deliberate
 * confirmation. The root (`AlertDialog`) is a context provider with no DOM of
 * its own; its only root-level controls are the `open`/`defaultOpen` state, so
 * the interesting variants (e.g. `size`) live on the `AlertDialogContent`
 * subcomponent. Content here is authored against the component's own public
 * API for Storybook — NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { defaultOpen: false },
  argTypes: {
    defaultOpen: { control: "boolean" },
    onOpenChange: { table: { disable: true } },
    open: { table: { disable: true } },
  },
  component: AlertDialog,
  parameters: {
    docs: {
      description: {
        component: [
          "A modal that interrupts the user with an important confirmation and expects a deliberate response.",
          "",
          "**Anatomy:** `AlertDialog > AlertDialogTrigger + AlertDialogContent > (AlertDialogHeader (AlertDialogMedia · AlertDialogTitle · AlertDialogDescription) + AlertDialogFooter (AlertDialogCancel · AlertDialogAction))`.",
          'Unlike `Dialog`, it traps focus and is only dismissed via `AlertDialogCancel`/`AlertDialogAction` — there is no outside-click close. `AlertDialogContent` accepts `size="default" | "sm"`.',
        ].join("\n"),
      },
    },
  },
  subcomponents: {
    AlertDialogAction,
    AlertDialogBody,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
    AlertDialogTrigger,
  },
  title: "Overlay/AlertDialog",
});

export const Default = meta.story({
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive">
          Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <TriangleAlertIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Your account will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
});

/** Same composition, opened by default to inspect the layout without interacting. */
export const Open = meta.story({
  args: { defaultOpen: true },
  render: Default.input.render,
});

export const OpensOnClick = meta.story({
  render: Default.input.render,
});

/**
 * Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`.
 * Asserts the open/close contract, not mere presence: the portalled content
 * appears on trigger click and is removed after pressing Cancel.
 */
OpensOnClick.test("opens on trigger and closes on cancel", async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole("button", { name: /delete account/i }));

  await expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
  await expect(await screen.findByText(/are you absolutely sure/i)).toBeInTheDocument();

  await userEvent.click(await screen.findByRole("button", { name: /cancel/i }));

  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
});
