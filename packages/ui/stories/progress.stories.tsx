import { Progress } from "#/components/progress";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { value: 68 },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
  },
  component: Progress,
  parameters: {
    controls: { include: ["value"] },
  },
  render: (args) => (
    <div className="w-full max-w-xs">
      <Progress {...args} />
    </div>
  ),
  title: "Feedback/Progress",
});

export const Default = meta.story();

export const WithLabel = meta.story({
  render: () => (
    <div className="w-full max-w-xs">
      <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
        <span>Uploading…</span>
        <span>68%</span>
      </div>
      <Progress value={68} />
    </div>
  ),
});

export const Complete = meta.story({
  args: { value: 100 },
});

export const Empty = meta.story({
  args: { value: 0 },
});
