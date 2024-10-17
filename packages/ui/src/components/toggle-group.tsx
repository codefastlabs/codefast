'use client';

import { createContextScope, type Scope } from '@radix-ui/react-context';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { createToggleGroupScope } from '@radix-ui/react-toggle-group';
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';
import {
  toggleVariants,
  type ToggleVariantsProps,
} from '@/styles/toggle-variants';

/* -----------------------------------------------------------------------------
 * Component: ToggleGroup
 * -------------------------------------------------------------------------- */

const TOGGLE_GROUP_NAME = 'ToggleGroup';

type ScopedProps<P> = P & { __scopeToggleGroup?: Scope };

const [createToggleGroupContext] = createContextScope(TOGGLE_GROUP_NAME, [
  createToggleGroupScope,
]);

const useToggleGroupScope = createToggleGroupScope();

const [ToggleGroupProvider, useToggleGroupContext] =
  createToggleGroupContext<ToggleVariantsProps>(TOGGLE_GROUP_NAME);

type ToggleGroupElement = ComponentRef<typeof ToggleGroupPrimitive.Root>;
type ToggleGroupProps = ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Root
> &
  ToggleVariantsProps;

const ToggleGroup = forwardRef<ToggleGroupElement, ToggleGroupProps>(
  (
    {
      __scopeToggleGroup,
      children,
      className,
      variant,
      size,
      icon,
      ...props
    }: ScopedProps<ToggleGroupProps>,
    forwardedRef,
  ) => {
    const toggleGroupScope = useToggleGroupScope(__scopeToggleGroup);

    return (
      <ToggleGroupProvider
        icon={icon}
        scope={__scopeToggleGroup}
        size={size}
        variant={variant}
      >
        <ToggleGroupPrimitive.Root
          ref={forwardedRef}
          className={cn('flex items-center justify-center gap-1', className)}
          {...toggleGroupScope}
          {...props}
        >
          {children}
        </ToggleGroupPrimitive.Root>
      </ToggleGroupProvider>
    );
  },
);

ToggleGroup.displayName = TOGGLE_GROUP_NAME;

/* -----------------------------------------------------------------------------
 * Component: ToggleGroupItem
 * -------------------------------------------------------------------------- */

const TOGGLE_GROUP_ITEM_NAME = 'ToggleGroupItem';

type ToggleGroupItemElement = ComponentRef<typeof ToggleGroupPrimitive.Item>;
interface ToggleGroupItemProps
  extends Omit<
    ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
    'prefix'
  > {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

const ToggleGroupItem = forwardRef<
  ToggleGroupItemElement,
  ToggleGroupItemProps
>(
  (
    {
      __scopeToggleGroup,
      children,
      prefix,
      suffix,
      className,
      ...props
    }: ScopedProps<ToggleGroupItemProps>,
    forwardedRef,
  ) => {
    const context = useToggleGroupContext(
      TOGGLE_GROUP_ITEM_NAME,
      __scopeToggleGroup,
    );
    const toggleGroupScope = useToggleGroupScope(__scopeToggleGroup);

    return (
      <ToggleGroupPrimitive.Item
        ref={forwardedRef}
        className={toggleVariants({ ...context, className })}
        {...toggleGroupScope}
        {...props}
      >
        {prefix}
        {typeof children === 'string' ? (
          <span className="truncate">{children}</span>
        ) : (
          children
        )}
        {suffix}
      </ToggleGroupPrimitive.Item>
    );
  },
);

ToggleGroupItem.displayName = TOGGLE_GROUP_ITEM_NAME;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  ToggleGroup,
  ToggleGroupItem,
  type ToggleGroupItemProps,
  type ToggleGroupProps,
};
