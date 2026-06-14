import { InputPassword } from "@codefast/ui/input-password";
import { Label } from "@codefast/ui/label";
import { cn } from "@codefast/ui/lib/utils";
import type { ChangeEvent } from "react";
import { useState } from "react";

const LEVELS = [
  { label: "Too weak", color: "bg-rose-500" },
  { label: "Weak", color: "bg-amber-500" },
  { label: "Fair", color: "bg-yellow-500" },
  { label: "Strong", color: "bg-emerald-500" },
];

function score(value: string): number {
  let points = 0;
  if (value.length >= 8) {
    points += 1;
  }
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) {
    points += 1;
  }
  if (/\d/.test(value)) {
    points += 1;
  }
  if (/[^A-Za-z0-9]/.test(value)) {
    points += 1;
  }
  return Math.min(points, 4);
}

export function InputPasswordStrength() {
  const [value, setValue] = useState("");
  const points = score(value);
  const level = points > 0 ? LEVELS[points - 1] : undefined;

  return (
    <div className="grid w-full max-w-xs gap-1.5">
      <Label htmlFor="pw-strength">New password</Label>
      <InputPassword
        id="pw-strength"
        placeholder="Type to test strength"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
      />
      <div className="mt-1 flex gap-1">
        {LEVELS.map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index < points ? (level?.color ?? "bg-ui-border") : "bg-ui-border",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-ui-muted">{level ? level.label : "Enter a password"}</p>
    </div>
  );
}
