import { Marker, MarkerContent } from "@codefast/ui/marker";

export function MarkerDemo() {
  return (
    <div className="w-full max-w-sm">
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
    </div>
  );
}
