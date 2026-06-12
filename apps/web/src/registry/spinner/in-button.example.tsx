import { Button } from "@codefast/ui/button";
import { Spinner } from "@codefast/ui/spinner";

export function SpinnerInButton() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <Button disabled>
        <Spinner />
        Saving…
      </Button>
      <Spinner className="size-5 text-ui-brand">Loading content</Spinner>
    </div>
  );
}
