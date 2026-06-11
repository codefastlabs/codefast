import { InputGroup, InputGroupAddon, InputGroupInput } from "@codefast/ui/input-group";
import { CheckIcon } from "lucide-react";

export function InputGroupValidation() {
  return (
    <div className="w-full max-w-sm space-y-3">
      <InputGroup>
        <InputGroupInput defaultValue="ada" placeholder="Username" />
        <InputGroupAddon align="inline-end">
          <CheckIcon className="text-emerald-500" />
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon align="inline-start">@</InputGroupAddon>
        <InputGroupInput placeholder="handle" />
      </InputGroup>
    </div>
  );
}
