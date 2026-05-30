import { cn } from "@codefast/tailwind-variants";
import { Textarea } from "@codefast/ui/textarea";

export function TextareaDemo() {
  return (
    <Textarea
      placeholder="Tell us about yourself…"
      className={cn("max-w-xs", "resize-none")}
      rows={3}
    />
  );
}
