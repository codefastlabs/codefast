import * as React from 'react';
import { badgeVariants, type BadgeVariantsProps } from '@/styles/badge-variants';

/* -----------------------------------------------------------------------------
 * Component: Badge
 * -------------------------------------------------------------------------- */

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & BadgeVariantsProps;

function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  return <div className={badgeVariants({ variant, className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Badge, type BadgeProps };
