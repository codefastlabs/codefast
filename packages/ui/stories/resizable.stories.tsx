import { FileIcon, FolderOpenIcon } from "lucide-react";
import { expect, waitFor } from "storybook/test";

import { ResizableGroup, ResizablePanel, ResizableSeparator } from "#/components/resizable";
import { cn } from "#/lib/utils";

import preview from "../.storybook/preview";

/**
 * Resizable — a COMPOSITE layout whose root (`ResizableGroup`) is a prop-driven
 * wrapper around `react-resizable-panels`: the group owns the `orientation`,
 * `disabled` and `disableCursor` props that `{...args}` drive, while panels and
 * separators are composed as children. Content here is authored for Storybook,
 * NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { disableCursor: false, disabled: false, orientation: "horizontal" },
  argTypes: {
    disableCursor: { control: "boolean" },
    disabled: { control: "boolean" },
    onLayoutChange: { table: { disable: true } },
    onLayoutChanged: { table: { disable: true } },
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
  },
  component: ResizableGroup,
  parameters: {
    controls: { include: ["orientation", "disabled", "disableCursor"] },
    docs: {
      description: {
        component: [
          "A resizable layout of panels the user can drag (or arrow-key) to resize.",
          "",
          "**Anatomy:** `ResizableGroup > ResizablePanel + ResizableSeparator + ResizablePanel`.",
          "Set the group `orientation` to `horizontal` or `vertical`; place a `ResizableSeparator` between adjacent panels and pass `withHandle` to show a grab handle.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { ResizablePanel, ResizableSeparator },
  title: "Layout/Resizable",
});

const FILES = [
  { active: true, name: "app.tsx" },
  { active: false, name: "router.tsx" },
  { active: false, name: "styles.css" },
  { active: false, name: "utils.ts" },
];

export const Default = meta.story({
  render: (args) => (
    <div className="h-80 w-full max-w-2xl">
      <ResizableGroup {...args} className="overflow-hidden rounded-xl border">
        {/* Explorer */}
        <ResizablePanel defaultSize={28} minSize={18}>
          <div className="flex h-full flex-col gap-0.5 bg-muted p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <FolderOpenIcon className="size-3.5" />
              src
            </div>
            {FILES.map(({ active, name }) => (
              <div
                key={name}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2 py-1 text-xs",
                  active ? "bg-card font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                <FileIcon className="size-3.5 shrink-0" />
                {name}
              </div>
            ))}
          </div>
        </ResizablePanel>
        <ResizableSeparator withHandle />
        {/* Editor + terminal */}
        <ResizablePanel defaultSize={72}>
          <ResizableGroup orientation="vertical">
            <ResizablePanel defaultSize={64} minSize={30}>
              <pre className="h-full overflow-auto p-3 font-mono text-xs leading-relaxed text-foreground">
                <code>{`export function App() {
  return (
    <main className="p-8">
      <h1>Hello, world</h1>
    </main>
  );
}`}</code>
              </pre>
            </ResizablePanel>
            <ResizableSeparator withHandle />
            <ResizablePanel defaultSize={36} minSize={20}>
              <div className="h-full bg-muted p-3 font-mono text-xs">
                <span className="text-emerald-500">➜</span> <span className="text-muted-foreground">~/app</span> pnpm
                dev
                <div className="mt-1 text-muted-foreground">VITE ready in 312 ms</div>
              </div>
            </ResizablePanel>
          </ResizableGroup>
        </ResizablePanel>
      </ResizableGroup>
    </div>
  ),
});

/** Vertically stacked panels — same composition, `orientation` flipped via args. */
export const Vertical = meta.story({
  args: { orientation: "vertical" },
  render: Default.input.render,
});

/** Resizing disabled — separators no longer drag, driven entirely by args. */
export const Disabled = meta.story({
  args: { disabled: true },
  render: Default.input.render,
});

export const ResizesWithKeyboard = meta.story({ render: Default.input.render });

ResizesWithKeyboard.test(
  "arrow keys move the separator and update its aria-valuenow",
  async ({ canvas, userEvent }) => {
    const [separator] = canvas.getAllByRole("separator");

    if (!separator) {
      throw new Error("expected at least one resizable separator");
    }

    await expect(separator).toBeInTheDocument();

    const before = separator.getAttribute("aria-valuenow");

    separator.focus();
    await expect(separator).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");

    await waitFor(() => expect(separator.getAttribute("aria-valuenow")).not.toBe(before));
  },
);
