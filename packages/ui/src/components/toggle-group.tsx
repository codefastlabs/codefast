'use client';

import type { Scope } from '@radix-ui/react-context';
import type { ComponentProps, JSX, ReactNode } from 'react';

import { createContextScope } from '@radix-ui/react-context';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { createToggleGroupScope } from '@radix-ui/react-toggle-group';

import type { ToggleVariantsProps } from '@/variants/toggle.variants';

import { cn } from '@/lib/utils';
import { toggleVariants } from '@/variants/toggle.variants';

/* -----------------------------------------------------------------------------
 * Context: ToggleGroup
 * -------------------------------------------------------------------------- */

const TOGGLE_GROUP_NAME = 'ToggleGroup';

type ScopedProps<P> = P & { __scopeToggleGroup?: Scope };

const [createToggleGroupContext] = createContextScope(TOGGLE_GROUP_NAME, [createToggleGroupScope]);

const useToggleGroupScope = createToggleGroupScope();

const [ToggleGroupProvider, useToggleGroupContext] = createToggleGroupContext<ToggleVariantsProps>(TOGGLE_GROUP_NAME);

/* -----------------------------------------------------------------------------
 * Component: ToggleGroup
 * -------------------------------------------------------------------------- */

function ToggleGroup({
  __scopeToggleGroup,
  children,
  className,
  icon,
  size,
  variant,
  ...props
}: ScopedProps<ComponentProps<typeof ToggleGroupPrimitive.Root> & ToggleVariantsProps>): JSX.Element {
  const toggleGroupScope = useToggleGroupScope(__scopeToggleGroup);

  return (
    <ToggleGroupProvider icon={icon} scope={__scopeToggleGroup} size={size} variant={variant}>
      <ToggleGroupPrimitive.Root
        className={cn('flex items-center justify-center gap-1.5', className)}
        data-slot="toggle-group"
        {...toggleGroupScope}
        {...props}
      >
        {children}
      </ToggleGroupPrimitive.Root>
    </ToggleGroupProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ToggleGroupItem
 * -------------------------------------------------------------------------- */

const TOGGLE_GROUP_ITEM_NAME = 'ToggleGroupItem';

function ToggleGroupItem({
  __scopeToggleGroup,
  children,
  className,
  prefix,
  suffix,
  ...props
}: ScopedProps<
  Omit<ComponentProps<typeof ToggleGroupPrimitive.Item>, 'prefix'> & {
    prefix?: ReactNode;
    suffix?: ReactNode;
  }
>): JSX.Element {
  const context = useToggleGroupContext(TOGGLE_GROUP_ITEM_NAME, __scopeToggleGroup);
  const toggleGroupScope = useToggleGroupScope(__scopeToggleGroup);

  return (
    <ToggleGroupPrimitive.Item
      className={toggleVariants({ ...context, className })}
      data-slot="toggle-group-item"
      {...toggleGroupScope}
      {...props}
    >
      {prefix}
      {typeof children === 'string' ? <span className="truncate">{children}</span> : children}
      {suffix}
    </ToggleGroupPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ToggleGroup, ToggleGroupItem };
