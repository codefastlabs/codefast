import { ButtonGroup, ButtonGroupText } from "@codefast/ui/button-group";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@codefast/ui/input-group";
import { Label } from "@codefast/ui/label";
import { Link2Icon } from "lucide-react";

export function InputGroupButtonGroup() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <ButtonGroup>
        <ButtonGroupText asChild>
          <Label htmlFor="url">https://</Label>
        </ButtonGroupText>
        <InputGroup>
          <InputGroupInput id="url" />
          <InputGroupAddon align="inline-end">
            <Link2Icon />
          </InputGroupAddon>
        </InputGroup>
        <ButtonGroupText>.com</ButtonGroupText>
      </ButtonGroup>
    </div>
  );
}
