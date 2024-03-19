import { type Meta, type StoryObj } from "@storybook/react";
import { AspectRatio } from "@codefast/ui/aspect-ratio";
import Image from "next/image";

const meta = {
  component: AspectRatio,
  tags: ["autodocs"],
  title: "UIs/Aspect Ratio",
} satisfies Meta<typeof AspectRatio>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ratio: 16 / 9,
    className: "bg-muted",
  },
  render: (args) => (
    <div className="w-[450px]">
      <AspectRatio {...args}>
        <Image
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          alt="Photo by Drew Beamer"
          fill
          className="rounded-md object-cover"
        />
      </AspectRatio>
    </div>
  ),
};
