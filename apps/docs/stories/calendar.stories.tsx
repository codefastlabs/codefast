import { type Meta, type StoryObj } from "@storybook/react";
import { Calendar } from "@codefast/ui/calendar";
import { useState } from "react";

const meta = {
  component: Calendar,
  tags: ["autodocs"],
  title: "UIs/Calendar",
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<Date>();

    return (
      <Calendar
        mode="single"
        selected={selected}
        // @ts-expect-error -- TS doesn't know about the onSelect prop
        onSelect={setSelected}
        className="rounded-md border shadow"
        {...args}
      />
    );
  },
};
