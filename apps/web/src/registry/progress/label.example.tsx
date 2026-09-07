import { Field, FieldLabel } from "@codefast/ui/field";
import { Progress } from "@codefast/ui/progress";

export function ProgressWithLabel() {
  return (
    <Field className="w-full max-w-sm">
      <FieldLabel htmlFor="progress-upload">
        <span>Upload progress</span>
        <span className="ms-auto">66%</span>
      </FieldLabel>
      <Progress value={66} id="progress-upload" />
    </Field>
  );
}
