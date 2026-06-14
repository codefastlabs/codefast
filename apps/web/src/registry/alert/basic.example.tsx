import { Alert, AlertDescription, AlertTitle } from "@codefast/ui/alert";
import { CheckCircle2Icon } from "lucide-react";

export function AlertBasic() {
  return (
    <Alert className="max-w-md">
      <CheckCircle2Icon />
      <AlertTitle>Account updated successfully</AlertTitle>
      <AlertDescription>
        Your profile information has been saved. Changes will be reflected immediately.
      </AlertDescription>
    </Alert>
  );
}
