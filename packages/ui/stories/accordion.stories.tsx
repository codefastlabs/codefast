import { expect } from "storybook/test";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "#/components/accordion";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: Accordion,
  subcomponents: { AccordionItem, AccordionTrigger, AccordionContent },
  parameters: {
    docs: {
      description: {
        component: [
          "A vertically stacked set of interactive headings that each reveal a section of content.",
          "",
          "**Anatomy:** `Accordion > AccordionItem > (AccordionTrigger + AccordionContent)`.",
          'Set `type="single"` (one open at a time, add `collapsible`) or `type="multiple"`.',
        ].join("\n"),
      },
    },
  },
  title: "Display/Accordion",
});

export const Default = meta.story({
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
});

export const Multiple = meta.story({
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
});

export const ExpandsOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ExpandsOnClick.test("expands on click", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /is it accessible/i });

  await userEvent.click(trigger);
  await expect(await canvas.findByText(/WAI-ARIA design pattern/i)).toBeVisible();
});
