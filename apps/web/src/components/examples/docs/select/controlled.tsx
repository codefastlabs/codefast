import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@codefast/ui/select";

const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

export function SelectControlled() {
  const [value, setValue] = useState("apple");
  const current = FRUITS.find((fruit) => fruit.value === value);

  return (
    <div className="space-y-3 text-center">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruit</SelectLabel>
            {FRUITS.map((fruit) => (
              <SelectItem key={fruit.value} value={fruit.value}>
                {fruit.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <p className="text-xs text-ui-muted">
        Selected: <span className="font-medium text-ui-fg">{current?.label}</span>
      </p>
    </div>
  );
}
