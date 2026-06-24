import { expect } from "storybook/test";

import { Button } from "#/components/button";
import { Input } from "#/components/input";
import { Label } from "#/components/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/tabs";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: Tabs,
  subcomponents: { TabsList, TabsTrigger, TabsContent },
  parameters: {
    docs: {
      description: {
        component: [
          "A set of layered sections of content where only one panel is visible at a time.",
          "",
          "**Anatomy:** `Tabs > TabsList > TabsTrigger` + one `TabsContent` per tab.",
          "Each `TabsTrigger` and `TabsContent` is paired by a matching `value`; set `defaultValue` (uncontrolled) or `value` (controlled) on `Tabs`.",
        ].join("\n"),
      },
    },
  },
  title: "Navigation/Tabs",
});

export const Default = meta.story({
  render: () => (
    <Tabs defaultValue="account" className="w-full max-w-sm">
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

export const Vertical = meta.story({
  render: () => (
    <Tabs defaultValue="account" orientation="vertical">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
    </Tabs>
  ),
});

export const Line = meta.story({
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
    </Tabs>
  ),
});

export const SwitchesOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
SwitchesOnClick.test("switches on click", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("tab", { name: /password/i });

  await userEvent.click(trigger);
  await expect(await canvas.findByLabelText(/current password/i)).toBeVisible();
});
