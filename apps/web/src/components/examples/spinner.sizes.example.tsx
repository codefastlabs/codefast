import { Spinner } from "@codefast/ui/spinner";

export function SpinnerSizes() {
  return (
    <div className="flex items-center gap-6 text-ui-fg">
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8 text-ui-brand" />
    </div>
  );
}
