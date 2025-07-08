import { CheckboxGroup, CheckboxGroupItem, cn, Label } from "@codefast/ui";
import { useId } from "react";

import { GridWrapper } from "@/components/grid-wrapper";

import type { ComponentProps, JSX } from "react";

interface Plan {
  /** Mô tả ngắn về tính năng của gói dịch vụ */
  description: string;
  /** Định danh duy nhất của gói dịch vụ */
  id: string;
  /** Tên hiển thị của gói dịch vụ */
  name: string;
  /** Giá gói dịch vụ (bao gồm ký hiệu tiền tệ) */
  price: string;
  /** Xác định xem gói dịch vụ có bị vô hiệu hóa không */
  disabled?: boolean;
  /** Giá trị được sử dụng khi chọn plan (tùy chọn, nếu không có sẽ dùng id) */
  value?: string;
}

const plans: readonly Plan[] = [
  {
    id: "starter",
    name: "Starter Plan",
    description: "Perfect for small businesses getting started with our platform",
    price: "$10",
  },
  {
    id: "pro",
    name: "Pro Plan",
    description: "Advanced features for growing businesses with higher demands",
    price: "$20",
  },
  {
    id: "business",
    value: "3",
    name: "Business Plan",
    description: "Comprehensive solution for medium-sized businesses",
    price: "$50",
    disabled: true,
  },
];

export function CheckboxGroupDemo({ className, ...props }: ComponentProps<"div">): JSX.Element {
  const id = useId();
  return (
    <GridWrapper className={cn("*:grid *:place-items-center", className)} {...props}>
      <div className="">
        <CheckboxGroup>
          <div className="flex items-center gap-3">
            <CheckboxGroupItem id={`${id}-checkbox-1`} value="standard" />
            <Label htmlFor={`${id}-checkbox-1`}>Standard</Label>
          </div>
          <div className="flex items-center gap-3">
            <CheckboxGroupItem id={`${id}-checkbox-2`} value="enhanced" />
            <Label htmlFor={`${id}-checkbox-2`}>Enhanced</Label>
          </div>
          <div className="flex items-center gap-3">
            <CheckboxGroupItem id={`${id}-checkbox-3`} value="optimized" />
            <Label htmlFor={`${id}-checkbox-3`}>Optimized</Label>
          </div>
          <div className="flex items-center gap-3">
            <CheckboxGroupItem disabled id={`${id}-checkbox-4`} value="inactive" />
            <Label htmlFor={`${id}-checkbox-4`}>Inactive</Label>
          </div>
        </CheckboxGroup>
      </div>
      <div>
        <CheckboxGroup className="max-w-sm">
          {plans.map((plan) => (
            <Label
              className="hover:not-has-disabled:not-has-aria-checked:bg-secondary has-aria-checked:bg-primary/10 has-aria-checked:border-primary has-focus-visible:border-ring has-disabled:opacity-50 border-input flex items-start gap-3 rounded-lg border p-3 transition"
              key={plan.id}
            >
              <CheckboxGroupItem
                className="hover:not-disabled:not-aria-checked:border-input hover:not-disabled:not-aria-checked:aria-invalid:border-destructive disabled:opacity-100"
                disabled={plan.disabled}
                id={`${id}-plan-${plan.id}`}
                value={plan.id}
              />
              <div className="grid gap-1 font-normal">
                <div className="font-medium">{plan.name}</div>
                <div className="text-muted-foreground leading-snug">{plan.description}</div>
              </div>
            </Label>
          ))}
        </CheckboxGroup>
      </div>
    </GridWrapper>
  );
}
