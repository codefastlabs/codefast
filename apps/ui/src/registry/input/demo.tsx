import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";

export function InputDemo() {
  return (
    <div className="w-full max-w-xs space-y-3">
      <div className="grid gap-1.5">
        <Label htmlFor="demo-email">Email address</Label>
        <Input id="demo-email" type="email" placeholder="you@example.com" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="demo-password">Password</Label>
        <Input id="demo-password" type="password" placeholder="••••••••" />
      </div>
    </div>
  );
}
