import { Avatar, AvatarBadge, AvatarFallback } from "@codefast/ui/avatar";
import { Button } from "@codefast/ui/button";

/** Floating hero card styled as a code-review notification. */
export function HeroNotificationCard() {
  return (
    <div className="rounded-2xl border border-ui-border/60 bg-ui-card p-4 shadow-xl shadow-black/10 dark:shadow-black/40">
      <div className="flex items-start gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs font-semibold">ER</AvatarFallback>
          <AvatarBadge className="bg-green-600 dark:bg-green-500" />
        </Avatar>
        <div className="min-w-0 text-start">
          <p className="text-xs leading-relaxed text-ui-fg">
            <span className="font-semibold">Evan Reyes</span> approved your pull request
          </p>
          <p className="mt-0.5 truncate text-xs text-ui-muted">&ldquo;LGTM — ship it 🚀&rdquo;</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="h-7 flex-1 text-xs">
          Merge
        </Button>
        <Button size="sm" variant="outline" className="h-7 flex-1 text-xs">
          View diff
        </Button>
      </div>
    </div>
  );
}
