import { expect } from "storybook/test";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "#/components/accordion";

import preview from "../.storybook/preview";

/**
 * Accordion's root prop type is a discriminated union (`type: "single" | "multiple"`),
 * which CSF Next can't drive directly via `{...args}`. We expose a flat custom args
 * shape (CSF Next `preview.type`) and narrow on `type` in the render, so the Controls
 * panel still gets `type`/`collapsible`/`orientation`/`disabled`.
 */
interface AccordionArgs {
  collapsible: boolean;
  disabled: boolean;
  orientation: "horizontal" | "vertical";
  type: "multiple" | "single";
}

const meta = preview.type<{ args: AccordionArgs }>().meta({
  args: { collapsible: true, disabled: false, orientation: "vertical", type: "single" },
  argTypes: {
    collapsible: { control: "boolean" },
    disabled: { control: "boolean" },
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
    type: { control: "radio", options: ["single", "multiple"] },
  },
  subcomponents: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
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
  render: ({ collapsible, disabled, orientation, type }) => {
    const items = (
      <>
        <AccordionItem value="q1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            Yes. It follows the WAI-ARIA design pattern with full keyboard navigation.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="q2">
          <AccordionTrigger>Can I customise styles?</AccordionTrigger>
          <AccordionContent>Yes. Every component exposes a className prop and you own the source.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="q3">
          <AccordionTrigger>Does it work with SSR?</AccordionTrigger>
          <AccordionContent>Yes. All components render server-side with no hydration issues.</AccordionContent>
        </AccordionItem>
      </>
    );

    return type === "multiple" ? (
      <Accordion className="w-full max-w-sm" disabled={disabled} orientation={orientation} type="multiple">
        {items}
      </Accordion>
    ) : (
      <Accordion
        className="w-full max-w-sm"
        collapsible={collapsible}
        disabled={disabled}
        orientation={orientation}
        type="single"
      >
        {items}
      </Accordion>
    );
  },
});

export const Multiple = meta.story({
  render: () => (
    <Accordion className="w-full max-w-sm" type="multiple">
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
