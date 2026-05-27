import { Alert, AlertDescription, AlertTitle } from "@codefast/ui/alert";
import { AlertTriangleIcon, InfoIcon } from "lucide-react";

export function AlertDemo() {
  return (
    <div className="w-full max-w-sm space-y-3">
      <Alert>
        <InfoIcon />
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>You can add components using the CLI.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>Session expired</AlertTitle>
        <AlertDescription>Please log in again.</AlertDescription>
      </Alert>
    </div>
  );
}
