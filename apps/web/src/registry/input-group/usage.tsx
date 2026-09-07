import { InputGroup, InputGroupAddon, InputGroupInput } from "@codefast/ui/input-group";
import { SearchIcon } from "lucide-react";

export function InputGroupUsage() {
  return (
    <InputGroup>
      <InputGroupInput placeholder="Search..." />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  );
}
