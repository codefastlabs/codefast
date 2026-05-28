import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@codefast/ui/input-group";
import { SearchIcon } from "lucide-react";

export function InputGroupDemo() {
  return (
    <div className="w-full max-w-sm space-y-3">
      <InputGroup>
        <InputGroupText>https://</InputGroupText>
        <InputGroupInput placeholder="example.com" />
      </InputGroup>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search…" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="Amount" type="number" />
        <InputGroupButton variant="outline">USD</InputGroupButton>
      </InputGroup>
    </div>
  );
}
