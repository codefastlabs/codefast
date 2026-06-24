import { TriangleAlertIcon, Trash2Icon } from "lucide-react";
import { expect, screen } from "storybook/test";

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

const meta = preview.meta({
  args: { defaultOpen: false },
  argTypes: {
    onOpenChange: { table: { disable: true } },
    open: { table: { disable: true } },
  },
  component: AlertDialog,
  subcomponents: {
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
  },
  parameters: {
    docs: {
      description: {
        component: [
          "A modal that interrupts the user with an important confirmation and expects a deliberate response.",
          "",
          "**Anatomy:** `AlertDialog > AlertDialogTrigger + AlertDialogContent > (AlertDialogHeader (AlertDialogMedia · AlertDialogTitle · AlertDialogDescription) + AlertDialogFooter (AlertDialogCancel · AlertDialogAction))`.",
          "Unlike `Dialog`, it traps focus and is only dismissed via `AlertDialogCancel`/`AlertDialogAction` — there is no outside-click close.",
        ].join("\n"),
      },
    },
  },
  title: "Overlay/AlertDialog",
});

export const Default = meta.story({
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
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

export const Destructive = meta.story({
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Chat</Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete chat?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this chat conversation. View <a href="/">Settings</a> delete any memories saved
            during this chat.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
});

export const OpensOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
OpensOnClick.test("opens on click", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /delete account/i });

  await userEvent.click(trigger);
  await expect(await screen.findByText(/are you absolutely sure/i)).toBeInTheDocument();
  await expect(await screen.findByText(/this action cannot be undone/i)).toBeInTheDocument();
});
