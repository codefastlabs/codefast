import { FileIcon, FolderOpenIcon } from "lucide-react";

import { ResizableGroup, ResizablePanel, ResizableSeparator } from "#/components/resizable";
import { cn } from "#/lib/utils";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: ResizableGroup,
  subcomponents: { ResizablePanel, ResizableSeparator },
  parameters: {
    docs: {
      description: {
        component: [
          "A resizable layout of panels the user can drag to resize.",
          "",
          "**Anatomy:** `ResizableGroup > ResizablePanel + ResizableSeparator + ResizablePanel`.",
          "Set the group `direction` to `horizontal` or `vertical`; place a `ResizableSeparator` between adjacent panels.",
        ].join("\n"),
      },
    },
  },
  title: "Layout/Resizable",
});

const FILES = [
  { name: "app.tsx", active: true },
  { name: "router.tsx", active: false },
  { name: "styles.css", active: false },
  { name: "utils.ts", active: false },
];

export const Default = meta.story({
  render: () => (
    <div className="h-80 w-full max-w-2xl">
      <ResizableGroup className="overflow-hidden rounded-xl border">
        {/* Explorer */}
        <ResizablePanel defaultSize={28} minSize={18}>
          <div className="flex h-full flex-col gap-0.5 bg-muted p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <FolderOpenIcon className="size-3.5" />
              src
            </div>
            {FILES.map(({ name, active }) => (
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

export const Vertical = meta.story({
  render: () => (
    <ResizableGroup orientation="vertical" className="min-h-50 max-w-sm rounded-lg border">
      <ResizablePanel defaultSize="25%">
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Header</span>
        </div>
      </ResizablePanel>
      <ResizableSeparator />
      <ResizablePanel defaultSize="75%">
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Content</span>
        </div>
      </ResizablePanel>
    </ResizableGroup>
  ),
});

export const WithHandle = meta.story({
  render: () => (
    <ResizableGroup orientation="horizontal" className="min-h-50 max-w-md rounded-lg border md:min-w-112.5">
      <ResizablePanel defaultSize="25%">
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Sidebar</span>
        </div>
      </ResizablePanel>
      <ResizableSeparator withHandle />
      <ResizablePanel defaultSize="75%">
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Content</span>
        </div>
      </ResizablePanel>
    </ResizableGroup>
  ),
});
