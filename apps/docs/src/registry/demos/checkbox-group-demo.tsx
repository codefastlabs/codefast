import type { ComponentProps, JSX } from 'react';

import { CheckboxGroup, CheckboxGroupItem, cn, Label } from '@codefast/ui';

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

export function CheckboxGroupDemo({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <GridWrapper className={cn('*:grid *:place-items-center', className)} {...props}>
      <div className="">
        <CheckboxGroup>
          <div className="flex items-center gap-3">
            <CheckboxGroupItem id="checkbox-group-1" value="standard" />
            <Label htmlFor="checkbox-group-1">Standard</Label>
          </div>
          <div className="flex items-center gap-3">
            <CheckboxGroupItem id="checkbox-group-2" value="enhanced" />
            <Label htmlFor="checkbox-group-2">Enhanced</Label>
          </div>
          <div className="flex items-center gap-3">
            <CheckboxGroupItem id="checkbox-group-3" value="optimized" />
            <Label htmlFor="checkbox-group-3">Optimized</Label>
          </div>
          <div className="flex items-center gap-3">
            <CheckboxGroupItem disabled id="checkbox-group-4" value="inactive" />
            <Label htmlFor="checkbox-group-4">Inactive</Label>
          </div>
        </CheckboxGroup>
      </div>
      <div>
        <CheckboxGroup className="max-w-sm">
          {plans.map((plan) => (
            <Label
              key={plan.id}
              className="hover:not-has-disabled:not-has-aria-checked:bg-secondary has-aria-checked:bg-primary/10 has-aria-checked:border-primary has-focus-visible:border-ring has-disabled:opacity-50 border-input group/checkbox-card flex items-start gap-3 rounded-lg border p-3 transition"
            >
              <CheckboxGroupItem
                className="disabled:opacity-100"
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
        </CheckboxGroup>
      </div>
    </GridWrapper>
  );
}
