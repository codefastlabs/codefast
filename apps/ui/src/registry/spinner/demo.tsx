import { Button } from "@codefast/ui/button";
import { Spinner } from "@codefast/ui/spinner";

export function SpinnerDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4">
      <Button disabled>
        <Spinner className="size-4" />
        Saving changes…
      </Button>
      <div className="flex items-center gap-2 text-sm text-ui-muted">
        <Spinner className="size-4" />
        Fetching your data
      </div>
    </div>
  );
}
