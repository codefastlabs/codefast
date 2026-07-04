import { Separator } from "@codefast/ui/separator";

export function SeparatorDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 text-sm">
      <div className="flex flex-col gap-1.5">
        <div className="leading-none font-medium text-ui-fg">@codefast/ui</div>
        <div className="text-ui-muted">The Foundation for your Design System</div>
      </div>
      <Separator />
      <div className="text-ui-fg">
        A set of beautifully designed components that you can customize, extend, and build on.
      </div>
    </div>
  );
}
