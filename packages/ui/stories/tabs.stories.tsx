import { expect } from "storybook/test";

import { Button } from "#/components/button";
import { Input } from "#/components/input";
import { Label } from "#/components/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/tabs";

import preview from "../.storybook/preview";

/**
 * Tabs — a COMPOSITE whose root (`Tabs`) is a normal element-like component: it owns
 * `orientation`, plus uncontrolled `defaultValue` / controlled `value`. The visual
 * `variant` ("default" | "line") lives on the `TabsList` subcomponent, not the root.
 * Content here is authored against the component's own public API for Storybook, NOT
 * synced with or copied from the apps/web registry.
 */
const meta = preview.meta({
  args: { defaultValue: "account", orientation: "horizontal" },
  argTypes: {
    asChild: { table: { disable: true } },
    onValueChange: { table: { disable: true } },
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
    value: { table: { disable: true } },
  },
  component: Tabs,
  parameters: {
    controls: { include: ["orientation", "defaultValue"] },
    docs: {
      description: {
        component: [
          "A set of layered sections of content where only one panel is visible at a time.",
          "",
          "**Anatomy:** `Tabs > TabsList > TabsTrigger` + one `TabsContent` per tab.",
          "Each `TabsTrigger` and `TabsContent` is paired by a matching `value`; set `defaultValue` (uncontrolled) or `value` (controlled) on `Tabs`. The `variant` prop on `TabsList` switches between the filled (`default`) and underlined (`line`) styles.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { TabsContent, TabsList, TabsTrigger },
  title: "Navigation/Tabs",
});

export const Default = meta.story({
  render: (args) => (
    <Tabs {...args} className="w-full max-w-sm">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="mt-4 space-y-3">
        <div className="grid gap-1.5">
          <Label htmlFor="tabs-name">Name</Label>
          <Input id="tabs-name" defaultValue="Vuong Phan" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tabs-username">Username</Label>
          <Input id="tabs-username" defaultValue="@vuongphan" />
        </div>
        <Button size="sm">Save changes</Button>
      </TabsContent>

      <TabsContent value="password" className="mt-4 space-y-3">
        <div className="grid gap-1.5">
          <Label htmlFor="tabs-current">Current password</Label>
          <Input id="tabs-current" type="password" placeholder="••••••••" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tabs-new">New password</Label>
          <Input id="tabs-new" type="password" placeholder="Min. 8 characters" />
        </div>
        <Button size="sm">Update password</Button>
      </TabsContent>
    </Tabs>
  ),
});

/** Same composition, only `orientation` differs — reuses the base render. */
export const Vertical = meta.story({
  args: { orientation: "vertical" },
  render: Default.input.render,
});

/**
 * Distinct composition: the underlined `line` variant lives on `TabsList`, so this
 * story has its own render rather than reusing the base default-variant layout.
 */
export const Line = meta.story({
  args: { defaultValue: "overview" },
  render: (args) => (
    <Tabs {...args} className="w-full max-w-md">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        Snapshot of your key metrics for the current period.
      </TabsContent>
      <TabsContent value="analytics" className="mt-4">
        Traffic and engagement broken down by source.
      </TabsContent>
      <TabsContent value="reports" className="mt-4">
        Scheduled exports and downloadable summaries.
      </TabsContent>
    </Tabs>
  ),
});

export const SwitchesOnClick = meta.story({ render: Default.input.render });

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
SwitchesOnClick.test("activating a tab reveals its panel and flips selection", async ({ canvas, userEvent }) => {
  const accountTab = canvas.getByRole("tab", { name: /account/i });
  const passwordTab = canvas.getByRole("tab", { name: /password/i });

  await expect(accountTab).toHaveAttribute("aria-selected", "true");
  await expect(passwordTab).toHaveAttribute("aria-selected", "false");

  await userEvent.click(passwordTab);

  await expect(passwordTab).toHaveAttribute("aria-selected", "true");
  await expect(accountTab).toHaveAttribute("aria-selected", "false");
  await expect(await canvas.findByLabelText(/current password/i)).toBeVisible();
});
