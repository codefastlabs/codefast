import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@codefast/ui/select";

export function SelectUsage() {
  return (
    <Select>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="blueberry">Blueberry</SelectItem>
      </SelectContent>
    </Select>
  );
}
