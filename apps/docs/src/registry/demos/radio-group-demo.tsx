import type { JSX } from 'react';

import { Label, RadioGroup, RadioGroupItem } from '@codefast/ui';

import { GridWrapper } from '@/components/grid-wrapper';

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
    id: 'starter',
    name: 'Starter Plan',
    description: 'Perfect for small businesses getting started with our platform',
    price: '$10',
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    description: 'Advanced features for growing businesses with higher demands',
    price: '$20',
  },
  {
    id: 'business',
    value: '3',
    name: 'Business Plan',
    description: 'Comprehensive solution for medium-sized businesses',
    price: '$50',
    disabled: true,
  },
];

export function RadioGroupDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:place-items-center">
      <div>
        <RadioGroup defaultValue="comfortable">
          <div className="flex items-center gap-3">
            <RadioGroupItem id="radio-group-1" value="default" />

            <Label htmlFor="radio-group-1">Default</Label>
          </div>

          <div className="flex items-center gap-3">
            <RadioGroupItem id="radio-group-2" value="comfortable" />

            <Label htmlFor="radio-group-2">Comfortable</Label>
          </div>

          <div className="flex items-center gap-3">
            <RadioGroupItem id="radio-group-3" value="compact" />

            <Label htmlFor="radio-group-3">Compact</Label>
          </div>

          <div className="flex items-center gap-3">
            <RadioGroupItem disabled id="radio-group-4" value="disabled" />

            <Label htmlFor="radio-group-4">Disabled</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <RadioGroup className="max-w-sm" defaultValue="starter">
          {plans.map((plan) => (
            <Label
              key={plan.id}
              className="hover:not-has-disabled:not-has-aria-checked:bg-secondary has-aria-checked:bg-primary/10 has-aria-checked:border-primary has-focus-visible:border-border-focus has-disabled:opacity-50 border-input group/radio-card flex items-start gap-3 rounded-lg border p-3 transition"
            >
              <RadioGroupItem
                className="shadow-none disabled:opacity-100"
                disabled={plan.disabled}
                id={plan.name}
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
