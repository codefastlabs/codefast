import { expect } from "storybook/test";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "#/components/accordion";

import preview from "../.storybook/preview";

/**
 * Accordion — a COMPOSITE whose root prop type is a discriminated union
 * (`type: "single" | "multiple"`), which CSF Next can't drive directly through
 * `{...args}`. We expose a FLAT custom args shape (`preview.type`) and narrow on
 * `type` inside the render, so the Controls panel still gets
 * `type`/`collapsible`/`orientation`/`disabled`; the real parts live in
 * `subcomponents` so their prop tables still document in autodocs. Story content
 * is authored here for Storybook — it is NOT synced with the apps/web registry.
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
  subcomponents: { Accordion, AccordionContent, AccordionItem, AccordionTrigger },
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

/** `type="multiple"` — any number of sections can stay open at once. */
export const Multiple = meta.story({
  args: { type: "multiple" },
  render: Default.input.render,
});

/** Every item is non-interactive while `disabled` is set on the root. */
export const Disabled = meta.story({
  args: { disabled: true },
  render: Default.input.render,
});

export const ExpandsOnClick = meta.story({
  render: Default.input.render,
});

/**
 * Interaction test (CSF Next `.test()`) — runs in a real browser via
 * `test:stories`. Covers the single-mode contract: clicking a trigger reveals
 * its panel, and opening another collapses the first (one open at a time).
 */
ExpandsOnClick.test("single mode keeps one section open at a time", async ({ canvas, userEvent }) => {
  const first = canvas.getByRole("button", { name: /is it accessible/i });
  const second = canvas.getByRole("button", { name: /customise styles/i });

  await userEvent.click(first);
  await expect(await canvas.findByText(/WAI-ARIA design pattern/i)).toBeVisible();
  await expect(first).toHaveAttribute("aria-expanded", "true");

  await userEvent.click(second);
  await expect(await canvas.findByText(/own the source/i)).toBeVisible();
  await expect(first).toHaveAttribute("aria-expanded", "false");
});
