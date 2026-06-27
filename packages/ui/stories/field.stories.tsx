import { expect } from "storybook/test";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "#/components/field";
import { Input } from "#/components/input";
import { RadioGroup, RadioGroupItem } from "#/components/radio-group";
import { Switch } from "#/components/switch";

import preview from "../.storybook/preview";

/**
 * Field — a styling-only LAYOUT COMPOSITE. The root `Field` is a `<div>` whose
 * only meaningful prop is the `orientation` variant; everything else is forwarded
 * native div attributes. Each piece (`FieldLabel`, `FieldContent`, `FieldDescription`,
 * `FieldError`, `FieldSet`, `FieldGroup`, …) is presentational. Content here is
 * authored for Storybook against the component's own public API, NOT synced with
 * the apps/web registry.
 */
const meta = preview.meta({
  args: { orientation: "vertical" },
  argTypes: {
    orientation: {
      control: "radio",
      options: ["vertical", "horizontal", "responsive"],
    },
  },
  component: Field,
  parameters: {
    controls: { include: ["orientation"] },
    docs: {
      description: {
        component: [
          "A layout primitive that arranges a control with its label, description, and validation message.",
          "",
          "**Anatomy:** `FieldSet > FieldLegend + FieldGroup > Field > (FieldLabel + FieldContent + FieldDescription + FieldError)`.",
          "Use `FieldSet`/`FieldLegend` to group related fields and `FieldSeparator` to divide sections; all parts are styling-only.",
        ].join("\n"),
      },
    },
  },
  subcomponents: {
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
    FieldTitle,
  },
  title: "Form/Field",
});

export const Default = meta.story({
  render: (args) => (
    <Field {...args} className="w-full max-w-md">
      <FieldContent>
        <FieldLabel htmlFor="field-product">Product updates</FieldLabel>
        <FieldDescription>News about features and releases.</FieldDescription>
      </FieldContent>
      <Switch id="field-product" defaultChecked />
    </Field>
  ),
});

export const Horizontal = meta.story({
  args: { orientation: "horizontal" },
  render: Default.input.render,
});

export const InputGroup = meta.story({
  render: () => (
    <FieldSet className="w-full max-w-xs">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input id="username" type="text" placeholder="Leo Park" />
          <FieldDescription>Choose a unique username for your account.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <FieldDescription>Must be at least 8 characters long.</FieldDescription>
          <Input id="password" type="password" placeholder="••••••••" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
});

export const WithError = meta.story({
  render: () => (
    <Field className="w-full max-w-xs" data-invalid="true">
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input aria-invalid id="email" type="email" placeholder="you@example.com" />
      <FieldError errors={[{ message: "Enter a valid email address." }]} />
    </Field>
  ),
});

export const ChoiceCard = meta.story({
  render: () => (
    <FieldGroup className="w-full max-w-xs">
      <FieldSet>
        <FieldLegend variant="label">Compute Environment</FieldLegend>
        <FieldDescription>Select the compute environment for your cluster.</FieldDescription>
        <RadioGroup defaultValue="kubernetes">
          <FieldLabel htmlFor="kubernetes-r2h">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Kubernetes</FieldTitle>
                <FieldDescription>Run GPU workloads on a K8s cluster.</FieldDescription>
              </FieldContent>
              <RadioGroupItem value="kubernetes" id="kubernetes-r2h" />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="vm-z4k">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Virtual Machine</FieldTitle>
                <FieldDescription>Access a cluster to run GPU workloads.</FieldDescription>
              </FieldContent>
              <RadioGroupItem value="vm" id="vm-z4k" />
            </Field>
          </FieldLabel>
        </RadioGroup>
      </FieldSet>
    </FieldGroup>
  ),
});

InputGroup.test("types into the field's labelled control", async ({ canvas, userEvent }) => {
  const username = canvas.getByLabelText("Username");

  await userEvent.type(username, "leo");
  await expect(username).toHaveValue("leo");
});
