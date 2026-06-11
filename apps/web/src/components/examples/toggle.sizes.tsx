import { Toggle } from "@codefast/ui/toggle";
import { StarIcon } from "lucide-react";

const SIZES = ["sm", "default", "lg"] as const;

export function ToggleSizes() {
  return (
    <div className="flex items-center gap-3">
      {SIZES.map((size) => (
        <Toggle key={size} size={size} variant="outline" aria-label={`Star (${size})`}>
          <StarIcon />
        </Toggle>
      ))}
    </div>
  );
}
