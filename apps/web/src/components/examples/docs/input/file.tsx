import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";

export function InputFile() {
  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="input-file">Upload avatar</Label>
      <Input id="input-file" type="file" accept="image/*" />
    </div>
  );
}
