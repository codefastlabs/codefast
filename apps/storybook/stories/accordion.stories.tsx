import type { Meta, StoryObj } from '@storybook/react';

import { Accordion, AccordionContent, AccordionIcon, AccordionItem, AccordionTrigger } from '@codefast/ui';

const meta = {
  component: Accordion,
  tags: ['autodocs'],
  title: 'UI/Accordion',
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof Accordion>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  args: {
    collapsible: true,
    type: 'single',
  },
  render: (args) => (
    <Accordion className="w-96" {...args}>
      <AccordionItem className="border-b" value="item-1">
        <AccordionTrigger>
          <span className="grow">Is it accessible?</span>
          <AccordionIcon />
        </AccordionTrigger>
        <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
      </AccordionItem>
      <AccordionItem className="border-b" value="item-2">
        <AccordionTrigger>
          <span className="grow">Is it styled?</span>
          <AccordionIcon />
        </AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other components&apos; aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem className="border-b" value="item-3">
        <AccordionTrigger>
          <span className="grow">Is it animated?</span>
          <AccordionIcon />
        </AccordionTrigger>
        <AccordionContent>Yes. It&apos;s animated by default, but you can disable it if you prefer.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Left icon
 * -------------------------------------------------------------------------- */

export const LeftIcon: Story = {
  args: {
    collapsible: true,
    type: 'single',
  },
  render: (args) => (
    <Accordion className="w-96" {...args}>
      <AccordionItem className="border-b" value="item-1">
        <AccordionTrigger>
          <AccordionIcon />
          <span className="grow">Is it accessible?</span>
        </AccordionTrigger>
        <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
      </AccordionItem>
      <AccordionItem className="border-b" value="item-2">
        <AccordionTrigger>
          <AccordionIcon />
          <span className="grow">Is it styled?</span>
        </AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other components&apos; aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem className="border-b" value="item-3">
        <AccordionTrigger>
          <AccordionIcon />
          <span className="grow">Is it animated?</span>
        </AccordionTrigger>
        <AccordionContent>Yes. It&apos;s animated by default, but you can disable it if you prefer.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
