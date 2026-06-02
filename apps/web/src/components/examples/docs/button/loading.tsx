import { Button } from "@codefast/ui/button";
import { Spinner } from "@codefast/ui/spinner";

export function ButtonLoading() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button disabled>
        <Spinner />
        Saving…
      </Button>
      <Button variant="outline" disabled>
        <Spinner />
        Please wait
      </Button>
    </div>
  );
}
