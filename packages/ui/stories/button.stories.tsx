import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { expect, fn } from "storybook/test";

import { Button } from "#/components/button";

import preview from "../.storybook/preview";

/**
 * Button — a prop-driven leaf. The root owns every interesting prop (`variant`,
 * `size`, plus native `<button>` attributes), so we bind `component`, set `args`
 * defaults and drive everything through the Controls panel. Each named story
 * below pins ONE meaningful state (a stable permalink + an autodocs catalogue
 * entry) and reuses the single args-driven render — there is no hand-written
 * JSX to drift, and these stories are authored against the component's own API,
 * independent of the apps/web registry.
 */
const meta = preview.meta({
  args: { children: "Button", size: "default", variant: "default" },
  argTypes: {
    asChild: { table: { disable: true } },
    children: { control: "text" },
    disabled: { control: "boolean" },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    variant: {
      control: "radio",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
  },
  component: Button,
  parameters: {
    controls: { include: ["variant", "size", "children", "disabled"] },
    docs: {
      description: {
        component:
          "Clickable action with six visual `variant`s and eight `size`s. Renders a native `<button>` by default, or composes onto any child element via `asChild`.",
      },
    },
  },
  title: "Form/Button",
});

export const Default = meta.story();

export const Secondary = meta.story({ args: { variant: "secondary" } });

export const Destructive = meta.story({ args: { variant: "destructive" } });

export const Outline = meta.story({ args: { variant: "outline" } });

export const Ghost = meta.story({ args: { variant: "ghost" } });

export const Link = meta.story({ args: { variant: "link" } });

export const Disabled = meta.story({ args: { disabled: true } });

/** Icon + label: lucide icons inherit their size from the button via `data-slot`. */
export const WithIcon = meta.story({
  args: {
    children: (
      <>
        <PlusIcon />
        New project
      </>
    ),
  },
});

/** Icon-only — pair an `icon*` size with an explicit `aria-label` for a name. */
export const IconOnly = meta.story({
  args: { "aria-label": "Next", children: <ArrowRightIcon />, size: "icon" },
});

/**
 * Interaction test (CSF Next `.test()`) — runs in a real browser via
 * `test:stories`. An `fn()` spy on `onClick` proves the press is wired through.
 */
export const Clickable = meta.story({ args: { children: "Click me", onClick: fn() } });

Clickable.test("fires onClick when pressed", async ({ args, canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole("button", { name: "Click me" }));

  await expect(args.onClick).toHaveBeenCalledTimes(1);
});
