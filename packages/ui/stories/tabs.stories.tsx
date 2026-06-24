import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "#/components/button";
import { Input } from "#/components/input";
import { Label } from "#/components/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/tabs";

/**
 * Tabs' root requires a `defaultValue` (or controlled `value`), so binding
 * `component` would force `args` onto every story. Composition components are
 * demoed via `render` instead — keep `component` only for prop-driven single
 * components (see Button).
 */
const meta = {
  title: "Navigation/Tabs",
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
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
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="account" orientation="vertical">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
    </Tabs>
  ),
};

export const Line: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
    </Tabs>
  ),
};

/** Interaction test — runs in a real browser via `vitest run --project=storybook`. */
export const SwitchesOnClick: Story = {
  render: Default.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("tab", { name: /password/i });

    await userEvent.click(trigger);
    await expect(await canvas.findByLabelText(/current password/i)).toBeVisible();
  },
};
