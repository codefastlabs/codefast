'use client';

import type { ComponentProps, CSSProperties, JSX } from 'react';

import type { ToggleVariants } from '@/components/toggle';
import type { Scope } from '@radix-ui/react-context';

import { toggleVariants } from '@/components/toggle';
import { cn } from '@codefast/tailwind-variants';
import { createContextScope } from '@radix-ui/react-context';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { createToggleGroupScope } from '@radix-ui/react-toggle-group';

/* -----------------------------------------------------------------------------
 * Context: ToggleGroup
 * -------------------------------------------------------------------------- */

const TOGGLE_GROUP_NAME = 'ToggleGroup';

type ScopedProps<P> = P & { __scopeToggleGroup?: Scope };

const [createToggleGroupContext] = createContextScope(TOGGLE_GROUP_NAME, [createToggleGroupScope]);

const useToggleGroupScope = createToggleGroupScope();

const [ToggleGroupProvider, useToggleGroupContext] = createToggleGroupContext<
  ToggleVariants & {
    spacing?: number;
  }
>(TOGGLE_GROUP_NAME);

/* -----------------------------------------------------------------------------
 * Component: ToggleGroup
 * -------------------------------------------------------------------------- */

type ToggleGroupProps = ComponentProps<typeof ToggleGroupPrimitive.Root> &
  ToggleVariants & {
    spacing?: number;
  };

function ToggleGroup({
  __scopeToggleGroup,
  children,
  className,
  size,
  spacing = 0,
  variant,
  ...props
}: ScopedProps<ToggleGroupProps>): JSX.Element {
  const toggleGroupScope = useToggleGroupScope(__scopeToggleGroup);

  return (
    <ToggleGroupProvider scope={__scopeToggleGroup} size={size} spacing={spacing} variant={variant}>
      <ToggleGroupPrimitive.Root
        className={cn(
          'group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-lg data-[spacing=default]:data-[variant=outline]:shadow-xs',
          className,
        )}
        data-size={size}
        data-slot="toggle-group"
        data-spacing={spacing}
        data-variant={variant}
        style={{ '--gap': spacing } as CSSProperties}
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

type ToggleGroupItemProps = ScopedProps<ComponentProps<typeof ToggleGroupPrimitive.Item>>;

function ToggleGroupItem({ __scopeToggleGroup, children, className, ...props }: ToggleGroupItemProps): JSX.Element {
  const { size, spacing, variant } = useToggleGroupContext(TOGGLE_GROUP_ITEM_NAME, __scopeToggleGroup);
  const toggleGroupScope = useToggleGroupScope(__scopeToggleGroup);

  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        toggleVariants({
          className,
          size,
          variant,
        }),
        'w-auto min-w-0 shrink-0 px-3 focus:z-10 focus-visible:z-10',
        'data-[spacing=0]:rounded-none data-[spacing=0]:shadow-none data-[spacing=0]:first:rounded-l-lg data-[spacing=0]:last:rounded-r-lg data-[spacing=0]:data-[variant=outline]:border-l-0 data-[spacing=0]:data-[variant=outline]:first:border-l',
      )}
      data-size={size}
      data-slot="toggle-group-item"
      data-spacing={spacing}
      data-variant={variant}
      {...toggleGroupScope}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ToggleGroup, ToggleGroupItem };
export type { ToggleGroupItemProps, ToggleGroupProps };
