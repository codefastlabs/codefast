import { Field, FieldDescription, FieldLabel } from "@codefast/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@codefast/ui/select";

export function FieldWithSelect() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel htmlFor="field-role">Role</FieldLabel>
      <Select>
        <SelectTrigger id="field-role" className="w-full">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Role</SelectLabel>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldDescription>Controls what this person can access.</FieldDescription>
    </Field>
  );
}
