import { cn } from "@codefast/ui/lib/utils";
import { ResizableGroup, ResizablePanel, ResizableSeparator } from "@codefast/ui/resizable";
import { FileIcon, FolderOpenIcon } from "lucide-react";

const FILES = [
  { name: "app.tsx", active: true },
  { name: "router.tsx", active: false },
  { name: "styles.css", active: false },
  { name: "utils.ts", active: false },
];

export function ResizableDemo() {
  return (
    <div className="h-80 w-full max-w-2xl">
      <ResizableGroup className="overflow-hidden rounded-xl border">
        {/* Explorer */}
        <ResizablePanel defaultSize={28} minSize={18}>
          <div className="flex h-full flex-col gap-0.5 bg-ui-surface p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ui-muted">
              <FolderOpenIcon className="size-3.5" />
              src
            </div>
            {FILES.map(({ name, active }) => (
              <div
                key={name}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2 py-1 text-xs",
                  active ? "bg-ui-card font-medium text-ui-fg" : "text-ui-muted",
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
              <pre className="h-full overflow-auto p-3 font-mono text-xs leading-relaxed text-ui-fg">
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
              <div className="h-full bg-ui-surface p-3 font-mono text-xs">
                <span className="text-emerald-500">➜</span> <span className="text-ui-muted">~/app</span> pnpm dev
                <div className="mt-1 text-ui-muted">VITE ready in 312 ms</div>
              </div>
            </ResizablePanel>
          </ResizableGroup>
        </ResizablePanel>
      </ResizableGroup>
    </div>
  );
}
