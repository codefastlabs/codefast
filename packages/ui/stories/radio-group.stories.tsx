import { useState } from "react";
import { expect } from "storybook/test";

import { Label } from "#/components/label";
import { RadioGroup, RadioGroupItem } from "#/components/radio-group";

import preview from "../.storybook/preview";

const DENSITY_OPTIONS = ["compact", "comfortable", "spacious"] as const;
type Density = (typeof DENSITY_OPTIONS)[number];

const DENSITY_SET = new Set<string>(DENSITY_OPTIONS);
const isDensity = (value: string): value is Density => DENSITY_SET.has(value);

const meta = preview.meta({
  component: RadioGroup,
  subcomponents: { RadioGroupItem },
  parameters: {
    docs: {
      description: {
        component: [
          "A set of mutually exclusive options where only one can be selected at a time.",
          "",
          "**Anatomy:** `RadioGroup > RadioGroupItem`.",
          "Drive it with `value`/`defaultValue` + `onValueChange`; pair each item with a `Label`.",
        ].join("\n"),
      },
    },
  },
  title: "Form/RadioGroup",
});

export const Default = meta.story({
  render: () => {
    function Render() {
      const [radio, setRadio] = useState<Density>("comfortable");

      return (
        <RadioGroup
          value={radio}
          onValueChange={(value) => {
            if (isDensity(value)) {
              setRadio(value);
            }
          }}
          className="gap-3"
        >
          {DENSITY_OPTIONS.map((value) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem value={value} id={`radio-${value}`} />
              <Label htmlFor={`radio-${value}`} className="capitalize">
                {value}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    return <Render />;
  },
});

export const Disabled = meta.story({
  render: () => (
    <RadioGroup defaultValue="option2" className="w-fit">
      <div className="flex items-center gap-2 opacity-50">
        <RadioGroupItem value="option1" id="disabled-1" disabled />
        <Label htmlFor="disabled-1" className="font-normal">
          Disabled
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option2" id="disabled-2" />
        <Label htmlFor="disabled-2" className="font-normal">
          Option 2
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option3" id="disabled-3" />
        <Label htmlFor="disabled-3" className="font-normal">
          Option 3
        </Label>
      </div>
    </RadioGroup>
  ),
});

export const Invalid = meta.story({
  render: () => (
    <RadioGroup defaultValue="email" className="w-fit">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="email" id="invalid-email" aria-invalid />
        <Label htmlFor="invalid-email" className="font-normal">
          Email only
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="sms" id="invalid-sms" aria-invalid />
        <Label htmlFor="invalid-sms" className="font-normal">
          SMS only
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="both" id="invalid-both" aria-invalid />
        <Label htmlFor="invalid-both" className="font-normal">
          Both Email &amp; SMS
        </Label>
      </div>
    </RadioGroup>
  ),
});

export const ChecksOnClick = meta.story({
  render: () => (
    <RadioGroup defaultValue="comfortable" className="gap-3">
      {DENSITY_OPTIONS.map((value) => (
        <div key={value} className="flex items-center gap-2">
          <RadioGroupItem value={value} id={`pick-${value}`} />
          <Label htmlFor={`pick-${value}`} className="capitalize">
            {value}
          </Label>
        </div>
      ))}
    </RadioGroup>
  ),
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ChecksOnClick.test("checks on click", async ({ canvas, userEvent }) => {
  const radio = canvas.getByRole("radio", { name: "compact" });

  await userEvent.click(radio);
  await expect(radio).toBeChecked();
});
