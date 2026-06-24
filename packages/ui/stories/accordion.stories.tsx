import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "#/components/accordion";

/**
 * Accordion's root requires a `type` prop, so binding `component` would force
 * `args` onto every story. Composition components are demoed via `render`
 * instead — keep `component` only for prop-driven single components (see Button).
 */
const meta = {
  title: "Display/Accordion",
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-sm">
      <AccordionItem value="q1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>Yes. It follows the WAI-ARIA design pattern with full keyboard navigation.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="q2">
        <AccordionTrigger>Can I customise styles?</AccordionTrigger>
        <AccordionContent>Yes. Every component exposes a className prop and you own the source.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="q3">
        <AccordionTrigger>Does it work with SSR?</AccordionTrigger>
        <AccordionContent>Yes. All components render server-side with no hydration issues.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" className="w-full max-w-sm">
      <AccordionItem value="a">
        <AccordionTrigger>First section</AccordionTrigger>
        <AccordionContent>Multiple items can stay open at once.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Second section</AccordionTrigger>
        <AccordionContent>Open this without collapsing the first.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/** Interaction test — runs in a real browser via `vitest run --project=storybook`. */
export const ExpandsOnClick: Story = {
  render: Default.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /is it accessible/i });

    await userEvent.click(trigger);
    await expect(await canvas.findByText(/WAI-ARIA design pattern/i)).toBeVisible();
  },
};
