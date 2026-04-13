import { cn } from "@codefast/tailwind-variants";
import { Badge } from "@codefast/ui/badge";
import { AlertCircleIcon, ArrowRightIcon, CheckIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function BadgeDemo() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex w-full flex-wrap gap-2">
        <Badge>Badge</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="outline">
          <CheckIcon />
          Badge
        </Badge>
        <Badge variant="destructive">
          <AlertCircleIcon />
          Alert
        </Badge>
        <Badge className={cn("h-5 min-w-5 px-1", "rounded-full", "font-mono tabular-nums")}>
          8
        </Badge>
        <Badge
          className={cn("h-5 min-w-5 px-1", "rounded-full", "font-mono tabular-nums")}
          variant="destructive"
        >
          99
        </Badge>
        <Badge
          className={cn("h-5 min-w-5 px-1", "rounded-full", "font-mono tabular-nums")}
          variant="outline"
        >
          20+
        </Badge>
      </div>
      <div className="flex w-full flex-wrap gap-2">
        <Badge asChild>
          <Link to="/">
            Link <ArrowRightIcon />
          </Link>
        </Badge>
        <Badge asChild variant="secondary">
          <Link to="/">
            Link <ArrowRightIcon />
          </Link>
        </Badge>
        <Badge asChild variant="destructive">
          <Link to="/">
            Link <ArrowRightIcon />
          </Link>
        </Badge>
        <Badge asChild variant="outline">
          <Link to="/">
            Link <ArrowRightIcon />
          </Link>
        </Badge>
      </div>
    </div>
  );
}
