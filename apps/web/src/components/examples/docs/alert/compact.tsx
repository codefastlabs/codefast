import { Alert, AlertTitle } from "@codefast/ui/alert";
import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";

export function AlertCompact() {
  return (
    <div className="w-full max-w-sm space-y-3">
      <Alert>
        <CircleCheckIcon />
        <AlertTitle>Your changes were saved.</AlertTitle>
      </Alert>
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>We couldn’t save your changes.</AlertTitle>
      </Alert>
    </div>
  );
}
