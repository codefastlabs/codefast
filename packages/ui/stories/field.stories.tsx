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

const meta = preview.meta({
  args: { orientation: "vertical" },
  component: Field,
  subcomponents: {
    FieldLabel,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldTitle,
    FieldGroup,
    FieldSet,
    FieldLegend,
    FieldSeparator,
  },
  parameters: {
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
