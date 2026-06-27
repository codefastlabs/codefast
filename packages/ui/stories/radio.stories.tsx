import { useState } from "react";
import { expect, fn } from "storybook/test";

import { Label } from "#/components/label";
import { Radio } from "#/components/radio";

import preview from "../.storybook/preview";

const VOTES = ["Yes", "No", "Maybe"];

/**
 * Radio — a prop-driven leaf. It renders a single native `<input type="radio">`,
 * so the root owns every interesting prop (`checked`, `defaultChecked`,
 * `disabled`, `value`, `name`) and exposes a convenience `onValueChange`
 * callback alongside the native `onChange`. Group behaviour comes from sharing a
 * `name`, which the group stories compose. Content is authored for Storybook,
 * not synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { defaultChecked: false, disabled: false, name: "radio", value: "option" },
  argTypes: {
    checked: { table: { disable: true } },
    defaultChecked: { control: "boolean" },
    disabled: { control: "boolean" },
    name: { control: "text" },
    onChange: { table: { disable: true } },
    onValueChange: { table: { disable: true } },
    value: { control: "text" },
  },
  component: Radio,
  parameters: {
    controls: { include: ["defaultChecked", "disabled", "name", "value"] },
    docs: {
      description: {
        component:
          'A single selection control rendered as a native `<input type="radio">`. Pair with a `Label` and group several together by sharing a `name`. `onValueChange` fires with the input\'s `value` on change.',
      },
    },
  },
  title: "Form/Radio",
});

export const Default = meta.story({
  render: (args) => (
    <div className="flex items-center gap-2">
      <Radio id="radio-default" {...args} />
      <Label htmlFor="radio-default">Subscribe to updates</Label>
    </div>
  ),
});

export const Checked = meta.story({
  args: { defaultChecked: true },
  render: Default.input.render,
});

export const Disabled = meta.story({
  args: { disabled: true },
  render: Default.input.render,
});

/** A horizontal group of mutually-exclusive options sharing a `name`. */
export const Group = meta.story({
  render: () => {
    function Render() {
      const [value, setValue] = useState("Yes");

      return (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {VOTES.map((option) => (
            <div key={option} className="flex items-center gap-2">
              <Radio
                id={`vote-${option}`}
                name="vote"
                value={option}
                checked={value === option}
                onValueChange={setValue}
              />
              <Label htmlFor={`vote-${option}`}>{option}</Label>
            </div>
          ))}
        </div>
      );
    }

    return <Render />;
  },
});

export const ChecksOnClick = meta.story({
  args: { onValueChange: fn() },
  render: ({ onValueChange }) => (
    <div className="flex flex-col gap-3">
      {VOTES.map((option) => (
        <div key={option} className="flex items-center gap-2">
          <Radio id={`pick-${option}`} name="pick" value={option} onValueChange={onValueChange} />
          <Label htmlFor={`pick-${option}`}>{option}</Label>
        </div>
      ))}
    </div>
  ),
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ChecksOnClick.test("checks the clicked option and reports its value", async ({ args, canvas, userEvent }) => {
  const yes = canvas.getByRole("radio", { name: "Yes" });
  const maybe = canvas.getByRole("radio", { name: "Maybe" });

  await userEvent.click(yes);
  await expect(yes).toBeChecked();
  await expect(args.onValueChange).toHaveBeenLastCalledWith("Yes");

  await userEvent.click(maybe);
  await expect(maybe).toBeChecked();
  await expect(yes).not.toBeChecked();
  await expect(args.onValueChange).toHaveBeenLastCalledWith("Maybe");
});
