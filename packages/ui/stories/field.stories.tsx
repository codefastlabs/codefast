import {
  Field,
  FieldContent,
  FieldDescription,
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
import { Textarea } from "#/components/textarea";

import preview from "../.storybook/preview";

/**
 * Field is a layout/composition primitive — demoed via `render`. Its root props
 * are optional, but the meaningful demos all assemble several sub-components.
 */
const meta = preview.meta({
  title: "Form/Field",
});

export const Default = meta.story({
  render: () => (
    <FieldGroup className="w-full max-w-md gap-6">
      <Field>
        <FieldLabel htmlFor="field-name">Display name</FieldLabel>
        <Input id="field-name" defaultValue="Vuong Phan" />
        <FieldDescription>Shown on your public profile.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="field-bio">Bio</FieldLabel>
        <Textarea id="field-bio" className="resize-none" rows={2} placeholder="Tell us a little about yourself" />
        <FieldDescription>Brief description for your profile. Max 160 characters.</FieldDescription>
      </Field>

      <FieldSeparator />

      <FieldSet className="gap-4">
        <FieldLegend variant="label">Email notifications</FieldLegend>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="field-product">Product updates</FieldLabel>
            <FieldDescription>News about features and releases.</FieldDescription>
          </FieldContent>
          <Switch id="field-product" defaultChecked />
        </Field>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="field-security">Security alerts</FieldLabel>
            <FieldDescription>Important activity on your account.</FieldDescription>
          </FieldContent>
          <Switch id="field-security" defaultChecked />
        </Field>
      </FieldSet>
    </FieldGroup>
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
