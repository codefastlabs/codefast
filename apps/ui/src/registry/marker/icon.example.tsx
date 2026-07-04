import { Marker, MarkerContent, MarkerIcon } from "@codefast/ui/marker";
import { CalendarIcon } from "lucide-react";

export function MarkerIconExample() {
  return (
    <div className="w-full max-w-sm">
      <Marker>
        <MarkerIcon>
          <CalendarIcon />
        </MarkerIcon>
        <MarkerContent>December 12</MarkerContent>
      </Marker>
    </div>
  );
}
