import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@codefast/ui/select";

export function SelectDemo() {
  return (
    <Select>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Choose framework" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="react">React</SelectItem>
        <SelectItem value="vue">Vue</SelectItem>
        <SelectItem value="svelte">Svelte</SelectItem>
        <SelectItem value="solid">Solid</SelectItem>
      </SelectContent>
    </Select>
  );
}
