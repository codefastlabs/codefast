import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@codefast/ui/input-group";
import { SearchIcon } from "lucide-react";

export function InputGroupAddons() {
  return (
    <div className="w-full max-w-sm space-y-3">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="example.com" />
      </InputGroup>

      <InputGroup>
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search…" />
      </InputGroup>

      <InputGroup>
        <InputGroupInput type="number" placeholder="Amount" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="outline">USD</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
