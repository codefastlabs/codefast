import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";

export function LabelRequired() {
  return (
    <div className="w-full max-w-xs space-y-1.5">
      <Label htmlFor="label-required-name">
        Full name
        <span className="text-rose-500" aria-hidden>
          *
        </span>
      </Label>
      <Input id="label-required-name" required aria-required placeholder="Ada Lovelace" />
      <p className="text-xs text-ui-muted">Required — shown to other members.</p>
    </div>
  );
}
