import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@codefast/ui/input-group";
import { CopyIcon } from "lucide-react";

export function InputGroupCopy() {
  return (
    <div className="w-full max-w-sm">
      <InputGroup>
        <InputGroupInput readOnly value="sk_live_••••••••••••••••4242" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="outline" aria-label="Copy API key">
            <CopyIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
