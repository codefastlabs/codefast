import {
  Accordion,
  AccordionContent,
  AccordionIcon,
  AccordionItem,
  AccordionTrigger,
} from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Accordion,
  tags: ['autodocs'],
  title: 'Components/Misc/Accordion',
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  render: (args) => (
    <Accordion className="w-96" {...args}>
      <AccordionItem className="border-b" value="item-1">
        <AccordionTrigger>
          <span className="grow">Is it accessible?</span>
          <AccordionIcon />
        </AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem className="border-b" value="item-2">
        <AccordionTrigger>
          <span className="grow">Is it styled?</span>
          <AccordionIcon />
        </AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other
          components&apos; aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem className="border-b" value="item-3">
        <AccordionTrigger>
          <span className="grow">Is it animated?</span>
          <AccordionIcon />
        </AccordionTrigger>
        <AccordionContent>
          Yes. It&apos;s animated by default, but you can disable it if you
          prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Left icon
 * -------------------------------------------------------------------------- */

export const LeftIcon: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  render: (args) => (
    <Accordion className="w-96" {...args}>
      <AccordionItem className="border-b" value="item-1">
        <AccordionTrigger>
          <AccordionIcon />
          <span className="grow">Is it accessible?</span>
        </AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem className="border-b" value="item-2">
        <AccordionTrigger>
          <AccordionIcon />
          <span className="grow">Is it styled?</span>
        </AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other
          components&apos; aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem className="border-b" value="item-3">
        <AccordionTrigger>
          <AccordionIcon />
          <span className="grow">Is it animated?</span>
        </AccordionTrigger>
        <AccordionContent>
          Yes. It&apos;s animated by default, but you can disable it if you
          prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
