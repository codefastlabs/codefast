import { Separator } from "@codefast/ui/separator";

export function SeparatorUsage() {
  return (
    <div>
      <p className="text-sm">Above the line</p>
      <Separator className="my-4" />
      <p className="text-sm">Below the line</p>
    </div>
  );
}
