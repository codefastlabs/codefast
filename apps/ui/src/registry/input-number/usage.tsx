import { InputNumber, InputNumberField, InputNumberStepper } from "@codefast/ui/input-number";

export function InputNumberUsage() {
  return (
    <InputNumber defaultValue={1}>
      <InputNumberField />
      <InputNumberStepper />
    </InputNumber>
  );
}
