import { type JSX, useId } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import { Label, RadioGroup, RadioGroupItem } from "@codefast/ui";

interface Plan {
  /** Mô tả ngắn về tính năng của gói dịch vụ */
  description: string;
  /** Xác định xem gói dịch vụ có bị vô hiệu hóa không */
  disabled?: boolean;
  /** Định danh duy nhất của gói dịch vụ */
  id: string;
  /** Tên hiển thị của gói dịch vụ */
  name: string;
  /** Giá gói dịch vụ (bao gồm ký hiệu tiền tệ) */
  price: string;
  /** Giá trị được sử dụng khi chọn plan (tùy chọn, nếu không có sẽ dùng id) */
  value?: string;
}

const plans: readonly Plan[] = [
  {
    description: "Perfect for small businesses getting started with our platform",
    id: "starter",
    name: "Starter Plan",
    price: "$10",
  },
  {
    description: "Advanced features for growing businesses with higher demands",
    id: "pro",
    name: "Pro Plan",
    price: "$20",
  },
  {
    description: "Comprehensive solution for medium-sized businesses",
    disabled: true,
    id: "business",
    name: "Business Plan",
    price: "$50",
    value: "3",
  },
];

export function RadioGroupDemo(): JSX.Element {
  const id = useId();
  return (
    <GridWrapper className="*:grid *:place-items-center">
      <div>
        <RadioGroup>
          <div className="flex items-center gap-3">
            <RadioGroupItem id={`${id}-radio-group-1`} value="default" />
            <Label htmlFor={`${id}-radio-group-1`}>Default</Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem id={`${id}-radio-group-2`} value="comfortable" />
            <Label htmlFor={`${id}-radio-group-2`}>Comfortable</Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem id={`${id}-radio-group-3`} value="compact" />
            <Label htmlFor={`${id}-radio-group-3`}>Compact</Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem disabled id={`${id}-radio-group-4`} value="disabled" />
            <Label htmlFor={`${id}-radio-group-4`}>Disabled</Label>
          </div>
        </RadioGroup>
      </div>
      <div>
        <RadioGroup className="max-w-sm">
          {plans.map((plan) => (
            <Label
              key={plan.id}
              className="hover:not-has-disabled:not-has-aria-checked:bg-secondary has-aria-checked:bg-primary/10 has-aria-checked:border-primary has-focus-visible:border-ring has-disabled:opacity-50 border-input group/radio-card flex items-start gap-3 rounded-lg border p-3 transition"
            >
              <RadioGroupItem
                className="hover:not-disabled:not-aria-checked:border-input hover:not-disabled:not-aria-checked:aria-invalid:border-destructive disabled:opacity-100"
                disabled={plan.disabled}
                id={`${id}-${plan.name}`}
                value={plan.id}
              />
              <div className="grid gap-1 font-normal">
                <div className="font-medium">{plan.name}</div>
                <div className="text-muted-foreground leading-snug">{plan.description}</div>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>
    </GridWrapper>
  );
}
