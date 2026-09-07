import { InputGroup, InputGroupAddon, InputGroupInput } from "@codefast/ui/input-group";
import { SearchIcon } from "lucide-react";

export function InputGroupDemo() {
  return (
    <InputGroup className="w-full max-w-xs">
      <InputGroupInput placeholder="Search..." />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">12 results</InputGroupAddon>
    </InputGroup>
  );
}
