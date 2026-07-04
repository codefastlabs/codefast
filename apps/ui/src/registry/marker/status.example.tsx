import { Marker, MarkerContent, MarkerIcon } from "@codefast/ui/marker";
import { Spinner } from "@codefast/ui/spinner";

export function MarkerStatus() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent>Compacting conversation…</MarkerContent>
      </Marker>
      <Marker role="status" variant="separator">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent>Running tests…</MarkerContent>
      </Marker>
    </div>
  );
}
