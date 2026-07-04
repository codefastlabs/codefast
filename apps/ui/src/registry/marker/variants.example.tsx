import { Marker, MarkerContent } from "@codefast/ui/marker";

export function MarkerVariants() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Marker>
        <MarkerContent>Default — a plain inline label</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Separator</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerContent>Border</MarkerContent>
      </Marker>
    </div>
  );
}
